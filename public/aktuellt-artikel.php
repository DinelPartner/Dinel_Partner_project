<?php
/**
 * Single blog article page, server-rendered in PHP (so title/meta tags are
 * present at response time for SEO/social previews — this is the one place
 * on the blog where a server-side proxy to the cms-admin panel's public API
 * is worth it; the list/grid view (NewsSection.astro) fetches the API
 * directly from the browser instead, see that file's own comment).
 *
 * URL: /sv/aktuellt/<slug>/ and /en/aktuellt/<slug>/ rewritten here by
 * .htaccess as /aktuellt-artikel.php?slug=<slug>&lang=sv|en
 */

require __DIR__ . '/aktuellt-proxy.php';

$slug = isset($_GET['slug']) ? $_GET['slug'] : '';
$lang = (isset($_GET['lang']) && $_GET['lang'] === 'en') ? 'en' : 'sv';

// Mirror the slug shape the panel itself validates on write.
if (!preg_match('/^[a-z0-9]+(-[a-z0-9]+)*$/', $slug)) {
    http_response_code(404);
    include __DIR__ . '/404.html';
    exit;
}

$post = cms_fetch('/api/posts/' . rawurlencode($slug));

if (!$post || empty($post['published'])) {
    http_response_code(404);
    include __DIR__ . '/404.html';
    exit;
}

$t = $post[$lang] ?? $post['sv'];
$otherLang = $lang === 'sv' ? 'en' : 'sv';

$copy = $lang === 'en'
    ? ['back' => '← All news', 'skip' => 'Skip to main content', 'menuOpen' => 'Open menu', 'cta' => 'Request a quote', 'offertHref' => '/en/choose-quote']
    : ['back' => '← Alla aktualiteter', 'skip' => 'Hoppa till innehållet', 'menuOpen' => 'Öppna meny', 'cta' => 'Begär offert', 'offertHref' => '/valj-offert'];

$navItems = $lang === 'en'
    ? [['About', '/en/#om-oss'], ['Services', '/en/#tjanster'], ['References', '/en/#referenser'], ['News', '/en/aktuellt/'], ['Process', '/en/#process'], ['Contact', '/en/#kontakt']]
    : [['Om oss', '/sv/#om-oss'], ['Tjänster', '/sv/#tjanster'], ['Referensjobb', '/sv/#referenser'], ['Aktuellt', '/sv/aktuellt/'], ['Process', '/sv/#process'], ['Kontakt', '/sv/#kontakt']];

$footer = $lang === 'en'
    ? [
        'tagline' => 'Your local electrical partner for safe installations, EV chargers and heat pumps across greater Stockholm.',
        'quickTitle' => 'Quick links',
        'servicesTitle' => 'Our services',
        'services' => ['Electrical installations', 'EV charger', 'Panel replacement', 'Service & troubleshooting'],
        'contactTitle' => 'Contact',
        'privacy' => 'Privacy Policy',
        'privacyHref' => '/en/privacy-policy',
    ]
    : [
        'tagline' => 'Din lokala elpartner för trygga elinstallationer, laddboxar och värmepumpar i hela Storstockholm.',
        'quickTitle' => 'Snabblänkar',
        'servicesTitle' => 'Våra tjänster',
        'services' => ['Elinstallationer', 'Laddbox för elbil', 'Byte av elcentral', 'Service & felsökning'],
        'contactTitle' => 'Kontakt',
        'privacy' => 'Integritetspolicy',
        'privacyHref' => '/sv/integritetspolicy',
    ];

