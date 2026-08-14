/**
 * Changelog Sync - Free Version (Badge Only)
 */
import React from 'react'
import { ProBadge } from '../components'
import type { IChangelogSyncProps } from '../interfaces'
import { getString } from '../utils'

export const ChangelogSync = (_props: IChangelogSyncProps): JSX.Element => {
  const purchaseUrl = window.releaseDeployEDD?.purchaseUrl || ''

  return (
    <ProBadge
      label={getString('sync.autoChangelogSync')}
      icon="dashicons-media-document"
      text={getString('common.getPro')}
      showWrapper={true}
      renderAsLink={true}
      href={purchaseUrl}
      status="default"
      openInNewWindow={true}
    />
  )
}
