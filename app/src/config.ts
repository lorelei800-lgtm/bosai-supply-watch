/**
 * Re:Earth CMS configuration — read from VITE_* env vars at build time.
 *
 * Public (citizen) build:  VITE_CMS_TOKEN is empty → CMS.writable = false
 * Admin build:             VITE_CMS_TOKEN is set   → CMS.writable = true
 */
export const CMS = {
  baseUrl:      import.meta.env.VITE_CMS_BASE_URL    as string | undefined,
  project:      import.meta.env.VITE_CMS_PROJECT     as string | undefined,
  shelterModel: (import.meta.env.VITE_CMS_SHELTER_MODEL as string | undefined) ?? 'shelter',
  supplyModel:  (import.meta.env.VITE_CMS_SUPPLY_MODEL  as string | undefined) ?? 'supply-snapshot',
  token:        import.meta.env.VITE_CMS_TOKEN        as string | undefined,

  get enabled():  boolean { return !!(this.baseUrl && this.project) },
  get writable(): boolean { return this.enabled && !!this.token },
} as const

/** Split "workspace/project" alias stored in VITE_CMS_PROJECT */
export function splitProject(): [string, string] {
  const parts = (CMS.project ?? '').split('/')
  return [parts[0] ?? '', parts[1] ?? '']
}
