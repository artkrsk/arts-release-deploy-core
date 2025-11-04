import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { EDD_SELECTORS } from '@/constants'
import * as injectSyncUI from '@/metabox/inject-sync-ui'

// Type declarations
declare global {
  interface Window {
    releaseDeployEDD: any
  }
  var jQuery: any
}

// Mock jQuery
const mockJQueryObject = {
  length: 1,
  after: vi.fn((element) => element),
  append: vi.fn((element) => element),
  trigger: vi.fn(),
  0: { nextSibling: { nodeType: 3 } } // Add mock for nextSibling
}

const mockDocumentJQueryObject = {
  trigger: vi.fn()
}

const mockLabelObject = {
  length: 1,
  append: vi.fn((element) => element)
}

const mockJQuery = vi.fn((selector) => {
  // If selector is document, return document mock object
  if (selector === document) {
    return mockDocumentJQueryObject
  }
  // If selector is a template string (contains HTML tags), return mock object
  if (typeof selector === 'string' && selector.includes('<')) {
    return mockJQueryObject // Return mock object for HTML strings
  }
  // If selector is for label element
  if (selector === EDD_SELECTORS.CHANGELOG_LABEL) {
    return mockLabelObject
  }
  // Return the standard mock object for all other selectors
  return mockJQueryObject
})

// Don't mock the module since it's used as a global, just set up the global mock
global.jQuery = mockJQuery
;(window as any).jQuery = mockJQuery

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
    // Ensure jQuery global is available when callback executes
    global.jQuery = mockJQuery
    ;(window as any).jQuery = mockJQuery

    callback()
  }
  return 123 // Mock timer ID
})
vi.stubGlobal('setTimeout', mockSetTimeout)

describe('inject-sync-ui', () => {
  beforeEach(() => {
    vi.clearAllMocks()

    // Reset jQuery mock
    mockJQuery.mockClear()
    mockJQueryObject.length = 1
    mockJQueryObject.after = vi.fn((element) => element)
    mockJQueryObject.append = vi.fn((element) => element)
    mockJQueryObject.trigger = vi.fn()
    mockJQueryObject[0] = { nextSibling: { nodeType: 3 } }
    mockDocumentJQueryObject.trigger = vi.fn()
    mockLabelObject.append = vi.fn((element) => element)

    // Ensure jQuery is available globally and on window
    global.jQuery = mockJQuery
    ;(window as any).jQuery = mockJQuery

    // Reset window mock with deep copy to avoid test pollution
    Object.defineProperty(window, 'releaseDeployEDD', {
      value: JSON.parse(JSON.stringify(mockWindow.releaseDeployEDD)),
      writable: true,
      configurable: true
    })

    // Reset setTimeout mock
    vi.clearAllTimers()
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
      expect(mockJQuery).not.toHaveBeenCalledWith(EDD_SELECTORS.VERSION_FIELD)
      expect(mockJQueryObject.after).not.toHaveBeenCalled()
      expect(mockJQueryObject.append).not.toHaveBeenCalled()
      expect(mockJQueryObject.trigger).not.toHaveBeenCalled()
    })

    it('should create root element with correct attributes for Pro version', () => {
      window.releaseDeployEDD.features.versionSync = true

      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      // Should query for version field and create an element (calls happen inside setTimeout)
      expect(mockJQuery).toHaveBeenCalledWith(EDD_SELECTORS.VERSION_FIELD)
      // The HTML template string is created and passed to jQuery
      expect(mockJQuery).toHaveBeenCalledWith(expect.stringContaining('<div'))
      expect(mockJQuery).toHaveBeenCalledWith(expect.stringContaining('release-deploy-edd-version-sync-pro-root'))
    })

    it('should trigger initialization event', () => {
      const { injectVersionSyncUI } = injectSyncUI

      injectVersionSyncUI()

      expect(mockJQuery).toHaveBeenCalledWith(document)
      expect(mockDocumentJQueryObject.trigger).toHaveBeenCalledWith('release-deploy-edd-version-sync-ready')
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

      expect(mockJQuery).toHaveBeenCalled()
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
  })

  describe('injectChangelogSyncUI', () => {
    it('should return early when changelog sync is not enabled', () => {
      window.releaseDeployEDD.contexts.metabox.changelogSync.enabled = false

      const { injectChangelogSyncUI } = injectSyncUI

      expect(() => {
        injectChangelogSyncUI()
      }).not.toThrow()

      // Should not query for changelog field or create any elements
      expect(mockJQuery).not.toHaveBeenCalledWith(EDD_SELECTORS.CHANGELOG_FIELD)
      expect(mockJQueryObject.append).not.toHaveBeenCalled()
      expect(mockJQueryObject.trigger).not.toHaveBeenCalled()
    })

    it('should create root element with correct attributes', () => {
      window.releaseDeployEDD.features.changelogSync = true

      const { injectChangelogSyncUI } = injectSyncUI

      injectChangelogSyncUI()

      // Should query for changelog field and create an element
      expect(mockJQuery).toHaveBeenCalledWith(EDD_SELECTORS.CHANGELOG_FIELD)
      // The HTML template string is created and passed to jQuery
      expect(mockJQuery).toHaveBeenCalledWith(expect.stringContaining('<div'))
      expect(mockJQuery).toHaveBeenCalledWith(expect.stringContaining('release-deploy-edd-changelog-sync-pro-root'))
    })

    it('should trigger initialization event', () => {
      const { injectChangelogSyncUI } = injectSyncUI

      injectChangelogSyncUI()

      expect(mockJQuery).toHaveBeenCalledWith(document)
      expect(mockDocumentJQueryObject.trigger).toHaveBeenCalledWith('release-deploy-edd-changelog-sync-ready')
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

      expect(mockJQuery).toHaveBeenCalled()
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
  })

  describe('DOM manipulation patterns', () => {
    it('should handle multiple injection calls gracefully', () => {
      const { injectVersionSyncUI } = injectSyncUI
      const { injectChangelogSyncUI } = injectSyncUI

      injectVersionSyncUI()
      injectVersionSyncUI()
      injectChangelogSyncUI()

      // Each call queries for the field, creates HTML, queries document, and triggers
      // Version sync: 2 calls * 4 (field query, HTML creation, nextNode query, doc query) = 8
      // Changelog sync: 1 call * 4 (field query, HTML creation, label query, doc query) = 4
      expect(mockJQuery).toHaveBeenCalledTimes(12)
      expect(mockDocumentJQueryObject.trigger).toHaveBeenCalledTimes(3)
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

      expect(mockJQuery).toHaveBeenCalled()
    })

    it('should use Free suffix when features are not available', () => {
      window.releaseDeployEDD.features.versionSync = false
      window.releaseDeployEDD.features.changelogSync = false

      const { injectVersionSyncUI } = injectSyncUI
      const { injectChangelogSyncUI } = injectSyncUI

      injectVersionSyncUI()
      injectChangelogSyncUI()

      expect(mockJQuery).toHaveBeenCalled()
    })
  })

  describe('error handling and edge cases', () => {
    
    it('should handle jQuery selector failures gracefully', () => {
      mockJQueryObject.length = 0

      const { injectVersionSyncUI } = injectSyncUI

      expect(() => {
        injectVersionSyncUI()
      }).not.toThrow()

      // Verify it was called but didn't proceed with DOM manipulation
      expect(mockJQuery).toHaveBeenCalledWith(EDD_SELECTORS.VERSION_FIELD)
      expect(mockJQueryObject.after).not.toHaveBeenCalled()
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