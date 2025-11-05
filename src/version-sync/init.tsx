/**
 * Version sync initialization - Free Version
 */
import React from 'react'
import { VersionSync } from './VersionSync'

const { render } = wp.element

/** Initialize version sync component */
export const initVersionSync = () => {
  const container = document.getElementById('release-deploy-edd-version-sync-free-root')
  if (!container) {
    return
  }

  const downloadId = parseInt(container.dataset['downloadId'] || '0')
  const nonce = container.dataset['nonce'] || ''
  const ajaxUrl = container.dataset['ajaxUrl'] || (window as any).ajaxurl

  if (!downloadId || downloadId <= 0 || !nonce || !ajaxUrl) {
    return
  }

  render(
    <VersionSync
      downloadId={downloadId}
      currentVersion=""
      githubVersion=""
      lastSync={0}
      nonce={nonce}
      ajaxUrl={ajaxUrl}
      isFeatureAvailable={false}
    />,
    container
  )
}
