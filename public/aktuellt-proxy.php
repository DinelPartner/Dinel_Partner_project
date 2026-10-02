<?php
/**
 * Thin proxy + local cache in front of the cms-admin Vercel panel's PUBLIC
 * read API (GET /api/posts, GET /api/posts/{slug}).
 *
 * Why this exists at all (defense in depth): the blog's public API already
 * has its own cache (Vercel edge Cache-Control + an in-memory Map) and CORS
 * restricted to this domain, so the browser *could* call it directly for a
 * card grid (and NewsSection.astro does exactly that client-side). But any
 * SERVER-SIDE PHP page that needs the data at render time (for SEO meta
 * tags, see aktuellt-artikel.php) benefits from not adding an extra external
 * HTTP round-trip to every single page view, and from not depending on the
 * Vercel API being reachable/fast at that exact moment — hence a local,
 * file-based cache on the one.com server itself, re-fetched only every 60s.
 *
 * PLACEHOLDER: fill in the real cms-admin Vercel deployment URL once the
 * client has deployed it (see repo root README / project report §12/§14).
 */

define('CMS_API_BASE', 'https://PLACEHOLDER-cms-admin.vercel.app');
define('CMS_CACHE_TTL', 60); // seconds, mirrors the panel's own s-maxage=60

/**
 * Fetch (with local caching) a JSON path from the cms-admin public API.
 * $path example: '/api/posts' or '/api/posts/sa-valjer-du-ratt-laddbox'
 * Returns the decoded JSON (array), or null on failure / 404.
 */
function cms_fetch($path) {
    $cacheDir = cms_cache_dir();
    $cacheKey = preg_replace('/[^a-zA-Z0-9_-]/', '_', $path);
    $cacheFile = $cacheDir ? ($cacheDir . '/' . $cacheKey . '.json') : null;

    if ($cacheFile && file_exists($cacheFile) && (time() - filemtime($cacheFile)) < CMS_CACHE_TTL) {
        $cached = @file_get_contents($cacheFile);
        if ($cached !== false) {
            $decoded = json_decode($cached, true);
            if ($decoded !== null || $cached === 'null') {
                return $decoded;
            }
        }
    }

    $url = rtrim(CMS_API_BASE, '/') . $path;
    $json = cms_http_get($url);
    if ($json === null) {
        // Fetch failed — serve a stale cache entry if we have one rather than
        // breaking the page entirely.
        if ($cacheFile && file_exists($cacheFile)) {
            $stale = @file_get_contents($cacheFile);
            if ($stale !== false) {
                return json_decode($stale, true);
            }
        }
        return null;
    }

    if ($cacheFile) {
        @file_put_contents($cacheFile, $json);
    }

    return json_decode($json, true);
}

/** Returns a writable cache directory, or null if none could be created/used. */
function cms_cache_dir() {
    static $dir = false;
    if ($dir !== false) return $dir;

    $candidate = __DIR__ . '/cache/cms';
    if (!is_dir($candidate)) {
        @mkdir($candidate, 0755, true);
    }
    if (is_dir($candidate) && is_writable($candidate)) {
        $dir = $candidate;
        return $dir;
    }

    // Fall back to the system temp dir if the webroot isn't writable on this host.
    $tmp = sys_get_temp_dir() . '/dinelpartner-cms-cache';
    if (!is_dir($tmp)) {
        @mkdir($tmp, 0755, true);
    }
    if (is_dir($tmp) && is_writable($tmp)) {
        $dir = $tmp;
        return $dir;
    }

    $dir = null;
    return $dir;
}

/** GET a URL and return the raw response body, or null on any failure (non-2xx, timeout, etc). */
function cms_http_get($url) {
    if (function_exists('curl_init')) {
        $ch = curl_init($url);
        curl_setopt_array($ch, [
            CURLOPT_RETURNTRANSFER => true,
            CURLOPT_TIMEOUT => 5,
            CURLOPT_CONNECTTIMEOUT => 3,
            CURLOPT_HTTPHEADER => ['Accept: application/json'],
        ]);
        $body = curl_exec($ch);
        $status = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        $error = curl_error($ch);
        curl_close($ch);
        if ($body === false || $error || $status < 200 || $status >= 300) {
            return null;
        }
        return $body;
    }

    // Fallback for hosts without the curl extension enabled.
    $context = stream_context_create([
        'http' => ['method' => 'GET', 'header' => "Accept: application/json\r\n", 'timeout' => 5, 'ignore_errors' => true],
    ]);
    $body = @file_get_contents($url, false, $context);
    if ($body === false) return null;
    if (isset($http_response_header[0]) && !preg_match('/\s(2\d\d)\s/', $http_response_header[0])) {
        return null;
    }
    return $body;
}

// Allow calling this file directly as a generic JSON pass-through proxy too,
// e.g. /aktuellt-proxy.php?path=/api/posts (kept simple, only used for
// manual debugging — the site itself only ever `require`s this file).
if (basename($_SERVER['SCRIPT_FILENAME']) === basename(__FILE__)) {
    header('Content-Type: application/json');
    $path = isset($_GET['path']) ? $_GET['path'] : '/api/posts';
    if (strpos($path, '/') !== 0) {
        http_response_code(400);
        echo json_encode(['error' => 'path must start with /']);
        exit;
    }
    $data = cms_fetch($path);
    if ($data === null) {
        http_response_code(502);
        echo json_encode(['error' => 'Could not reach the CMS API']);
        exit;
    }
    echo json_encode($data);
}
