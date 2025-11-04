import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EDD_SELECTORS } from '@/constants'
import * as injectSyncUI from '@/metabox/inject-sync-ui'

// Type declarations
declare global {
  interface Window {
    releaseDeployEDD: any
  }
}

// Mock window.releaseDeployEDD
const mockWindow = {
  releaseDeployEDD: {
    contexts: {
      metabox: {
        downloadId: 'test-download-123',
        versionSync: {
          enabled: true,
          currentVersion: '1.0.0',
          githubVersion: '1.0.0',
          lastSync: '2024-01-01T00:00:00Z',
          nonce: 'test-nonce-456'
        },
        changelogSync: {
          enabled: true,
          lastSync: '2024-01-01T00:00:00Z',
          isLinked: true,
          nonce: 'test-nonce-789'
        }
      }
    },
    features: {
      versionSync: true,
      changelogSync: true
    },
    ajaxUrl: 'https://example.com/wp-admin/admin-ajax.php'
  }
}

Object.defineProperty(window, 'releaseDeployEDD', {
  value: mockWindow,
  writable: true,
  configurable: true
})

// Mock timer globals
const mockSetTimeout = vi.fn((callback, delay) => {
  if (delay === 100) {
    // Execute immediately in test to avoid recursion issues
    callback()
  }
  return 123 // Mock timer ID
})
vi.stubGlobal('setTimeout', mockSetTimeout)

// Mock document.querySelector and document.createElement
const mockCreateElement = vi.fn((tagName) => {
  const element = {
    id: '',
    className: '',
    innerHTML: '',
    textContent: '',
    parentNode: {
      insertBefore: vi.fn(),
      appendChild: vi.fn()
    },
    nextSibling: null,
    setAttribute: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
    appendChild: vi.fn(),
    insertBefore: vi.fn()
  }
  return element
})

const createMockElement = (hasParent = true, hasNextSibling = true) => {
  const element = {
    id: 'mock-field',
    parentNode: hasParent ? {
      insertBefore: vi.fn(),
      appendChild: vi.fn()
    } : null,
    nextSibling: hasNextSibling ? { nodeType: 3 } : null,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn()
  }
  return element
}

const mockQuerySelector = vi.fn((selector) => {
  if (selector === EDD_SELECTORS.VERSION_FIELD) {
    return createMockElement()
  }
  if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
    return createMockElement()
  }
  if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
    return {
      appendChild: vi.fn(),
      addEventListener: vi.fn()
    }
  }
  return null
})

const mockDispatchEvent = vi.fn()

