/**
 * Version Sync - Free Version (Badge Only)
 */
import React from 'react'
import type { IVersionSyncProps } from '../interfaces'
import { getString } from '../utils'
import { ProBadge } from '../components'

export const VersionSync = (_props: IVersionSyncProps): JSX.Element => {
  const purchaseUrl = window.releaseDeployEDD?.purchaseUrl || ''

  return (
    <ProBadge
      label={getString('sync.autoVersionSync')}
      icon="dashicons-update"
      text={getString('common.getPro')}
      showWrapper={true}
      renderAsLink={true}
      href={purchaseUrl}
      status="default"
      openInNewWindow={true}
    />
  )
}
