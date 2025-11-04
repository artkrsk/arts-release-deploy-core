import React from 'react'
import type { IFileStatusProps } from '../interfaces'
import { formatSize, getString } from '../utils'
import { useFileValidation, useFileInputMonitor } from '../hooks'
import { GITHUB_PROTOCOL } from '../constants'
import { ProBadge } from '../components'

export const FileStatus = ({ fileUrl: initialUrl, rootElement }: IFileStatusProps): JSX.Element | null => {
  const ajaxUrl = window.releaseDeployEDD.ajaxUrl
  const nonce = window.releaseDeployEDD.contexts.settings?.nonce ||
    window.releaseDeployEDD.contexts.browser?.nonce ||
    ''

  /** Use file validation hook for testing logic */
  const { status, result, error, errorCode, testFile } = useFileValidation({
    fileUrl: initialUrl,
    ajaxUrl,
    nonce,
    enabled: false // We'll trigger manually when URL changes
  })

  /** Stable empty callback to prevent effect re-runs */
  const noOp = React.useCallback(() => {}, [])

  /** Monitor file input for changes - no callback needed, we'll use effect */
  const { currentUrl } = useFileInputMonitor({
    initialUrl,
    rootElement,
    onUrlChange: noOp // Stable empty callback since we handle changes via useEffect
  })

  // Track previous URL to avoid redundant tests
  const lastTestedUrl = React.useRef<string>('')

  // Test when currentUrl changes (including initial load)
  React.useEffect(() => {
    if (currentUrl && currentUrl.startsWith(GITHUB_PROTOCOL)) {
      // Only test if URL actually changed
      if (currentUrl !== lastTestedUrl.current) {
        lastTestedUrl.current = currentUrl
        testFile(currentUrl)
      }
    }
  }, [currentUrl]) // Only depend on currentUrl, not testFile

  // Don't show if not a GitHub file
  if (!currentUrl || !currentUrl.startsWith(GITHUB_PROTOCOL)) {
    return null
  }

  // Don't show if no status yet
  if (status === 'idle') {
    return null
  }

  return (
    <span
      onClick={() => status !== 'testing' && testFile(currentUrl)}
      className={`release-deploy-edd-file-status release-deploy-edd-file-status_${status}`}
      title={
        status === 'ready'
          ? getString('file.retest')
          : status === 'error'
            ? getString('file.retry')
            : ''
      }
    >
      {status === 'testing' && (
        <>
          <span className="release-deploy-edd-file-status__message">
            <span className="release-deploy-edd-icon_loading"></span>
            {getString('file.testing')}
          </span>
        </>
      )}
      {status === 'ready' && result && (
        <span className="release-deploy-edd-file-status__message">
          <span className="release-deploy-edd-icon_success"></span>
          {getString('file.ready')} ({formatSize(result.size)})
        </span>
      )}
      {status === 'error' && (
        <>
          <span className="release-deploy-edd-file-status__message">
            <span className="release-deploy-edd-icon_error"></span>
            {error}
          </span>
          {errorCode === 'pro_feature' && (
            <>
              {' '}
              <ProBadge
                showWrapper={false}
                renderAsLink={true}
                href={window.releaseDeployEDD.purchaseUrl}
                text={getString('common.getPro')}
                status="default"
              />
            </>
          )}
          {error && error.toLowerCase().includes('token') && (
            <>
              {' '}
              <ProBadge
                showWrapper={false}
                renderAsLink={true}
                href={window.releaseDeployEDD.settingsUrl}
                text={getString('common.fixIt')}
                status="warning"
              />
            </>
          )}
        </>
      )}
    </span>
  )
}
