import React from 'react'
import type { IFileStatusProps } from '../interfaces'
import type { TStatusState } from '../types'
import { formatSize, getString } from '../utils'
import { GitHubService } from '../services'
import { INTERVALS, GITHUB_PROTOCOL, EDD_SELECTORS } from '../constants'
import { ProBadge } from '../components'

const { useState, useEffect, useRef } = wp.element

export const FileStatus = ({ fileUrl: initialUrl, rootElement }: IFileStatusProps): JSX.Element | null => {
  const [currentUrl, setCurrentUrl] = useState(initialUrl)
  const [status, setStatus] = useState<TStatusState>('idle')
  const [result, setResult] = useState<{ size: number; exists: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  useEffect(() => {
    isMountedRef.current = true
    // Find the wrapper and input elements relative to where this component is mounted
    // The rootElement prop helps us identify the correct elements when multiple rows exist
    const statusElement = rootElement || document.querySelector(`[data-file-url="${initialUrl}"]`)
    if (!statusElement) return

    const wrapper = statusElement.closest(EDD_SELECTORS.UPLOAD_WRAPPER)
    if (!wrapper) return

    const fileInput = wrapper.querySelector(EDD_SELECTORS.UPLOAD_FIELD) as HTMLInputElement
    if (!fileInput) return

    // Test on mount if GitHub file
    if (fileInput.value && fileInput.value.startsWith(GITHUB_PROTOCOL)) {
      setCurrentUrl(fileInput.value)
      testFile(fileInput.value)
    }

    let debounceTimer: number | null = null
    let lastValue = fileInput.value

    // Watch for changes
    const handleInputChange = () => {
      const newValue = fileInput.value

      // Only process if value actually changed
      if (newValue === lastValue) return
      lastValue = newValue

      // Abort any in-progress test
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }

      // Clear old timer
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }

      // Update URL immediately
      setCurrentUrl(newValue)

      if (newValue && newValue.startsWith(GITHUB_PROTOCOL)) {
        // Clear old results while typing
        setStatus('idle')
        setResult(null)
        setError(null)

        // Debounce the test call
        debounceTimer = window.setTimeout(() => {
          if (isMountedRef.current) {
            testFile(newValue)
          }
        }, INTERVALS.DEBOUNCE)
      } else {
        // Non-GitHub URL - clear everything immediately
        setStatus('idle')
        setResult(null)
        setError(null)
      }
    }

    fileInput.addEventListener('input', handleInputChange)
    fileInput.addEventListener('change', handleInputChange)

    // Also listen for jQuery change events
    // This is important because WordPress/EDD uses jQuery to set values
    jQuery(fileInput).on('change input', handleInputChange)

    // Polling to catch EDD's media library selections
    // EDD uses jQuery .val() without triggering change events
    const pollInterval = window.setInterval(() => {
      const currentValue = fileInput.value
      if (currentValue !== lastValue) {
        lastValue = currentValue

        // Abort any in-progress test
        if (abortControllerRef.current) {
          abortControllerRef.current.abort()
          abortControllerRef.current = null
        }

        // Clear old timer
        if (debounceTimer) {
          clearTimeout(debounceTimer)
        }

        // Update URL immediately
        setCurrentUrl(currentValue)

        if (currentValue && currentValue.startsWith(GITHUB_PROTOCOL)) {
          // Clear old results while typing
          setStatus('idle')
          setResult(null)
          setError(null)

          // Debounce the test call
          debounceTimer = window.setTimeout(() => {
            if (isMountedRef.current) {
              testFile(currentValue)
            }
          }, INTERVALS.DEBOUNCE)
        } else {
          // Non-GitHub URL - clear everything immediately
          setStatus('idle')
          setResult(null)
          setError(null)
        }
      }
    }, INTERVALS.POLL)

    // Cleanup
    return () => {
      isMountedRef.current = false
      if (debounceTimer) {
        clearTimeout(debounceTimer)
      }
      clearInterval(pollInterval)
      fileInput.removeEventListener('input', handleInputChange)
      fileInput.removeEventListener('change', handleInputChange)
      jQuery(fileInput).off('change input')
      // Abort any in-progress test
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [rootElement])

  const testFile = async (urlToTest?: string) => {
    const url = urlToTest || currentUrl

    // Abort any previous test
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    // Create new abort controller for this test
    const abortController = new AbortController()
    abortControllerRef.current = abortController

    if (isMountedRef.current) {
      setStatus('testing')
      setError(null)
      setErrorCode(null)
    }

    try {
      const ajaxUrl = window.releaseDeployEDD.ajaxUrl
      const result = await GitHubService.testFile(
        ajaxUrl,
        window.releaseDeployEDD.contexts.settings?.nonce ||
          window.releaseDeployEDD.contexts.browser?.nonce ||
          '',
        url,
        abortController.signal
      )

      // Check if this test was aborted
      if (abortController.signal.aborted) {
        return
      }

      if (isMountedRef.current) {
        setStatus('ready')
        setResult(result)
      }
    } catch (e: any) {
      // Check if error is due to abort
      if (e.name === 'AbortError') {
        return
      }

      // Only set error state if not aborted and still mounted
      if (!abortController.signal.aborted && isMountedRef.current) {
        setStatus('error')
        setError(e instanceof Error ? e.message : getString('file.networkError'))
        setErrorCode(e?.code || null)
      }
    } finally {
      // Clear the ref if this was the current controller
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }

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
      onClick={() => status !== 'testing' && testFile()}
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
