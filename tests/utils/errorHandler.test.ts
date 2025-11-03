import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { handleError, getErrorMessage, getContextLabel } from '../../src/utils/errorHandler'
import type { ErrorContext } from '../../src/types'

describe('errorHandler', () => {
  describe('getErrorMessage', () => {
    it('should extract message from Error object', () => {
      const error = new Error('Something went wrong')
      expect(getErrorMessage(error)).toBe('Something went wrong')
    })

    it('should return string error as-is', () => {
      expect(getErrorMessage('String error')).toBe('String error')
    })

    it('should extract message from error-like object', () => {
      const error = { message: 'Custom error' }
      expect(getErrorMessage(error)).toBe('Custom error')
    })

    it('should return default message for unknown error types', () => {
      expect(getErrorMessage(null)).toBe('An unknown error occurred')
      expect(getErrorMessage(undefined)).toBe('An unknown error occurred')
      expect(getErrorMessage(123)).toBe('An unknown error occurred')
      expect(getErrorMessage({})).toBe('An unknown error occurred')
    })

    it('should handle error objects with non-string message', () => {
      const error = { message: 12345 }
      expect(getErrorMessage(error)).toBe('12345')
    })
  })

  describe('getContextLabel', () => {
    it('should return correct label for each context', () => {
      expect(getContextLabel('version-sync')).toBe('Version Sync')
      expect(getContextLabel('changelog-sync')).toBe('Changelog Sync')
      expect(getContextLabel('webhook')).toBe('Webhook')
      expect(getContextLabel('browser')).toBe('File Browser')
      expect(getContextLabel('file-status')).toBe('File Status')
      expect(getContextLabel('settings')).toBe('Settings')
      expect(getContextLabel('general')).toBe('Release Deploy')
    })

    it('should return default for unknown context', () => {
      expect(getContextLabel('unknown' as ErrorContext)).toBe('Error')
    })
  })

  describe('handleError', () => {
    let consoleErrorSpy: any
    let consoleWarnSpy: any

    beforeEach(() => {
      consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      consoleWarnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {})
    })

    afterEach(() => {
      consoleErrorSpy.mockRestore()
      consoleWarnSpy.mockRestore()
    })

    it('should return formatted error object', () => {
      const result = handleError('Test error', 'settings')

      expect(result).toEqual({
        message: 'Test error',
        context: 'settings',
        details: null
      })
    })

    it('should extract message from Error object', () => {
      const error = new Error('Something failed')
      const result = handleError(error, 'browser')

      expect(result.message).toBe('Something failed')
      expect(result.context).toBe('browser')
    })

    it('should include details in return value', () => {
      const details = { code: 'ERR_001', metadata: 'extra info' }
      const result = handleError('Test error', 'settings', { details })

      expect(result.details).toBe(details)
    })

    it('should log to console when critical is true', () => {
      handleError('Critical error', 'webhook', { critical: true })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[EDD Release Deploy - webhook] Critical error',
        ''
      )
    })

    it('should log details when critical is true and details provided', () => {
      const details = { info: 'debug data' }
      handleError('Critical error', 'webhook', { critical: true, details })

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        '[EDD Release Deploy - webhook] Critical error',
        details
      )
    })

    it('should not log when critical is false', () => {
      handleError('Non-critical error', 'settings', { critical: false })

      expect(consoleErrorSpy).not.toHaveBeenCalled()
    })

    it('should warn when notify is true', () => {
      handleError('User error', 'settings', { notify: true })

      expect(consoleWarnSpy).toHaveBeenCalledWith('[settings] User error')
    })

    it('should not warn when notify is false', () => {
      handleError('Silent error', 'settings', { notify: false })

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should handle all options together', () => {
      const details = { extra: 'data' }
      const result = handleError('Complex error', 'version-sync', {
        critical: true,
        notify: true,
        details
      })

      expect(result).toEqual({
        message: 'Complex error',
        context: 'version-sync',
        details
      })
      expect(consoleErrorSpy).toHaveBeenCalled()
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should handle default options when none provided', () => {
      const result = handleError('Default error', 'general')

      expect(result).toEqual({
        message: 'Default error',
        context: 'general',
        details: null
      })
      expect(consoleErrorSpy).not.toHaveBeenCalled()
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })
})
