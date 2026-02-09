interface ImportMetaEnv {
  readonly DIRECTUS_URL: string;
  readonly PUBLIC_ENABLE_CMS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