function h($s) { return htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8'); }

function format_date($dateStr, $lang) {
    $ts = strtotime($dateStr);
    if (!$ts) return h($dateStr);
    $monthsSv = ['januari','februari','mars','april','maj','juni','juli','augusti','september','oktober','november','december'];
    $monthsEn = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    $months = $lang === 'en' ? $monthsEn : $monthsSv;
    return (int) date('j', $ts) . ' ' . $months[(int) date('n', $ts) - 1] . ' ' . date('Y', $ts);
}

// Markdown body -> simple paragraph HTML (post content is always
// plain paragraphs separated by blank lines, same convention as the panel's
// editor placeholder text asks authors to follow).
function render_markdown_paragraphs($md) {
    $paragraphs = preg_split('/\n\s*\n/', trim($md));
    $html = '';
    foreach ($paragraphs as $p) {
        $p = trim($p);
        if ($p === '') continue;
        $html .= '<p>' . nl2br(h($p)) . '</p>';
    }
    return $html;
}

// Pick up whatever hashed Tailwind/global CSS bundle the current Astro
// build produced, instead of hardcoding a filename that changes every
// `npm run build` — robust to rebuilds without touching this file.
$cssFiles = glob(__DIR__ . '/_astro/*.css') ?: [];
sort($cssFiles);

$otherLangHref = "/$otherLang/aktuellt/" . rawurlencode($slug) . '/';
?>
<!doctype html>
<html lang="<?= h($lang) ?>" class="scroll-smooth">
<head>
<meta charset="UTF-8" />
<meta name="description" content="<?= h($t['excerpt']) ?>" />
<meta name="viewport" content="width=device-width" />
<link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
<link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
<link rel="icon" type="image/png" sizes="192x192" href="/favicon-192x192.png" />
<link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
<title><?= h($t['title']) ?> – Din Elpartner</title>
<meta property="og:title" content="<?= h($t['title']) ?>" />
<meta property="og:description" content="<?= h($t['excerpt']) ?>" />
<meta property="og:image" content="<?= h($post['image']) ?>" />
<meta property="og:type" content="article" />
<?php foreach ($cssFiles as $cssFile): ?>
<link rel="stylesheet" href="/_astro/<?= h(basename($cssFile)) ?>">
<?php endforeach; ?>
</head>
<body class="bg-white text-gray-900 selection:bg-accent selection:text-white">
<a href="#main-content" class="skip-link"><?= h($copy['skip']) ?></a>

<header class="site-header fixed top-0 left-0 right-0 z-50 transition-all duration-300" id="site-header">
  <div class="container mx-auto px-5 md:px-8 flex justify-between items-center">
    <a href="/<?= h($lang) ?>/" class="flex items-center gap-3 group">
      <img src="/logo.png" alt="Din Elpartner Logo" class="h-11 w-11 object-contain" />
      <span class="text-lg font-bold tracking-tight text-gray-900 group-hover:text-accent transition-colors leading-tight">DIN<span class="text-accent">ELPARTNER</span><small class="block text-[9px] tracking-[0.22em] text-gray-500 font-semibold">SVERIGE AB</small></span>
    </a>
    <nav class="hidden md:flex items-center gap-7">
      <?php foreach ($navItems as [$label, $href]): ?>
        <a href="<?= h($href) ?>" class="nav-link text-sm font-medium text-gray-600 hover:text-accent transition-colors uppercase tracking-wider"><?= h($label) ?></a>
      <?php endforeach; ?>
      <div class="h-4 w-px bg-gray-200 mx-1"></div>
      <a href="<?= h($otherLangHref) ?>" class="flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-accent transition-colors">
        <span>🌐</span><?= $lang === 'sv' ? 'EN' : 'SV' ?>
      </a>
      <a href="tel:+46700235436" class="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-accent transition-colors">
        <span>📞</span><span>070-023 54 36</span>
      </a>
      <a href="<?= h($copy['offertHref']) ?>" class="button button-primary button-sm"><?= h($copy['cta']) ?></a>
    </nav>
    <button class="md:hidden text-light" id="mobile-menu-btn" aria-label="<?= h($copy['menuOpen']) ?>" aria-expanded="false">☰</button>
  </div>
  <div class="md:hidden absolute top-full left-0 right-0 bg-white border-b border-gray-100 p-6 flex-col gap-4 shadow-xl" id="mobile-menu" style="display:none;">
    <?php foreach ($navItems as [$label, $href]): ?>
      <a href="<?= h($href) ?>" class="text-lg font-medium text-light hover:text-accent" style="display:block;margin-bottom:.75rem;"><?= h($label) ?></a>
    <?php endforeach; ?>
    <div class="h-px bg-gray-100 my-2"></div>
    <a href="<?= h($copy['offertHref']) ?>" class="button button-primary" style="display:block;text-align:center;"><?= h($copy['cta']) ?></a>
  </div>
</header>

<main id="main-content" class="relative z-10">
  <article class="news-article">
    <div class="container">
      <a class="section-link" href="/<?= h($lang) ?>/aktuellt/"><?= h($copy['back']) ?></a>
      <div class="article-meta">
        <span><?= h($t['category']) ?></span>
        <time><?= format_date($post['date'], $lang) ?></time>
      </div>
      <h1><?= h($t['title']) ?></h1>
      <?php if (!empty($post['image'])): ?>
        <img src="<?= h($post['image']) ?>" alt="<?= h($t['title']) ?>" />
      <?php endif; ?>
      <p class="article-lead"><?= h($t['excerpt']) ?></p>
      <div class="article-body">
        <?= render_markdown_paragraphs($t['content']) ?>
      </div>
    </div>
  </article>
</main>

<footer class="site-footer">
  <div class="container mx-auto px-5 md:px-8">
    <div class="footer-top">
      <div>
        <div class="footer-brand-logo">
          <img src="/logo.png" alt="Din Elpartner" class="h-10 w-10 object-contain">
          <span>DIN<b>ELPARTNER</b></span>
        </div>
        <p class="tagline"><?= h($footer['tagline']) ?></p>
      </div>
      <div class="footer-col">
        <h4><?= h($footer['quickTitle']) ?></h4>
        <ul>
          <?php foreach ($navItems as [$label, $href]): ?>
            <li><a href="<?= h($href) ?>"><?= h($label) ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <div class="footer-col">
        <h4><?= h($footer['servicesTitle']) ?></h4>
        <ul>
          <?php foreach ($footer['services'] as $s): ?>
            <li><a href="/<?= h($lang) ?>/#tjanster"><?= h($s) ?></a></li>
          <?php endforeach; ?>
        </ul>
      </div>
      <div class="footer-col">
        <h4><?= h($footer['contactTitle']) ?></h4>
        <ul>
          <li class="contact-line"><span>📞</span> <a href="tel:+46700235436">070-023 54 36</a></li>
          <li class="contact-line"><span>✉️</span> <a href="mailto:info@dinelpartner.se">info@dinelpartner.se</a></li>
          <li class="contact-line"><span>📍</span> Alängsvägen 16, 123 52 Farsta</li>
        </ul>
      </div>
    </div>
    <div class="footer-bottom">
      <span>© <?= date('Y') ?> Din Elpartner Sverige AB. All rights reserved.</span>
      <div class="flex items-center gap-6">
        <a href="<?= h($footer['privacyHref']) ?>"><?= h($footer['privacy']) ?></a>
        <span class="opacity-60">Alängsvägen 16, 123 52 Farsta</span>
      </div>
    </div>
  </div>
</footer>

<script>
  // Minimal vanilla-JS equivalents of the two bits of Header interactivity
  // (scroll shadow + mobile menu toggle) — this page is plain PHP, not an
  // Astro/React island, so it doesn't hydrate; same visual result though.
  window.addEventListener('scroll', function () {
    document.getElementById('site-header').classList.toggle('is-scrolled', window.scrollY > 50);
  });
  var btn = document.getElementById('mobile-menu-btn');
  var menu = document.getElementById('mobile-menu');
  btn.addEventListener('click', function () {
    var open = menu.style.display === 'flex';
    menu.style.display = open ? 'none' : 'flex';
    btn.setAttribute('aria-expanded', String(!open));
  });
</script>
</body>
</html>
