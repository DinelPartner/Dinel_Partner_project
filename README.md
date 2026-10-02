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
```bash
npm run build
```

## Structure
- `/src/pages/sv` - Swedish content (Source of Truth)
- `/src/pages/en` - English translation
- `/src/components` - Reusable UI components (React + Astro)
- `/src/styles` - Global CSS & Tailwind config

## Key Features
- **Astro + React Hybrid**: Static speed with interactive islands.
- **Internationalization**: `/sv/` and `/en/` routing.
- **Premium Design System**: "Engineering Tech" aesthetic.
- **Contact Form**: React validation + Mocked API endpoint.

## Environment Variables
Create a `.env` file for production:
```
PUBLIC_TURNSTILE_SITE_KEY=...
CLOUDFLARE_TURNSTILE_SECRET=...
RESEND_API_KEY=...
```
