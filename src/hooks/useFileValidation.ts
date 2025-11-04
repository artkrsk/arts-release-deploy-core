import { useState, useEffect, useRef } from 'react'
import DOMPurify from 'dompurify'
import type { IUseFileValidationConfig, IUseFileValidationReturn } from '../interfaces'
import type { TStatusState } from '../types'
import { GitHubService } from '../services'
import { getString } from '../utils'

/**
 * Custom hook for GitHub file validation
 * Separates business logic from FileStatus UI component
 *
 * @param config - Configuration object
 * @returns File validation state and functions
 */
export function useFileValidation({
  fileUrl,
  ajaxUrl,
  nonce,
  enabled = true,
  gitHubService = GitHubService
}: IUseFileValidationConfig): IUseFileValidationReturn {
  const [status, setStatus] = useState<TStatusState>('idle')
  const [result, setResult] = useState<{ size: number; exists: boolean } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [errorCode, setErrorCode] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const isMountedRef = useRef(true)

  /** Test a GitHub file */
  const testFile = async (urlToTest?: string) => {
    const url = urlToTest || fileUrl

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
      const testResult = await gitHubService.testFile(
        ajaxUrl,
        nonce,
        url,
        abortController.signal
      )

      // Check if this test was aborted
      if (abortController.signal.aborted) {
        return
      }

      if (isMountedRef.current) {
        setStatus('ready')
        setResult(testResult)
      }
    } catch (e: any) {
      // Check if error is due to abort
      if (e.name === 'AbortError') {
        return
      }

      // Only set error state if not aborted and still mounted
      if (!abortController.signal.aborted && isMountedRef.current) {
        setStatus('error')

        // Simplify error messages
        let errorMessage = e instanceof Error ? e.message : getString('file.networkError')

        // Simplify common error patterns
        if (errorMessage.includes('not found in repository')) {
          errorMessage = 'Release not found'
        } else if (errorMessage.includes('Repository not found')) {
          errorMessage = 'Repository not found'
        } else if (errorMessage.includes('Asset not found')) {
          errorMessage = 'File not found'
        } else if (errorMessage.includes('&quot;') || errorMessage.includes('&amp;')) {
          // Decode HTML entities if present using DOMPurify (XSS-safe)
          const sanitizedMessage = DOMPurify.sanitize(errorMessage)
          const textarea = document.createElement('textarea')
          textarea.innerHTML = sanitizedMessage
          errorMessage = textarea.value

          // Still simplify if it's about not found
          if (errorMessage.includes('not found in repository')) {
            errorMessage = 'Release not found'
          } else if (errorMessage.includes('Repository not found')) {
            errorMessage = 'Repository not found'
          } else if (errorMessage.includes('Asset not found')) {
            errorMessage = 'File not found'
          }
        }

        setError(errorMessage)
        setErrorCode(e?.code || null)
      }
    } finally {
      // Clear the ref if this was the current controller
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null
      }
    }
  }

  // Cleanup on unmount
  useEffect(() => {
    isMountedRef.current = true

    return () => {
      isMountedRef.current = false
      // Abort any in-progress test
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
        abortControllerRef.current = null
      }
    }
  }, [])

  return {
    status,
    result,
    error,
    errorCode,
    testFile
  }
}
