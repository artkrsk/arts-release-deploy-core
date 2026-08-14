/**
 * Version Sync - Free Version (Badge Only)
 */
import React from 'react'
import { ProBadge } from '../components'
import type { IVersionSyncProps } from '../interfaces'
import { getString } from '../utils'

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
