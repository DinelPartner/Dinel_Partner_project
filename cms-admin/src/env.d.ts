/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly GITHUB_TOKEN: string;
  readonly GITHUB_OWNER: string;
  readonly GITHUB_REPO: string;
  readonly GITHUB_BRANCH: string;
  readonly ADMIN_PASSWORD: string;
  readonly SESSION_SECRET: string;
  readonly ALLOWED_ORIGIN: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