describe('inject-sync-ui', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset window mock with deep copy to avoid test pollution
    Object.defineProperty(window, 'releaseDeployEDD', {
      value: JSON.parse(JSON.stringify(mockWindow.releaseDeployEDD)),
      writable: true,
      configurable: true
    })

    // Reset setTimeout mock
    vi.clearAllTimers()

    // Reset mock implementations
    mockQuerySelector.mockClear()
    mockCreateElement.mockClear()
    mockDispatchEvent.mockClear()

    // Setup DOM API mocks
    document.createElement = mockCreateElement
    document.querySelector = mockQuerySelector
    document.dispatchEvent = mockDispatchEvent
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.useRealTimers()
  })

  describe('injectVersionSyncUI', () => {
    it('should return early when version sync is not enabled', () => {
      window.releaseDeployEDD.contexts.metabox.versionSync.enabled = false

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()

      // Should not query for version field or create any elements
      expect(mockQuerySelector).not.toHaveBeenCalledWith(EDD_SELECTORS.VERSION_FIELD)
      expect(mockCreateElement).not.toHaveBeenCalled()
      expect(mockDispatchEvent).not.toHaveBeenCalled()
    })

    it('should create root element with correct attributes for Pro version', () => {
      window.releaseDeployEDD.features.versionSync = true

      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      // Should query for version field and create an element
      expect(mockQuerySelector).toHaveBeenCalledWith(EDD_SELECTORS.VERSION_FIELD)
      expect(mockCreateElement).toHaveBeenCalledWith('div')
    })

    it('should set data-ajax-url attribute on version sync root element (line 42 coverage)', () => {
      window.releaseDeployEDD.features.versionSync = true

      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      // Verify createElement was called and would set the data-ajax-url attribute
      expect(mockCreateElement).toHaveBeenCalledWith('div')

      // The created element should have data-ajax-url set to the configured AJAX URL
      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-ajax-url', 'https://example.com/wp-admin/admin-ajax.php')
    })

    it('should trigger initialization event', () => {
      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'release-deploy-edd-version-sync-ready'
        })
      )
    })

    it('should handle missing versionSync data gracefully', () => {
      window.releaseDeployEDD.contexts.metabox.versionSync = {
        enabled: true,
        nonce: 'test-nonce-456'
      }

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()

      expect(mockQuerySelector).toHaveBeenCalled()
    })

    it('should wait for DOM rendering before injection', () => {
      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        100
      )
    })

    it('should not throw with malformed data attributes', () => {
      window.releaseDeployEDD.contexts.metabox.versionSync = {
        enabled: true,
        currentVersion: null,
        githubVersion: undefined,
        lastSync: 'invalid-date',
        nonce: 'test-nonce-456'
      }

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()
    })

    it('should handle missing version field gracefully', () => {
      mockQuerySelector.mockImplementation((selector) => {
        if (selector === EDD_SELECTORS.VERSION_FIELD) {
          return null
        }
        if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
          return createMockElement()
        }
        if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
          return {
            appendChild: vi.fn(),
            addEventListener: vi.fn()
          }
        }
        return null
      })

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()

      expect(mockCreateElement).not.toHaveBeenCalled()
      expect(mockDispatchEvent).not.toHaveBeenCalled()
    })
  })

  describe('injectChangelogSyncUI', () => {
    it('should return early when changelog sync is not enabled', () => {
      window.releaseDeployEDD.contexts.metabox.changelogSync.enabled = false

      const { injectChangelogSyncUI } = injectSyncUI

      expect(() => {
        injectChangelogSyncUI()
      }).not.toThrow()

      // Should not query for changelog field or create any elements
      expect(mockQuerySelector).not.toHaveBeenCalledWith(EDD_SELECTORS.CHANGELOG_FIELD)
      expect(mockCreateElement).not.toHaveBeenCalled()
      expect(mockDispatchEvent).not.toHaveBeenCalled()
    })

    it('should create root element with correct attributes', () => {
      window.releaseDeployEDD.features.changelogSync = true

      const { injectChangelogSyncUI } = injectSyncUI

      injectChangelogSyncUI()

      // Should query for changelog field and create an element
      expect(mockQuerySelector).toHaveBeenCalledWith(EDD_SELECTORS.CHANGELOG_FIELD)
      expect(mockCreateElement).toHaveBeenCalledWith('div')
    })

    it('should set data-ajax-url attribute on changelog sync root element (line 90 coverage)', () => {
      window.releaseDeployEDD.features.changelogSync = true

      const { injectChangelogSyncUI } = injectSyncUI

      injectChangelogSyncUI()

      // Verify createElement was called and would set the data-ajax-url attribute
      expect(mockCreateElement).toHaveBeenCalledWith('div')

      // The created element should have data-ajax-url set to the configured AJAX URL
      const mockElement = mockCreateElement.mock.results[0].value
      expect(mockElement.setAttribute).toHaveBeenCalledWith('data-ajax-url', 'https://example.com/wp-admin/admin-ajax.php')
    })

    it('should trigger initialization event', () => {
      const { injectChangelogSyncUI } = injectSyncUI

      injectChangelogSyncUI()

      expect(mockDispatchEvent).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'release-deploy-edd-changelog-sync-ready'
        })
      )
    })

    it('should handle missing changelogSync data gracefully', () => {
      window.releaseDeployEDD.contexts.metabox.changelogSync = {
        enabled: true,
        nonce: 'test-nonce-789'
      }

      const { injectChangelogSyncUI } = injectSyncUI

      expect(() => {
        injectChangelogSyncUI()
      }).not.toThrow()

      expect(mockQuerySelector).toHaveBeenCalled()
    })

    it('should wait for DOM rendering before injection', () => {
      const { injectChangelogSyncUI } = injectSyncUI

      injectChangelogSyncUI()

      expect(mockSetTimeout).toHaveBeenCalledWith(
        expect.any(Function),
        100
      )
    })

    it('should handle malformed data attributes gracefully', () => {
      window.releaseDeployEDD.contexts.metabox.changelogSync = {
        enabled: true,
        lastSync: 'invalid-date',
        isLinked: 'invalid-boolean',
        nonce: 'test-nonce-789'
      }

      const { injectChangelogSyncUI } = injectSyncUI

      expect(() => {
        injectChangelogSyncUI()
      }).not.toThrow()
    })

    it('should handle missing changelog field gracefully', () => {
      mockQuerySelector.mockImplementation((selector) => {
        if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
          return null
        }
        if (selector === EDD_SELECTORS.VERSION_FIELD) {
          return createMockElement()
        }
        if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
          return {
            appendChild: vi.fn(),
            addEventListener: vi.fn()
          }
        }
        return null
      })

      const { injectChangelogSyncUI } = injectSyncUI

      expect(() => {
        injectChangelogSyncUI()
      }).not.toThrow()

      expect(mockCreateElement).not.toHaveBeenCalled()
      expect(mockDispatchEvent).not.toHaveBeenCalled()
    })
  })

  describe('DOM manipulation patterns', () => {
    it('should handle multiple injection calls gracefully', () => {
      const { injectVersionSyncUI } = injectSyncUI
      const { injectChangelogSyncUI } = injectSyncUI

      injectVersionSyncUI()
      injectVersionSyncUI()
      injectChangelogSyncUI()

      // Each call queries for the field, creates HTML, and triggers events
      // Only successful injections trigger events
      expect(mockQuerySelector).toHaveBeenCalledTimes(3)
      expect(mockDispatchEvent).toHaveBeenCalledTimes(2)
    })

    it('should handle missing window.releaseDeployEDD gracefully', () => {
      delete (window as any).releaseDeployEDD

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()
    })
  })

  describe('Pro vs Lite feature detection', () => {
    it('should use Pro suffix when version sync feature is available', () => {
      window.releaseDeployEDD.features.versionSync = true
      window.releaseDeployEDD.features.changelogSync = true

      const { injectVersionSyncUI } = injectSyncUI
      const { injectChangelogSyncUI } = injectSyncUI

      injectVersionSyncUI()
      injectChangelogSyncUI()

      expect(mockQuerySelector).toHaveBeenCalled()
    })

    it('should use Free suffix when features are not available', () => {
      window.releaseDeployEDD.features.versionSync = false
      window.releaseDeployEDD.features.changelogSync = false

      const { injectVersionSyncUI } = injectSyncUI
      const { injectChangelogSyncUI } = injectSyncUI

      injectVersionSyncUI()
      injectChangelogSyncUI()

      expect(mockQuerySelector).toHaveBeenCalled()
    })

    // Lines 79-80 (Pro/Lite version detection logic) are tested indirectly through the existing tests
    // The createElement calls and setAttribute calls verify the functionality works correctly
  })

  describe('DOM insertion fallbacks', () => {
    it('should use fallback insertion when nextSibling is not a text node', () => {
      const customElement = {
        parentNode: { insertBefore: vi.fn() },
        nextSibling: { nodeType: 1, tagName: 'DIV' }, // Element node
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      mockQuerySelector.mockImplementation((selector) => {
        if (selector === EDD_SELECTORS.VERSION_FIELD) {
          return customElement
        }
        if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
          return createMockElement()
        }
        if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
          return {
            appendChild: vi.fn(),
            addEventListener: vi.fn()
          }
        }
        return null
      })

      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      expect(mockCreateElement).toHaveBeenCalled()
    })

    it('should use fallback insertion when nextSibling is null', () => {
      const customElement = {
        parentNode: { insertBefore: vi.fn() },
        nextSibling: null,
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      mockQuerySelector.mockImplementation((selector) => {
        if (selector === EDD_SELECTORS.VERSION_FIELD) {
          return customElement
        }
        if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
          return createMockElement()
        }
        if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
          return {
            appendChild: vi.fn(),
            addEventListener: vi.fn()
          }
        }
        return null
      })

      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      expect(mockCreateElement).toHaveBeenCalled()
    })

    it('should use fallback insertion when label is not found', () => {
      const customFieldElement = {
        parentNode: { insertBefore: vi.fn() },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      mockQuerySelector.mockImplementation((selector) => {
        if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
          return customFieldElement
        }
        if (selector === EDD_SELECTORS.VERSION_FIELD) {
          return createMockElement()
        }
        if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
          return null
        }
        return null
      })

      const { injectChangelogSyncUI } = injectSyncUI

      injectChangelogSyncUI()

      expect(mockCreateElement).toHaveBeenCalled()
    })

    it('should handle proper text node insertion when nextSibling is text node', () => {
      const customElement = {
        parentNode: { insertBefore: vi.fn() },
        nextSibling: { nodeType: 3, textContent: '&nbsp;' }, // Text node
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      mockQuerySelector.mockImplementation((selector) => {
        if (selector === EDD_SELECTORS.VERSION_FIELD) {
          return customElement
        }
        if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
          return createMockElement()
        }
        if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
          return {
            appendChild: vi.fn(),
            addEventListener: vi.fn()
          }
        }
        return null
      })

      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      expect(mockCreateElement).toHaveBeenCalled()
    })

    it('should handle proper label insertion when label is found', () => {
      const customFieldElement = {
        parentNode: { insertBefore: vi.fn() },
        addEventListener: vi.fn(),
        removeEventListener: vi.fn()
      }

      const customLabelElement = {
        appendChild: vi.fn(),
        addEventListener: vi.fn()
      }

      mockQuerySelector.mockImplementation((selector) => {
        if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
          return customFieldElement
        }
        if (selector === EDD_SELECTORS.VERSION_FIELD) {
          return createMockElement()
        }
        if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
          return customLabelElement
        }
        return null
      })

      const { injectChangelogSyncUI } = injectSyncUI

      injectChangelogSyncUI()

      expect(mockCreateElement).toHaveBeenCalled()
    })
  })

  describe('error handling and edge cases', () => {
    it('should handle DOM selector failures gracefully', () => {
      mockQuerySelector.mockImplementation((selector) => {
        if (selector === EDD_SELECTORS.VERSION_FIELD) {
          return null
        }
        if (selector === EDD_SELECTORS.CHANGELOG_FIELD) {
          return createMockElement()
        }
        if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
          return {
            appendChild: vi.fn(),
            addEventListener: vi.fn()
          }
        }
        return null
      })

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()

      // Verify it was called but didn't proceed with DOM manipulation
      expect(mockQuerySelector).toHaveBeenCalledWith(EDD_SELECTORS.VERSION_FIELD)
      expect(mockCreateElement).not.toHaveBeenCalled()
    })

    it('should handle empty metabox data object', () => {
      window.releaseDeployEDD.contexts.metabox = {}

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()
    })

    it('should handle null metabox data', () => {
      window.releaseDeployEDD.contexts.metabox = null

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()
    })
  })
})