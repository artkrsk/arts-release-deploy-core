/** Feature flags for lite/pro detection */
export interface IFeatureFlags {
  useLatestRelease: boolean
  webhooks: boolean
  notifications: boolean
  versionSync: boolean
  changelogSync?: boolean
}

/** WordPress media library interface */
export interface IWordPressMedia {
  frames?: {
    file_frame?: any
    [key: string]: any
  }
  editor?: {
    insert: (html: string) => void
  }
  [key: string]: any
}

/** EDD-specific jQuery objects for file fields */
export interface IEDDFileFields {
  formfield: JQuery<HTMLElement>
  tb_remove: () => void
}

/** Settings context data */
export interface ISettingsContext {
  token: string
  isConstantDefined: boolean
  nonce: string
}

/** Metabox context data */
export interface IMetaboxContext {
  downloadId: number
  nonce: string
  versionSync?: {
    enabled: boolean
    currentVersion: string
    githubVersion: string
    lastSync: string
    nonce: string
  }
  changelogSync?: {
    enabled: boolean
    lastSync: string
    isLinked: boolean
    nonce: string
  }
}

/** Browser context data */
export interface IBrowserContext {
  nonce: string
}

/** Webhook context data */
export interface IWebhookContext {
  webhookUrl: string
  secret: string
  isConstantDefined: boolean
  nonce: string
}

/** License context data */
export interface ILicenseContext {
  nonce: string
  data: {
    status?: string
    expires?: string
    site_count?: string
    license_limit?: string
    activations_left?: string
    is_support_provided?: boolean
    date_supported_until?: string
    license_key?: string
  } | null
}

/** Centralized configuration structure */
export interface IConfig {
  // Common data shared across all contexts
  ajaxUrl: string
  features: IFeatureFlags
  purchaseUrl: string
  supportUrl: string
  renewSupportUrl: string
  settingsUrl: string

  // Context-specific data
  contexts: {
    settings?: ISettingsContext
    metabox?: IMetaboxContext
    browser?: IBrowserContext
    webhook?: IWebhookContext
    license?: ILicenseContext
  }
}
