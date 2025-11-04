import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useGitHubFiles } from '@/hooks/useGitHubFiles'
import { GITHUB_PROTOCOL, INTERVALS, EDD_SELECTORS } from '@/constants'

describe('useGitHubFiles', () => {
  const mockGitHubUrl = `${GITHUB_PROTOCOL}owner/repo/v1.0.0/release.zip`
  const mockRegularUrl = 'https://example.com/file.zip'

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock DOM structure
    document.body.innerHTML = ''
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
    document.body.innerHTML = ''
  })

  describe('initial state', () => {
    it('should return initial state with hasGitHubFiles as false', () => {
      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.hasGitHubFiles).toBe(false)
      expect(result.current.linkedGitHubFileRef).toBeDefined()
      expect(result.current.getFirstGitHubFile).toBeDefined()
      expect(result.current.checkForGitHubFiles).toBeDefined()
      expect(result.current.startPolling).toBeDefined()
    })
  })

  describe('getFirstGitHubFile', () => {
    it('should return null when no file inputs exist', () => {
      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.getFirstGitHubFile()).toBeNull()
    })

    it('should return null when no GitHub files exist', () => {
      // Create file input with regular URL
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockRegularUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.getFirstGitHubFile()).toBeNull()
    })

    it('should return first GitHub file when GitHub files exist', () => {
      // Create multiple file inputs
      const regularInput = document.createElement('input')
      regularInput.type = 'text'
      regularInput.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      regularInput.value = mockRegularUrl

      const githubInput = document.createElement('input')
      githubInput.type = 'text'
      githubInput.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      githubInput.value = mockGitHubUrl

      const secondGithubInput = document.createElement('input')
      secondGithubInput.type = 'text'
      secondGithubInput.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      secondGithubInput.value = `${GITHUB_PROTOCOL}owner/repo/v2.0.0/release.zip`

      document.body.appendChild(regularInput)
      document.body.appendChild(githubInput)
      document.body.appendChild(secondGithubInput)

      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.getFirstGitHubFile()).toBe(mockGitHubUrl)
    })

    it('should return null when input value is empty', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = ''
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.getFirstGitHubFile()).toBeNull()
    })
  })

  describe('checkForGitHubFiles', () => {
    it('should set hasGitHubFiles to false when no GitHub files exist', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockRegularUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      act(() => {
        result.current.checkForGitHubFiles()
      })

      expect(result.current.hasGitHubFiles).toBe(false)
    })

    it('should set hasGitHubFiles to true when GitHub files exist', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockGitHubUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      act(() => {
        result.current.checkForGitHubFiles()
      })

      expect(result.current.hasGitHubFiles).toBe(true)
    })

    it('should handle manual checkForGitHubFiles calls', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockGitHubUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      // Manual check should work without errors
      act(() => {
        result.current.checkForGitHubFiles()
      })

      expect(result.current.hasGitHubFiles).toBe(true)
    })

    it('should not update state when component is unmounted', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockGitHubUrl
      document.body.appendChild(input)

      const { result, unmount } = renderHook(() => useGitHubFiles())

      unmount()

      // Check should not throw even though component is unmounted
      expect(() => {
        result.current.checkForGitHubFiles()
      }).not.toThrow()
    })
  })

  describe('startPolling', () => {
    it('should work without callback', () => {
      const { result } = renderHook(() => useGitHubFiles())

      expect(() => {
        result.current.startPolling()
      }).not.toThrow()
    })

    it('should work with callback', () => {
      const onFileChange = vi.fn()
      const { result } = renderHook(() => useGitHubFiles())

      expect(() => {
        result.current.startPolling(onFileChange)
      }).not.toThrow()
    })
  })

  describe('initial check on mount', () => {
    it('should perform initial check for GitHub files on mount', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockGitHubUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      // Initial check should have found the GitHub file
      expect(result.current.hasGitHubFiles).toBe(true)
      // Note: linkedGitHubFileRef is only set when checkForGitHubFiles is called manually
      expect(result.current.getFirstGitHubFile()).toBe(mockGitHubUrl)
    })

    it('should set hasGitHubFiles to false when no GitHub files on mount', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockRegularUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.hasGitHubFiles).toBe(false)
    })
  })

  describe('cleanup on unmount', () => {
    it('should handle cleanup properly on unmount', () => {
      const { unmount } = renderHook(() => useGitHubFiles())

      expect(() => {
        unmount()
      }).not.toThrow()
    })

    it('should not throw after unmount', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = ''
      document.body.appendChild(input)

      const { result, unmount } = renderHook(() => useGitHubFiles())

      unmount()

      // These operations should not throw after unmount
      expect(() => {
        result.current.checkForGitHubFiles()
        result.current.getFirstGitHubFile()
      }).not.toThrow()
    })
  })

  describe('multiple file inputs', () => {
    it('should detect GitHub files in multiple inputs', () => {
      const regularInput1 = document.createElement('input')
      regularInput1.type = 'text'
      regularInput1.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      regularInput1.value = mockRegularUrl

      const githubInput1 = document.createElement('input')
      githubInput1.type = 'text'
      githubInput1.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      githubInput1.value = mockGitHubUrl

      const regularInput2 = document.createElement('input')
      regularInput2.type = 'text'
      regularInput2.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      regularInput2.value = 'https://example.com/another.zip'

      document.body.appendChild(regularInput1)
      document.body.appendChild(githubInput1)
      document.body.appendChild(regularInput2)

      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.hasGitHubFiles).toBe(true)
      expect(result.current.getFirstGitHubFile()).toBe(mockGitHubUrl)
    })

    it('should detect when all GitHub files are removed', () => {
      const githubInput = document.createElement('input')
      githubInput.type = 'text'
      githubInput.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      githubInput.value = mockGitHubUrl
      document.body.appendChild(githubInput)

      const { result } = renderHook(() => useGitHubFiles())

      // Initially has GitHub files
      expect(result.current.hasGitHubFiles).toBe(true)

      // Remove GitHub file
      githubInput.value = mockRegularUrl

      act(() => {
        result.current.checkForGitHubFiles()
      })

      expect(result.current.hasGitHubFiles).toBe(false)
    })
  })

  describe('edge cases', () => {
    it('should handle empty values gracefully', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = ''
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.getFirstGitHubFile()).toBeNull()
      expect(result.current.hasGitHubFiles).toBe(false)
    })

    it('should handle null/undefined values gracefully', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = null as any
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      expect(() => {
        result.current.getFirstGitHubFile()
        result.current.checkForGitHubFiles()
      }).not.toThrow()
    })

    it('should handle very long URLs', () => {
      const longGitHubUrl = mockGitHubUrl + '/'.repeat(100)
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = longGitHubUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.getFirstGitHubFile()).toBe(longGitHubUrl)
      expect(result.current.hasGitHubFiles).toBe(true)
    })

    it('should handle malformed GitHub URLs', () => {
      const malformedUrl = 'edd-release-deploy://'
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = malformedUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current.getFirstGitHubFile()).toBe(malformedUrl)
      expect(result.current.hasGitHubFiles).toBe(true)
    })
  })

  describe('DOM manipulation', () => {
    it('should handle dynamic addition of file inputs', () => {
      const { result } = renderHook(() => useGitHubFiles())

      // Initially no inputs
      expect(result.current.hasGitHubFiles).toBe(false)

      // Dynamically add input with GitHub URL
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockGitHubUrl
      document.body.appendChild(input)

      act(() => {
        result.current.checkForGitHubFiles()
      })

      expect(result.current.hasGitHubFiles).toBe(true)
    })

    it('should handle dynamic removal of file inputs', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockGitHubUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      // Initially has GitHub files
      expect(result.current.hasGitHubFiles).toBe(true)

      // Remove input
      document.body.removeChild(input)

      act(() => {
        result.current.checkForGitHubFiles()
      })

      expect(result.current.hasGitHubFiles).toBe(false)
    })
  })

  describe('integration with constants', () => {
    it('should use correct GitHub protocol constant', () => {
      expect(GITHUB_PROTOCOL).toBe('edd-release-deploy://')
    })

    it('should use correct poll interval constant', () => {
      expect(INTERVALS.POLL).toBe(600)
    })

    it('should use correct upload field selector constant', () => {
      expect(EDD_SELECTORS.UPLOAD_FIELD).toBe('.edd_repeatable_upload_field')
    })
  })

  describe('concurrent operations', () => {
    it('should handle concurrent calls to checkForGitHubFiles', () => {
      const input = document.createElement('input')
      input.type = 'text'
      input.className = EDD_SELECTORS.UPLOAD_FIELD.replace('.', '')
      input.value = mockGitHubUrl
      document.body.appendChild(input)

      const { result } = renderHook(() => useGitHubFiles())

      // Make multiple concurrent calls
      act(() => {
        result.current.checkForGitHubFiles()
        result.current.checkForGitHubFiles()
        result.current.checkForGitHubFiles()
      })

      expect(result.current.hasGitHubFiles).toBe(true)
    })

    it('should handle multiple calls to startPolling', () => {
      const { result } = renderHook(() => useGitHubFiles())

      expect(() => {
        result.current.startPolling()
        result.current.startPolling()
        result.current.startPolling()
      }).not.toThrow()
    })
  })

  describe('return value structure', () => {
    it('should return object with all expected properties', () => {
      const { result } = renderHook(() => useGitHubFiles())

      expect(result.current).toEqual({
        hasGitHubFiles: expect.any(Boolean),
        linkedGitHubFileRef: expect.any(Object),
        getFirstGitHubFile: expect.any(Function),
        checkForGitHubFiles: expect.any(Function),
        startPolling: expect.any(Function)
      })
    })

    it('should maintain ref object reference across renders', () => {
      const { result, rerender } = renderHook(() => useGitHubFiles())

      const originalRef = result.current.linkedGitHubFileRef

      rerender()

      expect(result.current.linkedGitHubFileRef).toBe(originalRef)
    })
  })
})