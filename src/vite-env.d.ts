/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_LOCAL_DEVELOPMENT?: string
  readonly VITE_POCKETBASE_URL: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
