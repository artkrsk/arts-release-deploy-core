import { useState, useEffect, useRef } from 'react'
import { GITHUB_PROTOCOL, INTERVALS, EDD_SELECTORS } from '../constants'

/**
 * Hook for detecting and monitoring GitHub files in EDD download file fields
 * Extracts common logic from VersionSync and ChangelogSync components
 */
export function useGitHubFiles() {
  const [hasGitHubFiles, setHasGitHubFiles] = useState(false)
  const linkedGitHubFileRef = useRef<string | null>(null)
  const isMountedRef = useRef(true)

  /**
   * Get the first GitHub file from file inputs
   */
  const getFirstGitHubFile = (): string | null => {
    const fileInputs = document.querySelectorAll(EDD_SELECTORS.UPLOAD_FIELD) as NodeListOf<HTMLInputElement>

    for (let i = 0; i < fileInputs.length; i++) {
      const input = fileInputs[i]
      if (input.value && input.value.startsWith(GITHUB_PROTOCOL)) {
        return input.value
      }
    }

    return null
  }

  /**
   * Check for GitHub files and update state
   */
  const checkForGitHubFiles = () => {
    const fileInputs = document.querySelectorAll(EDD_SELECTORS.UPLOAD_FIELD) as NodeListOf<HTMLInputElement>
    let foundGitHub = false
    const currentGitHubFile = getFirstGitHubFile()

    // Check if any file starts with GitHub protocol
    for (let i = 0; i < fileInputs.length; i++) {
      const input = fileInputs[i]
      if (input.value && input.value.startsWith(GITHUB_PROTOCOL)) {
        foundGitHub = true
        break
      }
    }

    // Update state if mounted
    if (isMountedRef.current) {
      setHasGitHubFiles(foundGitHub)

      // If the linked file has been removed/changed, update the ref
      if (linkedGitHubFileRef.current && currentGitHubFile !== linkedGitHubFileRef.current) {
        linkedGitHubFileRef.current = null
        return true // Signal that linked file changed
      }
    }

    return false
  }

  /**
   * Start polling for GitHub file changes
   */
  const startPolling = (onFileChange?: () => void) => {
    const pollInterval = window.setInterval(() => {
      const currentInputs = document.querySelectorAll(EDD_SELECTORS.UPLOAD_FIELD) as NodeListOf<HTMLInputElement>

      // Check if file structure has changed
      currentInputs.forEach((input) => {
        const currentValue = input.value
        const previousValue = input.getAttribute('data-prev-value')

        if (currentValue !== previousValue) {
          input.setAttribute('data-prev-value', currentValue)

          if (checkForGitHubFiles() && onFileChange) {
            onFileChange()
          }
        }
      })
    }, INTERVALS.POLL)

    return pollInterval
  }

  useEffect(() => {
    isMountedRef.current = true

    // Initial check
    checkForGitHubFiles()

    return () => {
      isMountedRef.current = false
    }
  }, [])

  return {
    hasGitHubFiles,
    linkedGitHubFileRef,
    getFirstGitHubFile,
    checkForGitHubFiles,
    startPolling
  }
}
