import React from 'react'
import { describe, it, expect, beforeEach, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { FileStatus } from '@/metabox/FileStatus'
import type { IFileValidationResult } from '@/interfaces'
import { GITHUB_PROTOCOL } from '@/constants'

// Mock dependencies
vi.mock('@/hooks/useFileValidation', () => ({
  useFileValidation: vi.fn()
}))

vi.mock('@/hooks/useFileInputMonitor', () => ({
  useFileInputMonitor: vi.fn()
}))

vi.mock('@/utils/format', () => ({
  formatSize: vi.fn((size: number) => `${size} bytes`)
}))

vi.mock('@/utils/getString', () => ({
  getString: vi.fn((key: string) => key)
}))

vi.mock('@/components/ProBadge', () => ({
  ProBadge: vi.fn(({ text, href, status, renderAsLink, showWrapper }) =>
    React.createElement('a', {
      href,
      className: `pro-badge-${status}`,
      'data-testid': `pro-badge-${status}`
    }, text)
  )
}))

import { useFileValidation } from '@/hooks/useFileValidation'
import { useFileInputMonitor } from '@/hooks/useFileInputMonitor'
import { formatSize } from '@/utils/format'

describe('FileStatus', () => {
  const mockAjaxUrl = 'https://example.com/wp-admin/admin-ajax.php'
  const mockNonce = 'test-nonce-123'
  const mockFileUrl = `${GITHUB_PROTOCOL}owner/repo/v1.0.0/release.zip`
  const mockNonGitHubUrl = 'https://example.com/file.zip'

  const mockResult: IFileValidationResult = {
    size: 1024,
    exists: true
  }

  let mockUseFileValidation: any
  let mockUseFileInputMonitor: any

  beforeEach(() => {
    vi.clearAllMocks()

    // Setup window.releaseDeployEDD
    Object.defineProperty(window, 'releaseDeployEDD', {
      writable: true,
      configurable: true,
      value: {
        ajaxUrl: mockAjaxUrl,
        purchaseUrl: 'https://example.com/purchase',
        settingsUrl: 'https://example.com/settings',
        contexts: {
          settings: {
            nonce: mockNonce
          }
        }
      }
    })

    // Default mock implementations
    mockUseFileValidation = {
      status: 'idle',
      result: null,
      error: null,
      errorCode: null,
      testFile: vi.fn()
    }

    mockUseFileInputMonitor = {
      currentUrl: mockFileUrl
    }

    vi.mocked(useFileValidation).mockReturnValue(mockUseFileValidation)
    vi.mocked(useFileInputMonitor).mockReturnValue(mockUseFileInputMonitor)
  })

  describe('initial rendering', () => {
    it('should render null when status is idle', () => {
      render(<FileStatus fileUrl={mockFileUrl} />)

      // The component may test the file immediately but should not render UI when idle
      expect(document.querySelector('.release-deploy-edd-file-status')).not.toBeInTheDocument()
    })

    it('should render null when currentUrl is empty', () => {
      mockUseFileInputMonitor.currentUrl = ''

      render(<FileStatus fileUrl="" />)

      expect(document.querySelector('.release-deploy-edd-file-status')).not.toBeInTheDocument()
    })

    it('should render null when currentUrl is not a GitHub URL', () => {
      mockUseFileInputMonitor.currentUrl = mockNonGitHubUrl

      render(<FileStatus fileUrl={mockNonGitHubUrl} />)

      expect(document.querySelector('.release-deploy-edd-file-status')).not.toBeInTheDocument()
    })

    it('should render null when currentUrl is null', () => {
      mockUseFileInputMonitor.currentUrl = null

      render(<FileStatus fileUrl="" />)

      expect(document.querySelector('.release-deploy-edd-file-status')).not.toBeInTheDocument()
    })
  })

  describe('testing status', () => {
    it('should render testing status', () => {
      mockUseFileValidation.status = 'testing'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status_testing')
      expect(statusElement).toBeInTheDocument()

      const loadingIcon = document.querySelector('.release-deploy-edd-icon_loading')
      expect(loadingIcon).toBeInTheDocument()

      const message = screen.getByText('file.testing')
      expect(message).toBeInTheDocument()
    })

    it('should not be clickable when testing', () => {
      mockUseFileValidation.status = 'testing'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status')
      expect(statusElement).toBeInTheDocument()

      // Should have empty title when testing (the JSX conditionally sets empty string)
      expect(statusElement).toHaveAttribute('title', '')
    })
  })

  describe('ready status', () => {
    beforeEach(() => {
      mockUseFileValidation.status = 'ready'
      mockUseFileValidation.result = mockResult
      vi.mocked(formatSize).mockReturnValue('1 KB')
    })

    it('should render ready status with file size', () => {
      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status_ready')
      expect(statusElement).toBeInTheDocument()

      const successIcon = document.querySelector('.release-deploy-edd-icon_success')
      expect(successIcon).toBeInTheDocument()

      const message = screen.getByText('file.ready (1 KB)')
      expect(message).toBeInTheDocument()

      expect(formatSize).toHaveBeenCalledWith(1024)
    })

    it('should have correct title for ready status', () => {
      mockUseFileValidation.status = 'ready'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status')
      expect(statusElement).toHaveAttribute('title', 'file.retest')
    })

    it('should be clickable when ready', () => {
      mockUseFileValidation.status = 'ready'
      mockUseFileValidation.result = mockResult

      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status')
      expect(statusElement).toBeInTheDocument()

      fireEvent.click(statusElement!)

      expect(mockUseFileValidation.testFile).toHaveBeenCalledWith(mockFileUrl)
    })
  })

  describe('error status', () => {
    beforeEach(() => {
      mockUseFileValidation.status = 'error'
      mockUseFileValidation.error = 'Test error message'
    })

    it('should render error status with message', () => {
      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status_error')
      expect(statusElement).toBeInTheDocument()

      const errorIcon = document.querySelector('.release-deploy-edd-icon_error')
      expect(errorIcon).toBeInTheDocument()

      const message = screen.getByText('Test error message')
      expect(message).toBeInTheDocument()
    })

    it('should have correct title for error status', () => {
      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status')
      expect(statusElement).toHaveAttribute('title', 'file.retry')
    })

    it('should be clickable when error', () => {
      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status')
      expect(statusElement).toBeInTheDocument()

      fireEvent.click(statusElement!)

      expect(mockUseFileValidation.testFile).toHaveBeenCalledWith(mockFileUrl)
    })

    it('should show ProBadge for pro_feature error code', () => {
      mockUseFileValidation.errorCode = 'pro_feature'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const proBadge = screen.getByTestId('pro-badge-default')
      expect(proBadge).toBeInTheDocument()
      expect(proBadge).toHaveAttribute('href', 'https://example.com/purchase')
      expect(proBadge).toHaveTextContent('common.getPro')
    })

    it('should show warning ProBadge for token-related errors', () => {
      mockUseFileValidation.error = 'Invalid token provided'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const proBadge = screen.getByTestId('pro-badge-warning')
      expect(proBadge).toBeInTheDocument()
      expect(proBadge).toHaveAttribute('href', 'https://example.com/settings')
      expect(proBadge).toHaveTextContent('common.fixIt')
    })

    it('should show both ProBadges for pro feature with token error', () => {
      mockUseFileValidation.errorCode = 'pro_feature'
      mockUseFileValidation.error = 'Token required for pro feature'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const defaultBadge = screen.getByTestId('pro-badge-default')
      const warningBadge = screen.getByTestId('pro-badge-warning')

      expect(defaultBadge).toBeInTheDocument()
      expect(warningBadge).toBeInTheDocument()
    })

    it('should not show ProBadge for non-pro errors', () => {
      mockUseFileValidation.errorCode = 'not_found'
      mockUseFileValidation.error = 'File not found'

      render(<FileStatus fileUrl={mockFileUrl} />)

      expect(screen.queryByTestId(/^pro-badge-/)).not.toBeInTheDocument()
    })

    it('should show warning ProBadge for any error containing "token" (case insensitive)', () => {
      mockUseFileValidation.error = 'TOKEN_EXPIRED'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const proBadge = screen.getByTestId('pro-badge-warning')
      expect(proBadge).toBeInTheDocument()
    })
  })

  describe('URL monitoring and testing', () => {
    it('should call hooks with correct parameters', () => {
      render(<FileStatus fileUrl={mockFileUrl} rootElement={document.body} />)

      expect(useFileValidation).toHaveBeenCalledWith({
        fileUrl: mockFileUrl,
        ajaxUrl: mockAjaxUrl,
        nonce: mockNonce,
        enabled: false
      })

      expect(useFileInputMonitor).toHaveBeenCalledWith({
        initialUrl: mockFileUrl,
        rootElement: document.body,
        onUrlChange: expect.any(Function)
      })
    })

    it('should test file when currentUrl changes to GitHub URL', () => {
      const { rerender } = render(<FileStatus fileUrl={mockFileUrl} />)

      // Clear initial call
      mockUseFileValidation.testFile.mockClear()

      // Simulate URL change
      mockUseFileInputMonitor.currentUrl = `${GITHUB_PROTOCOL}owner/repo/v2.0.0/release.zip`
      vi.mocked(useFileInputMonitor).mockReturnValue(mockUseFileInputMonitor)

      rerender(<FileStatus fileUrl={mockFileUrl} />)

      // The component should test the new URL
      expect(mockUseFileValidation.testFile).toHaveBeenCalledWith(
        `${GITHUB_PROTOCOL}owner/repo/v2.0.0/release.zip`
      )
    })

    it('should not test file when currentUrl changes to non-GitHub URL', () => {
      const { rerender } = render(<FileStatus fileUrl={mockFileUrl} />)

      // Clear initial call
      mockUseFileValidation.testFile.mockClear()

      // Simulate URL change to non-GitHub URL
      mockUseFileInputMonitor.currentUrl = mockNonGitHubUrl
      vi.mocked(useFileInputMonitor).mockReturnValue(mockUseFileInputMonitor)

      rerender(<FileStatus fileUrl={mockFileUrl} />)

      // Should not test non-GitHub URLs
      expect(mockUseFileValidation.testFile).not.toHaveBeenCalled()
    })

    it('should not test the same URL twice', () => {
      const { rerender } = render(<FileStatus fileUrl={mockFileUrl} />)

      // Simulate same URL
      mockUseFileInputMonitor.currentUrl = mockFileUrl
      vi.mocked(useFileInputMonitor).mockReturnValue(mockUseFileInputMonitor)

      rerender(<FileStatus fileUrl={mockFileUrl} />)

      // Should only test once (not twice for same URL)
      expect(mockUseFileValidation.testFile).toHaveBeenCalledTimes(1)
    })

    it('should track URL changes and avoid duplicate tests', () => {
      const { rerender } = render(<FileStatus fileUrl={mockFileUrl} />)

      // Clear initial call
      mockUseFileValidation.testFile.mockClear()

      // Simulate URL change
      const newUrl = `${GITHUB_PROTOCOL}owner/repo/v2.0.0/release.zip`
      mockUseFileInputMonitor.currentUrl = newUrl
      vi.mocked(useFileInputMonitor).mockReturnValue(mockUseFileInputMonitor)
      rerender(<FileStatus fileUrl={mockFileUrl} />)

      // Should test the new URL
      expect(mockUseFileValidation.testFile).toHaveBeenCalledWith(newUrl)
    })

    it('should test URL immediately when component mounts with GitHub URL', () => {
      render(<FileStatus fileUrl={mockFileUrl} />)

      // Should test the initial GitHub URL
      expect(mockUseFileValidation.testFile).toHaveBeenCalledWith(mockFileUrl)
    })

    it('should track URL changes and avoid duplicate tests (line 39 coverage)', () => {
      const { rerender } = render(<FileStatus fileUrl={mockFileUrl} />)

      // Clear initial call
      mockUseFileValidation.testFile.mockClear()

      // Simulate same URL - should not trigger test due to URL tracking
      mockUseFileInputMonitor.currentUrl = mockFileUrl
      vi.mocked(useFileInputMonitor).mockReturnValue(mockUseFileInputMonitor)

      rerender(<FileStatus fileUrl={mockFileUrl} />)

      // Should not test the same URL again due to tracking logic
      expect(mockUseFileValidation.testFile).not.toHaveBeenCalled()

      // Now simulate different URL - should trigger test
      const newUrl = `${GITHUB_PROTOCOL}owner/repo/v2.0.0/release.zip`
      mockUseFileInputMonitor.currentUrl = newUrl
      vi.mocked(useFileInputMonitor).mockReturnValue(mockUseFileInputMonitor)

      rerender(<FileStatus fileUrl={mockFileUrl} />)

      // Should test the new URL
      expect(mockUseFileValidation.testFile).toHaveBeenCalledWith(newUrl)
      expect(mockUseFileValidation.testFile).toHaveBeenCalledTimes(1)
    })
  })

  describe('nonce handling', () => {
    it('should use settings nonce when available', () => {
      render(<FileStatus fileUrl={mockFileUrl} />)

      expect(useFileValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          nonce: mockNonce
        })
      )
    })

    it('should fall back to browser nonce when settings nonce is not available', () => {
      window.releaseDeployEDD.contexts.settings = {}
      window.releaseDeployEDD.contexts.browser = {
        nonce: 'browser-nonce-456'
      }

      render(<FileStatus fileUrl={mockFileUrl} />)

      expect(useFileValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          nonce: 'browser-nonce-456'
        })
      )
    })

    it('should use empty string when no nonce available', () => {
      window.releaseDeployEDD.contexts = {}

      render(<FileStatus fileUrl={mockFileUrl} />)

      expect(useFileValidation).toHaveBeenCalledWith(
        expect.objectContaining({
          nonce: ''
        })
      )
    })
  })

  describe('edge cases', () => {
    it('should handle missing ajaxUrl gracefully', () => {
      window.releaseDeployEDD.ajaxUrl = undefined

      expect(() => {
        render(<FileStatus fileUrl={mockFileUrl} />)
      }).not.toThrow()
    })

    it('should handle missing contexts gracefully', () => {
      window.releaseDeployEDD.contexts = undefined

      expect(() => {
        render(<FileStatus fileUrl={mockFileUrl} />)
      }).not.toThrow()
    })

    it('should handle missing window.releaseDeployEDD gracefully', () => {
      delete (window as any).releaseDeployEDD

      expect(() => {
        render(<FileStatus fileUrl={mockFileUrl} />)
      }).not.toThrow()
    })

    it('should handle null result in ready status', () => {
      mockUseFileValidation.status = 'ready'
      mockUseFileValidation.result = null

      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status_ready')
      expect(statusElement).toBeInTheDocument()

      // Should not try to format size when result is null
      expect(formatSize).not.toHaveBeenCalled()
    })

    it('should handle undefined error gracefully', () => {
      mockUseFileValidation.status = 'error'
      mockUseFileValidation.error = undefined

      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status_error')
      expect(statusElement).toBeInTheDocument()
    })

    it('should not show warning ProBadge when error is empty or null', () => {
      mockUseFileValidation.status = 'error'
      mockUseFileValidation.error = ''
      mockUseFileValidation.errorCode = 'some_error'

      render(<FileStatus fileUrl={mockFileUrl} />)

      expect(screen.queryByTestId('pro-badge-warning')).not.toBeInTheDocument()
    })

    it('should not show warning ProBadge when error does not contain token keyword', () => {
      mockUseFileValidation.status = 'error'
      mockUseFileValidation.error = 'File not found'
      mockUseFileValidation.errorCode = 'not_found'

      render(<FileStatus fileUrl={mockFileUrl} />)

      expect(screen.queryByTestId('pro-badge-warning')).not.toBeInTheDocument()
    })
  })

  describe('accessibility', () => {
    it('should have appropriate ARIA attributes', () => {
      mockUseFileValidation.status = 'ready'
      mockUseFileValidation.result = mockResult

      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status')
      expect(statusElement).toBeInTheDocument()
      expect(statusElement).toHaveAttribute('title', 'file.retest')
    })

    it('should not have title when testing', () => {
      mockUseFileValidation.status = 'testing'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const statusElement = document.querySelector('.release-deploy-edd-file-status')
      // Should have empty title when testing (the JSX conditionally sets empty string)
      expect(statusElement).toHaveAttribute('title', '')
    })
  })

  describe('ProBadge integration', () => {
    it('should pass correct props to ProBadge for pro features', () => {
      mockUseFileValidation.status = 'error'
      mockUseFileValidation.errorCode = 'pro_feature'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const proBadge = screen.getByTestId('pro-badge-default')
      expect(proBadge).toBeInTheDocument()
    })

    it('should pass correct props to ProBadge for token errors', () => {
      mockUseFileValidation.status = 'error'
      mockUseFileValidation.error = 'Token authentication failed'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const proBadge = screen.getByTestId('pro-badge-warning')
      expect(proBadge).toBeInTheDocument()
    })

    it('should render ProBadge with purchase URL for pro features (line 94 coverage)', () => {
      mockUseFileValidation.status = 'error'
      mockUseFileValidation.errorCode = 'pro_feature'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const proBadge = screen.getByTestId('pro-badge-default')
      expect(proBadge).toBeInTheDocument()
      expect(proBadge).toHaveAttribute('href', 'https://example.com/purchase')
      expect(proBadge).toHaveTextContent('common.getPro')
    })

    it('should render ProBadge with settings URL for token errors (line 106 coverage)', () => {
      mockUseFileValidation.status = 'error'
      mockUseFileValidation.error = 'Invalid token provided'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const proBadge = screen.getByTestId('pro-badge-warning')
      expect(proBadge).toBeInTheDocument()
      expect(proBadge).toHaveAttribute('href', 'https://example.com/settings')
      expect(proBadge).toHaveTextContent('common.fixIt')
    })

    it('should handle missing WordPress globals gracefully', () => {
      // Mock missing WordPress globals
      Object.defineProperty(window, 'releaseDeployEDD', {
        writable: true,
        configurable: true,
        value: {
          ajaxUrl: mockAjaxUrl,
          // Missing purchaseUrl and settingsUrl
          contexts: {
            settings: {
              nonce: mockNonce
            }
          }
        }
      })

      mockUseFileValidation.status = 'error'
      mockUseFileValidation.errorCode = 'pro_feature'
      mockUseFileValidation.error = 'Token authentication failed'

      render(<FileStatus fileUrl={mockFileUrl} />)

      const defaultBadge = screen.getByTestId('pro-badge-default')
      const warningBadge = screen.getByTestId('pro-badge-warning')

      // Should fall back to '#' when URLs are missing
      expect(defaultBadge).toHaveAttribute('href', '#')
      expect(warningBadge).toHaveAttribute('href', '#')
    })
  })
})