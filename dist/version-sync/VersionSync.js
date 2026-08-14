/**
 * Version Sync - Free Version (Badge Only)
 */
import React from 'react';
import { ProBadge } from '../components';
import { getString } from '../utils';
export const VersionSync = (_props) => {
    const purchaseUrl = window.releaseDeployEDD?.purchaseUrl || '';
    return (React.createElement(ProBadge, { label: getString('sync.autoVersionSync'), icon: "dashicons-update", text: getString('common.getPro'), showWrapper: true, renderAsLink: true, href: purchaseUrl, status: "default", openInNewWindow: true }));
};
