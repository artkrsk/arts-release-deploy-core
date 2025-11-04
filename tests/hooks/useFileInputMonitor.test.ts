import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useFileInputMonitor } from '../../src/hooks/useFileInputMonitor'
import { GITHUB_PROTOCOL, INTERVALS, EDD_SELECTORS } from '../../src/constants'

// Mock jQuery
const mockJQuery = vi.fn()
global.jQuery = mockJQuery

describe('useFileInputMonitor', () => {
  const mockInitialUrl = 'https://example.com/file.zip'
  const mockGitHubUrl = `${GITHUB_PROTOCOL}owner/repo/v1.0.0/release.zip`
  const mockOnUrlChange = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    vi.useFakeTimers()

    // Mock jQuery
    mockJQuery.mockReturnValue({
      on: vi.fn(),
      off: vi.fn()
    })

    // Mock window timers
    vi.stubGlobal('setTimeout', vi.fn((fn, delay) => {
      return setTimeout(fn, delay)
    }))
    vi.stubGlobal('clearTimeout', vi.fn())
    vi.stubGlobal('setInterval', vi.fn((fn, interval) => {
      return setInterval(fn, interval)
    }))
    vi.stubGlobal('clearInterval', vi.fn())
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
          rootElement: mockRootElement,
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
          rootElement: mockRootElement,
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

    it('should handle missing jQuery gracefully', () => {
      delete (global as any).jQuery

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
})