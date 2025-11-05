/**
 * Changelog sync initialization - Free Version
 */
import React from 'react';
import { ChangelogSync } from './ChangelogSync';
const { render } = wp.element;
/** Initialize changelog sync component */
export const initChangelogSync = () => {
    const container = document.getElementById('release-deploy-edd-changelog-sync-free-root');
    if (!container) {
        return;
    }
    const downloadId = parseInt(container.dataset['downloadId'] || '0');
    const nonce = container.dataset['nonce'] || '';
    const ajaxUrl = container.dataset['ajaxUrl'] || window.ajaxurl;
    // if (!downloadId || downloadId <= 0 || !nonce || !ajaxUrl) {
    //   return
    // }
    render(React.createElement(ChangelogSync, { downloadId: downloadId, nonce: nonce, ajaxUrl: ajaxUrl, isFeatureAvailable: false, lastSync: 0, isLinked: false }), container);
};
