/** Pro badge component props */
export interface IProBadgeProps {
  /** Optional label before badge */
  label?: string
  /** Optional dashicon class */
  icon?: string
  /** Show wrapper container */
  showWrapper?: boolean
  /** Render as link or span */
  renderAsLink?: boolean
  /** Link href */
  href?: string
  /** Badge text */
  text?: string
  /** Badge status for styling */
  status?: 'default' | 'success' | 'warning'
  /** Open link in new window */
  openInNewWindow?: boolean
}
