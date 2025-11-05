/** Changelog Sync component props */
export interface IChangelogSyncProps {
  /** Download post ID */
  downloadId: number
  /** WordPress nonce for AJAX */
  nonce: string
  /** AJAX URL */
  ajaxUrl: string
  /** Whether this feature is available */
  isFeatureAvailable?: boolean
  /** Last sync timestamp */
  lastSync?: number
  /** Initial linked state */
  isLinked?: boolean
}
