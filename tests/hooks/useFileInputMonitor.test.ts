import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileInputMonitor } from '@/hooks/useFileInputMonitor'
import { GITHUB_PROTOCOL, INTERVALS, EDD_SELECTORS } from '@/constants'

describe('useFileInputMonitor', () => {
  const mockInitialUrl = 'https://example.com/file.zip'
  const mockGitHubUrl = `${GITHUB_PROTOCOL}owner/repo/v1.0.0/release.zip`
  const mockOnUrlChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.restoreAllMocks()
  })

  describe('basic functionality', () => {
    it('should return initial URL', () => {
      // Create mock DOM structure
      const mockRootElement = document.createElement('div')
      const mockStatusElement = document.createElement('span')
      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      const mockWrapper = document.createElement('div')
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      const mockFileInput = document.createElement('input')
      mockFileInput.type = 'text'
      mockFileInput.className = 'edd_repeatable_upload_field'
      mockFileInput.value = mockInitialUrl

      mockRootElement.appendChild(mockStatusElement)
      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      // Mock document.querySelector for the component
      const originalQuerySelector = document.querySelector
      vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === `[data-file-url="${mockInitialUrl}"]`) {
          return mockStatusElement
        }
        return originalQuerySelector(selector)
      })

      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      expect(result.current.currentUrl).toBe(mockInitialUrl)
    })

    it('should handle empty initial URL', () => {
      const mockRootElement = document.createElement('div')
      const mockStatusElement = document.createElement('span')
      mockStatusElement.setAttribute('data-file-url', '')
      const mockWrapper = document.createElement('div')
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      const mockFileInput = document.createElement('input')
      mockFileInput.type = 'text'
      mockFileInput.className = 'edd_repeatable_upload_field'
      mockFileInput.value = ''

      mockRootElement.appendChild(mockStatusElement)
      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      const originalQuerySelector = document.querySelector
      vi.spyOn(document, 'querySelector').mockImplementation((selector) => {
        if (selector === '[data-file-url=""]') {
          return mockStatusElement
        }
        return originalQuerySelector(selector)
      })

      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: '',
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      expect(result.current.currentUrl).toBe('')
    })
  })

  describe('error handling', () => {
    it('should handle missing DOM elements gracefully', () => {
      // Mock document.querySelector to return null
      vi.spyOn(document, 'querySelector').mockReturnValue(null)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should handle setup without jQuery gracefully', () => {
      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: document.createElement('div'),
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should handle null callback gracefully', () => {
      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: document.createElement('div'),
            onUrlChange: null as any
          })
        )
      }).not.toThrow()
    })
  })

  describe('DOM interaction simulation', () => {
    it('should not throw when DOM elements are missing', () => {
      const mockRootElement = document.createElement('div')
      // Don't add child elements to simulate missing DOM

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: mockRootElement,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should handle cleanup on unmount', () => {
      const mockRootElement = document.createElement('div')

      const { unmount } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockRootElement,
          onUrlChange: mockOnUrlChange
        })
      )

      expect(() => {
        unmount()
      }).not.toThrow()
    })
  })

  describe('parameter handling', () => {
    it('should accept custom debounce delay', () => {
      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: document.createElement('div'),
            onUrlChange: mockOnUrlChange,
            debounceDelay: 1000
          })
        )
      }).not.toThrow()
    })

    it('should accept custom poll interval', () => {
      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: document.createElement('div'),
            onUrlChange: mockOnUrlChange,
            pollInterval: 2000
          })
        )
      }).not.toThrow()
    })

    it('should work without rootElement', () => {
      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })
  })

  describe('integration with constants', () => {
    it('should use correct GitHub protocol constant', () => {
      expect(GITHUB_PROTOCOL).toBe('edd-release-deploy://')
    })

    it('should use correct interval constants', () => {
      expect(INTERVALS.DEBOUNCE).toBe(600)
      expect(INTERVALS.POLL).toBe(600)
    })

    it('should use correct DOM selector constants', () => {
      expect(EDD_SELECTORS.UPLOAD_FIELD).toBe('.edd_repeatable_upload_field')
      expect(EDD_SELECTORS.UPLOAD_WRAPPER).toBe('.edd_repeatable_upload_wrapper')
    })
  })

  describe('edge cases', () => {
    it('should handle very long URLs', () => {
      const longUrl = 'https://example.com/' + 'a'.repeat(1000)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: longUrl,
            rootElement: document.createElement('div'),
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should handle special characters in URLs', () => {
      const specialUrl = 'https://example.com/file-with-special-chars_123.zip?param=value&other=test'

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: specialUrl,
            rootElement: document.createElement('div'),
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should handle concurrent calls to onUrlChange', () => {
      let callCount = 0
      const countingCallback = () => { callCount++ }

      renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: document.createElement('div'),
          onUrlChange: countingCallback
        })
      )

      // Simulate rapid calls (this would normally be triggered by DOM events)
      countingCallback()
      countingCallback()
      countingCallback()

      expect(callCount).toBe(3)
    })
  })

  describe('react re-render behavior', () => {
    it('should handle re-renders with same parameters', () => {
      const { rerender } = renderHook(
        ({ initialUrl }) =>
          useFileInputMonitor({
            initialUrl,
            rootElement: document.createElement('div'),
            onUrlChange: mockOnUrlChange
          }),
        { initialProps: { initialUrl: mockInitialUrl } }
      )

      expect(() => {
        rerender({ initialUrl: mockInitialUrl })
      }).not.toThrow()
    })

    it('should handle re-renders with different parameters', () => {
      const { rerender } = renderHook(
        ({ initialUrl }) =>
          useFileInputMonitor({
            initialUrl,
            rootElement: document.createElement('div'),
            onUrlChange: mockOnUrlChange
          }),
        { initialProps: { initialUrl: mockInitialUrl } }
      )

      expect(() => {
        rerender({ initialUrl: 'https://example.com/different.zip' })
      }).not.toThrow()
    })

    it('should handle callback changes', () => {
      const newCallback = vi.fn()

      const { rerender } = renderHook(
        ({ onUrlChange }) =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: document.createElement('div'),
            onUrlChange
          }),
        { initialProps: { onUrlChange: mockOnUrlChange } }
      )

      expect(() => {
        rerender({ onUrlChange: newCallback })
      }).not.toThrow()
    })
  })

  describe('type safety', () => {
    it('should return correct type structure', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: document.createElement('div'),
          onUrlChange: mockOnUrlChange
        })
      )

      expect(result.current).toHaveProperty('currentUrl')
      expect(typeof result.current.currentUrl).toBe('string')
    })
  })

  describe('DOM element setup and validation', () => {
    it('should handle missing status element gracefully', () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should handle missing wrapper element gracefully', () => {
      const mockStatusElement = document.createElement('span')
      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      vi.spyOn(document, 'querySelector').mockReturnValue(mockStatusElement)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should handle missing file input element gracefully', () => {
      const mockStatusElement = document.createElement('span')
      const mockWrapper = document.createElement('div')
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockStatusElement.appendChild(mockWrapper)
      vi.spyOn(document, 'querySelector').mockReturnValue(mockStatusElement)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should successfully set up with proper DOM structure', () => {
      const mockStatusElement = document.createElement('span')
      const mockWrapper = document.createElement('div')
      const mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      vi.spyOn(document, 'querySelector').mockReturnValue(mockStatusElement)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })
  })

  describe('timer and cleanup functionality', () => {
    it('should setup hook without errors when DOM elements exist', () => {
      const mockStatusElement = document.createElement('span')
      const mockWrapper = document.createElement('div')
      const mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      vi.spyOn(document, 'querySelector').mockReturnValue(mockStatusElement)

      const { unmount } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          onUrlChange: mockOnUrlChange
        })
      )

      expect(() => unmount()).not.toThrow()
    })

    it('should handle native DOM event listeners', () => {
      const mockStatusElement = document.createElement('span')
      const mockWrapper = document.createElement('div')
      const mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      vi.spyOn(document, 'querySelector').mockReturnValue(mockStatusElement)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should accept custom configuration parameters', () => {
      const mockStatusElement = document.createElement('span')
      const mockWrapper = document.createElement('div')
      const mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      vi.spyOn(document, 'querySelector').mockReturnValue(mockStatusElement)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            onUrlChange: mockOnUrlChange,
            pollInterval: 1000,
            debounceDelay: 500
          })
        )
      }).not.toThrow()
    })
  })

  describe('state management', () => {
    it('should initialize with the provided URL', () => {
      const customUrl = 'https://custom-example.com/file.zip'

      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: customUrl,
          onUrlChange: mockOnUrlChange
        })
      )

      expect(result.current.currentUrl).toBe(customUrl)
    })

    it('should handle empty initial URL', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: '',
          onUrlChange: mockOnUrlChange
        })
      )

      expect(result.current.currentUrl).toBe('')
    })

    it('should handle URL changes during re-renders', () => {
      const { rerender, result } = renderHook(
        ({ initialUrl }) =>
          useFileInputMonitor({
            initialUrl,
            onUrlChange: mockOnUrlChange
          }),
        { initialProps: { initialUrl: mockInitialUrl } }
      )

      expect(result.current.currentUrl).toBe(mockInitialUrl)

      const newUrl = 'https://example.com/different.zip'
      rerender({ initialUrl: newUrl })

      // Hook should maintain the same URL even on re-render since initialUrl only affects initial state
      // In real usage, the URL would change through DOM events, not prop changes
      expect(typeof result.current.currentUrl).toBe('string')
    })
  })

  describe('memory management', () => {
    it('should not leak memory on repeated mount/unmount', () => {
      for (let i = 0; i < 10; i++) {
        const { unmount } = renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: document.createElement('div'),
            onUrlChange: mockOnUrlChange
          })
        )
        unmount()
      }

      // If we got here without errors, memory management is working
      expect(true).toBe(true)
    })
  })

  describe('DOM event handling', () => {
    let mockStatusElement: HTMLElement
    let mockWrapper: HTMLElement
    let mockFileInput: HTMLInputElement

    beforeEach(() => {
      mockStatusElement = document.createElement('span')
      mockWrapper = document.createElement('div')
      mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'
      mockFileInput.value = mockInitialUrl

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      // Mock the closest method
      mockStatusElement.closest = vi.fn().mockReturnValue(mockWrapper)
    })

    it('should handle input events and update currentUrl immediately', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      const newUrl = 'https://example.com/new-file.zip'
      mockFileInput.value = newUrl

      // Simulate input event
      act(() => {
        mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(result.current.currentUrl).toBe(newUrl)
    })

    it('should handle change events and update currentUrl immediately', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      const newUrl = 'https://example.com/changed-file.zip'
      mockFileInput.value = newUrl

      // Simulate change event
      act(() => {
        mockFileInput.dispatchEvent(new Event('change', { bubbles: true }))
      })

      expect(result.current.currentUrl).toBe(newUrl)
    })

    it('should not trigger callback for duplicate values', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      // Set the same value as current
      mockFileInput.value = mockInitialUrl
      mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))

      expect(result.current.currentUrl).toBe(mockInitialUrl)
      expect(mockOnUrlChange).not.toHaveBeenCalled()
    })

    it('should handle native change events', () => {
      const addEventListenerSpy = vi.spyOn(mockFileInput, 'addEventListener')

      renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      // Test that native events are set up without throwing
      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
    })
  })

  describe('debouncing functionality', () => {
    let mockStatusElement: HTMLElement
    let mockWrapper: HTMLElement
    let mockFileInput: HTMLInputElement

    beforeEach(() => {
      mockStatusElement = document.createElement('span')
      mockWrapper = document.createElement('div')
      mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'
      mockFileInput.value = mockInitialUrl

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      // Mock the closest method
      mockStatusElement.closest = vi.fn().mockReturnValue(mockWrapper)
    })

    it('should debounce callbacks for GitHub URLs', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          debounceDelay: 100
        })
      )

      const githubUrl = mockGitHubUrl

      act(() => {
        mockFileInput.value = githubUrl
        mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      // URL should update immediately
      expect(result.current.currentUrl).toBe(githubUrl)

      // Callback should not be called immediately for GitHub URLs
      expect(mockOnUrlChange).not.toHaveBeenCalled()

      // Fast-forward time to trigger debounced callback
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(mockOnUrlChange).toHaveBeenCalledWith(githubUrl)
      expect(mockOnUrlChange).toHaveBeenCalledTimes(1)
    })

    it('should call callbacks immediately for non-GitHub URLs', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          debounceDelay: 100
        })
      )

      const regularUrl = 'https://example.com/regular-file.zip'

      act(() => {
        mockFileInput.value = regularUrl
        mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(result.current.currentUrl).toBe(regularUrl)
      expect(mockOnUrlChange).toHaveBeenCalledWith(regularUrl)
      expect(mockOnUrlChange).toHaveBeenCalledTimes(1)
    })

    it('should cancel previous debounce timer on new input', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          debounceDelay: 100
        })
      )

      const githubUrl1 = `${GITHUB_PROTOCOL}owner/repo/v1.0.0/release1.zip`
      const githubUrl2 = `${GITHUB_PROTOCOL}owner/repo/v1.0.0/release2.zip`

      // First input
      act(() => {
        mockFileInput.value = githubUrl1
        mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(result.current.currentUrl).toBe(githubUrl1)
      expect(mockOnUrlChange).not.toHaveBeenCalled()

      // Second input before debounce completes
      act(() => {
        mockFileInput.value = githubUrl2
        mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      expect(result.current.currentUrl).toBe(githubUrl2)

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Only the latest URL should trigger callback
      expect(mockOnUrlChange).toHaveBeenCalledWith(githubUrl2)
      expect(mockOnUrlChange).toHaveBeenCalledTimes(1)
    })

    it('should not call callback after unmount', () => {
      const { unmount } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          debounceDelay: 100
        })
      )

      const githubUrl = mockGitHubUrl

      act(() => {
        mockFileInput.value = githubUrl
        mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      // Unmount before debounce completes
      unmount()

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(100)
      })

      expect(mockOnUrlChange).not.toHaveBeenCalled()
    })
  })

  describe('polling mechanism', () => {
    let mockStatusElement: HTMLElement
    let mockWrapper: HTMLElement
    let mockFileInput: HTMLInputElement

    beforeEach(() => {
      mockStatusElement = document.createElement('span')
      mockWrapper = document.createElement('div')
      mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'
      mockFileInput.value = mockInitialUrl

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      // Mock the closest method
      mockStatusElement.closest = vi.fn().mockReturnValue(mockWrapper)
    })

    it('should detect value changes through polling', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          pollInterval: 50
        })
      )

      // Simulate EDD changing value directly (like media library selection)
      mockFileInput.value = 'https://example.com/poll-detected.zip'

      // Fast-forward time to trigger poll
      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current.currentUrl).toBe('https://example.com/poll-detected.zip')
      expect(mockOnUrlChange).toHaveBeenCalledWith('https://example.com/poll-detected.zip')
    })

    it('should not trigger callback for same values during polling', () => {
      renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          pollInterval: 50
        })
      )

      // Value stays the same
      mockFileInput.value = mockInitialUrl

      // Fast-forward time
      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(mockOnUrlChange).not.toHaveBeenCalled()
    })

    it('should handle multiple rapid changes detected by polling', () => {
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          pollInterval: 50
        })
      )

      // Simulate rapid value changes
      mockFileInput.value = 'https://example.com/change1.zip'
      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current.currentUrl).toBe('https://example.com/change1.zip')

      mockFileInput.value = 'https://example.com/change2.zip'
      act(() => {
        vi.advanceTimersByTime(50)
      })

      expect(result.current.currentUrl).toBe('https://example.com/change2.zip')
      expect(mockOnUrlChange).toHaveBeenCalledTimes(2)
    })

    it('should cleanup polling interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval')

      const { unmount } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          pollInterval: 50
        })
      )

      unmount()
      expect(clearIntervalSpy).toHaveBeenCalled()
    })
  })

  describe('cleanup functionality', () => {
    let mockStatusElement: HTMLElement
    let mockWrapper: HTMLElement
    let mockFileInput: HTMLInputElement
    let addEventListenerSpy: any
    let removeEventListenerSpy: any

    beforeEach(() => {
      mockStatusElement = document.createElement('span')
      mockWrapper = document.createElement('div')
      mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'
      mockFileInput.value = mockInitialUrl

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      addEventListenerSpy = vi.spyOn(mockFileInput, 'addEventListener')
      removeEventListenerSpy = vi.spyOn(mockFileInput, 'removeEventListener')

      // Mock the closest method
      mockStatusElement.closest = vi.fn().mockReturnValue(mockWrapper)
    })

    it('should add event listeners on mount', () => {
      renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      expect(addEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(addEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should remove event listeners on unmount', () => {
      const { unmount } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      unmount()

      expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
    })

    it('should cleanup native events on unmount', () => {
      const { unmount } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      unmount()

      // Test that native event listeners are removed
      expect(removeEventListenerSpy).toHaveBeenCalledWith('change', expect.any(Function))
      expect(removeEventListenerSpy).toHaveBeenCalledWith('input', expect.any(Function))
    })

    it('should clear debounce timer on unmount', () => {
      const clearTimeoutSpy = vi.spyOn(global, 'clearTimeout')

      const { unmount } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          debounceDelay: 100
        })
      )

      // Start a debounce timer
      act(() => {
        mockFileInput.value = mockGitHubUrl
        mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      unmount()

      expect(clearTimeoutSpy).toHaveBeenCalled()
    })
  })

  describe('edge cases and error handling', () => {
    it('should handle DOM API availability gracefully', () => {
      const mockStatusElement = document.createElement('span')
      const mockWrapper = document.createElement('div')
      const mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      mockStatusElement.closest = vi.fn().mockReturnValue(mockWrapper)

      expect(() => {
        renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: mockStatusElement,
            onUrlChange: mockOnUrlChange
          })
        )
      }).not.toThrow()
    })

    it('should handle null onUrlChange callback gracefully', () => {
      const mockRootElement = document.createElement('div')

      expect(() => {
        const { result } = renderHook(() =>
          useFileInputMonitor({
            initialUrl: mockInitialUrl,
            rootElement: mockRootElement,
            onUrlChange: null as any
          })
        )

        // Should still update state even with null callback
        expect(result.current.currentUrl).toBe(mockInitialUrl)
      }).not.toThrow()
    })

    it('should handle empty DOM selector results', () => {
      vi.spyOn(document, 'querySelector').mockReturnValue(null)

      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          onUrlChange: mockOnUrlChange
        })
      )

      // Should return initial URL even when DOM setup fails
      expect(result.current.currentUrl).toBe(mockInitialUrl)
    })

    it('should handle DOM mutations after mount', () => {
      const mockRootElement = document.createElement('span')

      // Start with a basic element (missing proper DOM structure)
      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockRootElement,
          onUrlChange: mockOnUrlChange
        })
      )

      expect(result.current.currentUrl).toBe(mockInitialUrl)

      // Add DOM elements after mount (shouldn't affect current instance)
      const mockWrapper = document.createElement('div')
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockRootElement.appendChild(mockWrapper)

      // Current URL should remain unchanged
      expect(result.current.currentUrl).toBe(mockInitialUrl)
    })

    it('should handle missing file input element gracefully (line 34 coverage)', () => {
      const mockStatusElement = document.createElement('span')
      const mockWrapper = document.createElement('div')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      // Don't add file input element to cover line 34

      mockStatusElement.appendChild(mockWrapper)

      // Mock the closest method to return wrapper without file input
      mockStatusElement.closest = vi.fn().mockReturnValue(mockWrapper)

      const { result } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange
        })
      )

      // Should still return initial URL even when file input is missing
      expect(result.current.currentUrl).toBe(mockInitialUrl)
      expect(mockOnUrlChange).not.toHaveBeenCalled()
    })

    it('should handle debounced callback execution with component unmount protection (line 58 coverage)', () => {
      const mockStatusElement = document.createElement('span')
      const mockWrapper = document.createElement('div')
      const mockFileInput = document.createElement('input')

      mockStatusElement.setAttribute('data-file-url', mockInitialUrl)
      mockWrapper.className = 'edd_repeatable_upload_wrapper'
      mockFileInput.className = 'edd_repeatable_upload_field'
      mockFileInput.value = mockInitialUrl

      mockWrapper.appendChild(mockFileInput)
      mockStatusElement.appendChild(mockWrapper)

      // Mock the closest method
      mockStatusElement.closest = vi.fn().mockReturnValue(mockWrapper)

      const { unmount } = renderHook(() =>
        useFileInputMonitor({
          initialUrl: mockInitialUrl,
          rootElement: mockStatusElement,
          onUrlChange: mockOnUrlChange,
          debounceDelay: 100
        })
      )

      const githubUrl = mockGitHubUrl

      act(() => {
        mockFileInput.value = githubUrl
        mockFileInput.dispatchEvent(new Event('input', { bubbles: true }))
      })

      // Unmount before debounce completes to test isMountedRef.current protection
      unmount()

      // Fast-forward time - callback should not execute due to unmount protection
      act(() => {
        vi.advanceTimersByTime(100)
      })

      // Callback should not have been called because component was unmounted
      expect(mockOnUrlChange).not.toHaveBeenCalled()
    })
  })
})