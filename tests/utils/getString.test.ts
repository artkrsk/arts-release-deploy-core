import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { getString } from '../../src/utils/getString'
import { TRANSLATION_FALLBACKS } from '../../src/constants/TRANSLATION_FALLBACKS'

describe('getString', () => {
  // Store original window.releaseDeployEDD
  let originalWindow: any

  beforeEach(() => {
    // Save original window object
    originalWindow = (global as any).window.releaseDeployEDD
  })

  afterEach(() => {
    // Restore original window object
    (global as any).window.releaseDeployEDD = originalWindow
  })

  describe('when translations are available from backend', () => {
    it('should return translated string from window.releaseDeployEDD', () => {
      // Setup mock translations
      (global as any).window.releaseDeployEDD = {
        strings: {
          'common.getPro': 'Obtenir Pro',
          'token.checking': 'Vérification de la connexion...'
        }
      }

      expect(getString('common.getPro')).toBe('Obtenir Pro')
      expect(getString('token.checking')).toBe('Vérification de la connexion...')
    })

    it('should handle partial translations and use fallbacks for missing keys', () => {
      // Setup partial translations
      (global as any).window.releaseDeployEDD = {
        strings: {
          'common.getPro': 'Obtener Pro' // Spanish
        }
      }

      // Should use provided translation
      expect(getString('common.getPro')).toBe('Obtener Pro')

      // Should use fallback for missing translation
      expect(getString('token.checking')).toBe(TRANSLATION_FALLBACKS['token.checking'])
    })
  })

  describe('when window.releaseDeployEDD is not defined', () => {
    it('should return fallback translation', () => {
      // Clear window.releaseDeployEDD
      (global as any).window.releaseDeployEDD = undefined

      expect(getString('common.getPro')).toBe('Get Pro')
      expect(getString('token.checking')).toBe('Checking connection...')
      expect(getString('file.ready')).toBe('Ready')
    })
  })

  describe('when window.releaseDeployEDD.strings is not defined', () => {
    it('should return fallback translation', () => {
      // Setup window without strings
      (global as any).window.releaseDeployEDD = {
        ajaxUrl: '/wp-admin/admin-ajax.php'
      }

      expect(getString('token.invalid')).toBe('Invalid GitHub token')
      expect(getString('sync.autoVersionSync')).toBe('Auto Version Sync')
    })
  })

  describe('when translation key exists but value is empty', () => {
    it('should return empty string from backend', () => {
      // Setup with empty string value
      (global as any).window.releaseDeployEDD = {
        strings: {
          'common.getPro': '' // Empty string from backend
        }
      }

      // Should return empty string (truthy check will fail)
      expect(getString('common.getPro')).toBe('Get Pro')
    })

    it('should return non-empty string from backend', () => {
      // Setup with space value
      (global as any).window.releaseDeployEDD = {
        strings: {
          'common.getPro': ' ' // Space is truthy
        }
      }

      expect(getString('common.getPro')).toBe(' ')
    })
  })

  describe('fallback translations', () => {
    beforeEach(() => {
      // Clear translations for fallback testing
      (global as any).window.releaseDeployEDD = undefined
    })

    it('should provide all token field fallbacks', () => {
      expect(getString('token.checking')).toBe('Checking connection...')
      expect(getString('token.connected')).toBe('Connected')
      expect(getString('token.invalid')).toBe('Invalid GitHub token')
      expect(getString('token.apiCalls')).toBe('API calls remaining')
      expect(getString('token.managedViaConstant')).toBe('Managed via PHP constant')
      expect(getString('token.constantHelp')).toContain('wp-config.php')
      expect(getString('token.hide')).toBe('Hide token')
      expect(getString('token.show')).toBe('Show token')
      expect(getString('token.refresh')).toBe('Click to refresh')
      expect(getString('token.howToCreate')).toBe('How to Create a GitHub Token')
      expect(getString('token.instruction1')).toContain('GitHub.com')
      expect(getString('token.instruction2')).toContain('Generate new token')
      expect(getString('token.instruction3')).toContain('descriptive name')
      expect(getString('token.instruction4')).toContain('repo')
      expect(getString('token.instruction5')).toContain('copy the token')
      expect(getString('token.instruction6')).toContain('Paste the token')
    })

    it('should provide all file status fallbacks', () => {
      expect(getString('file.testing')).toBe('Testing...')
      expect(getString('file.ready')).toBe('Ready')
      expect(getString('file.networkError')).toBe('Network error')
      expect(getString('file.retest')).toBe('Click to re-test')
      expect(getString('file.retry')).toBe('Click to retry')
    })

    it('should provide all sync fallbacks', () => {
      expect(getString('sync.autoVersionSync')).toBe('Auto Version Sync')
      expect(getString('sync.autoChangelogSync')).toBe('Auto Changelog Sync')
    })

    it('should provide all common fallbacks', () => {
      expect(getString('common.getPro')).toBe('Get Pro')
      expect(getString('common.fixIt')).toBe('Fix It')
    })
  })

  describe('edge cases', () => {
    it('should handle invalid key that exists in neither backend nor fallbacks', () => {
      (global as any).window.releaseDeployEDD = {
        strings: {}
      }

      // TypeScript prevents this at compile time, but testing runtime behavior
      const invalidKey = 'invalid.key.that.does.not.exist' as any
      expect(getString(invalidKey)).toBe(invalidKey)
    })

    it('should handle null strings object', () => {
      (global as any).window.releaseDeployEDD = {
        strings: null
      }

      expect(getString('common.getPro')).toBe('Get Pro')
    })

    it('should handle undefined value in strings object', () => {
      (global as any).window.releaseDeployEDD = {
        strings: {
          'common.getPro': undefined
        }
      }

      expect(getString('common.getPro')).toBe('Get Pro')
    })
  })
})