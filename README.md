# Din Elpartner - Premium Website

## Setup
1. Install dependencies:
   ```bash
   npm install
   ```
2. Start development server:
   ```bash
   npm run dev
   ```

## Production Build
This site builds as plain static HTML (`output: 'static'`, the Astro default) for upload to one.com:
```bash
npm run build
```
The result in `dist/client/` (and the PHP files already present in `public/`, which Astro copies through untouched) is what gets uploaded to one.com via FTP/file manager — there is no server runtime on one.com, only Apache + PHP (`mail()`).

## Structure
- `/src/pages/sv` - Swedish content (Source of Truth)
- `/src/pages/en` - English translation
- `/src/components` - Reusable UI components (React + Astro)
- `/src/styles` - Global CSS & Tailwind config
- `/public/kontakt.php`, `/public/offert-mail.php`, `/public/offert-ac-mail.php` - PHP `mail()` handlers for the contact/quote forms (one.com-compatible, no Node/Vercel runtime involved)
- `/public/aktuellt-proxy.php`, `/public/aktuellt-artikel.php` - PHP proxies that fetch blog content from the separate `cms-admin/` panel's public API (see below) and cache it locally
- `/public/.htaccess` - legacy redirects, clean-URL rewriting, blog article rewrite, custom 404

## Blog admin (separate app)
The blog's admin panel is **not** part of this Astro project. It lives in `../cms-admin/`, a separate small Astro app deployed on Vercel (Root Directory = `cms-admin`), backed by GitHub (Contents API) for storage — see `cms-admin/README.md`. This site only ever talks to it over read-only public HTTP endpoints; no build-time coupling exists between the two apps.

## Key Features
- **Astro + React Hybrid**: Static speed with interactive islands.
- **Internationalization**: `/sv/` and `/en/` routing.
- **Premium Design System**: "Engineering Tech" aesthetic.
- **Contact Form**: React form submitting to `kontakt.php` (PHP `mail()`, reCAPTCHA v2 verified server-side).
