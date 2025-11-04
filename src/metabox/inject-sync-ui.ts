import { EDD_SELECTORS } from '../constants'

/**
 * Inject Version and Changelog Sync UI into EDD metabox
 *
 * These functions inject React root elements next to EDD Software Licensing fields
 * when Software Licensing is enabled for a download.
 */

/**
 * Inject Version Sync UI next to the version field
 */
export function injectVersionSyncUI(): void {
  const metaboxData = window.releaseDeployEDD?.contexts?.metabox;

  if (!metaboxData?.versionSync?.enabled) {
    return;
  }

  const versionSyncData = metaboxData.versionSync;

  // Wait for EDD SL metabox to render
  setTimeout(() => {
    const versionField = jQuery(EDD_SELECTORS.VERSION_FIELD);
    if (!versionField.length) {
      return;
    }

    // Determine if this is Pro or Lite (Lite shows Pro badges)
    const isPro = window.releaseDeployEDD?.features?.versionSync || false;
    const rootSuffix = isPro ? 'pro' : 'free';

    // Create root element for React component
    const rootElement = jQuery(`
      <div
        id="release-deploy-edd-version-sync-${rootSuffix}-root"
        class="release-deploy-edd-sync-root"
        data-download-id="${metaboxData.downloadId}"
        data-current-version="${versionSyncData.currentVersion || ''}"
        data-github-version="${versionSyncData.githubVersion || ''}"
        data-last-sync="${versionSyncData.lastSync || ''}"
        data-nonce="${versionSyncData.nonce}"
        data-ajax-url="${window.releaseDeployEDD?.ajaxUrl || ''}"
      ></div>
    `);

    // Insert after the version field
    // Try to find the text node (&nbsp;) after the input
    const nextNode = versionField[0]?.nextSibling;
    if (nextNode && nextNode.nodeType === 3) {
      // Text node (the &nbsp;)
      jQuery(nextNode).after(rootElement);
    } else {
      versionField.after(rootElement);
    }

    // Trigger event to initialize React component
    jQuery(document).trigger('release-deploy-edd-version-sync-ready');
  }, 100);
}

/**
 * Inject Changelog Sync UI next to the changelog field
 */
export function injectChangelogSyncUI(): void {
  const metaboxData = window.releaseDeployEDD?.contexts?.metabox;

  if (!metaboxData?.changelogSync?.enabled) {
    return;
  }

  const changelogSyncData = metaboxData.changelogSync;

  // Wait for EDD SL metabox to render
  setTimeout(() => {
    const changelogField = jQuery(EDD_SELECTORS.CHANGELOG_FIELD);
    if (!changelogField.length) {
      return;
    }

    // Determine if this is Pro or Lite (Lite shows Pro badges)
    const isPro = window.releaseDeployEDD?.features?.changelogSync || false;
    const rootSuffix = isPro ? 'pro' : 'free';

    // Create root element for React component
    const rootElement = jQuery(`
      <div
        id="release-deploy-edd-changelog-sync-${rootSuffix}-root"
        class="release-deploy-edd-sync-root"
        data-download-id="${metaboxData.downloadId}"
        data-last-sync="${changelogSyncData.lastSync || ''}"
        data-is-linked="${changelogSyncData.isLinked ? 'true' : 'false'}"
        data-nonce="${changelogSyncData.nonce}"
        data-ajax-url="${window.releaseDeployEDD?.ajaxUrl || ''}"
      ></div>
    `);

    // Insert after the changelog label
    const changelogLabel = jQuery(EDD_SELECTORS.CHANGELOG_LABEL);
    if (changelogLabel.length) {
      changelogLabel.append(rootElement);
    } else {
      // Fallback: insert after the field itself
      changelogField.after(rootElement);
    }

    // Trigger event to initialize React component
    jQuery(document).trigger('release-deploy-edd-changelog-sync-ready');
  }, 100);
}
