/**
 * Changelog Sync - Free Version (Badge Only)
 */
import React from 'react';
import { getString } from '../utils';
import { ProBadge } from '../components';
export const ChangelogSync = (_props) => {
    const purchaseUrl = window.releaseDeployEDD?.purchaseUrl || '';
    return (React.createElement(ProBadge, { label: getString('sync.autoChangelogSync'), icon: "dashicons-media-document", text: getString('common.getPro'), showWrapper: true, renderAsLink: true, href: purchaseUrl, status: "default", openInNewWindow: true }));
};
