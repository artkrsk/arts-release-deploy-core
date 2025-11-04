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
    const versionField = document.querySelector(EDD_SELECTORS.VERSION_FIELD) as HTMLElement;
    if (!versionField) {
      return;
    }

    // Determine if this is Pro or Lite (Lite shows Pro badges)
    const isPro = window.releaseDeployEDD?.features?.versionSync || false;
    const rootSuffix = isPro ? 'pro' : 'free';

    // Create root element for React component
    const rootElement = document.createElement('div');
    rootElement.id = `release-deploy-edd-version-sync-${rootSuffix}-root`;
    rootElement.className = 'release-deploy-edd-sync-root';
    rootElement.setAttribute('data-download-id', String(metaboxData.downloadId));
    rootElement.setAttribute('data-current-version', versionSyncData.currentVersion || '');
    rootElement.setAttribute('data-github-version', versionSyncData.githubVersion || '');
    rootElement.setAttribute('data-last-sync', versionSyncData.lastSync || '');
    rootElement.setAttribute('data-nonce', versionSyncData.nonce);
    rootElement.setAttribute('data-ajax-url', window.releaseDeployEDD?.ajaxUrl || '');

    // Insert after the version field
    // Try to find the text node (&nbsp;) after the input
    const nextNode = versionField.nextSibling;
    if (nextNode && nextNode.nodeType === Node.TEXT_NODE) {
      // Text node (the &nbsp;)
      versionField.parentNode?.insertBefore(rootElement, nextNode.nextSibling);
    } else {
      versionField.parentNode?.insertBefore(rootElement, versionField.nextSibling);
    }

    // Trigger event to initialize React component
    document.dispatchEvent(new CustomEvent('release-deploy-edd-version-sync-ready'));
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
    const changelogField = document.querySelector(EDD_SELECTORS.CHANGELOG_FIELD) as HTMLElement;
    if (!changelogField) {
      return;
    }

    // Determine if this is Pro or Lite (Lite shows Pro badges)
    const isPro = window.releaseDeployEDD?.features?.changelogSync || false;
    const rootSuffix = isPro ? 'pro' : 'free';

    // Create root element for React component
    const rootElement = document.createElement('div');
    rootElement.id = `release-deploy-edd-changelog-sync-${rootSuffix}-root`;
    rootElement.className = 'release-deploy-edd-sync-root';
    rootElement.setAttribute('data-download-id', String(metaboxData.downloadId));
    rootElement.setAttribute('data-last-sync', changelogSyncData.lastSync || '');
    rootElement.setAttribute('data-is-linked', String(changelogSyncData.isLinked));
    rootElement.setAttribute('data-nonce', changelogSyncData.nonce);
    rootElement.setAttribute('data-ajax-url', window.releaseDeployEDD?.ajaxUrl || '');

    // Insert after the changelog label
    const changelogLabel = document.querySelector(EDD_SELECTORS.CHANGELOG_LABEL) as HTMLElement;
    if (changelogLabel) {
      changelogLabel.appendChild(rootElement);
    } else {
      // Fallback: insert after the field itself
      changelogField.parentNode?.insertBefore(rootElement, changelogField.nextSibling);
    }

    // Trigger event to initialize React component
    document.dispatchEvent(new CustomEvent('release-deploy-edd-changelog-sync-ready'));
  }, 100);
}
