interface ImportMetaEnv {
  readonly DIRECTUS_URL: string;
  readonly ENABLE_CMS: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
