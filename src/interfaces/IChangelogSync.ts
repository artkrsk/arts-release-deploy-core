/** Changelog Sync component props */
export interface IChangelogSyncProps {
  /** Download post ID */
  downloadId: number
  /** WordPress nonce for AJAX */
  nonce: string
  /** AJAX URL */
  ajaxUrl: string
  /** Whether this is a Pro feature */
  isProFeature?: boolean
  /** Last sync timestamp */
  lastSync?: number
  /** Whether changelog is linked (for stub/display) */
  isLinked?: boolean
  /** Initial linked state (for full Pro implementation) */
  initialIsLinked?: boolean
}
