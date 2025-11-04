import { describe, it, expect, beforeEach, vi } from 'vitest'
import { renderHook, act, waitFor } from '@testing-library/react'
import { useTokenValidation } from '@/hooks/useTokenValidation'
import type { IUseTokenValidationConfig, IRateLimit } from '@/interfaces'

describe('useTokenValidation', () => {
  const mockAjaxUrl = 'https://example.com/wp-admin/admin-ajax.php'
  const mockNonce = 'test-nonce-123'
  const mockToken = 'github_pat_test123'

  const mockRateLimit: IRateLimit = {
    limit: 5000,
    remaining: 4999,
    reset: 1234567890,
    used: 1
  }

  let mockGitHubService: any

  beforeEach(() => {
    // Create fresh mock for each test
    mockGitHubService = {
      testConnection: vi.fn(),
      getRateLimit: vi.fn(),
      testFile: vi.fn()
    }
  })

  describe('initial state', () => {
    it('should initialize with idle status when no token provided', () => {
      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      expect(result.current.status).toBe('idle')
      expect(result.current.rateLimit).toBeNull()
      expect(result.current.isLoadingRateLimit).toBe(false)
    })

    it('should auto-validate on mount when initial token is provided', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: mockToken,
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      await waitFor(() => {
        expect(mockGitHubService.testConnection).toHaveBeenCalledWith(
          mockAjaxUrl,
          mockNonce,
          mockToken
        )
      })

      await waitFor(() => {
        expect(result.current.status).toBe('valid')
        expect(result.current.rateLimit).toEqual(mockRateLimit)
      })
    })

    it('should auto-validate when constant is defined even without token', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: true,
          gitHubService: mockGitHubService
        })
      )

      await waitFor(() => {
        expect(mockGitHubService.testConnection).toHaveBeenCalledWith(
          mockAjaxUrl,
          mockNonce,
          ''
        )
      })

      await waitFor(() => {
        expect(result.current.status).toBe('valid')
      })
    })
  })

  describe('validateToken', () => {
    it('should validate a valid token and fetch rate limit', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      await act(async () => {
        await result.current.validateToken(mockToken)
      })

      expect(result.current.status).toBe('valid')
      expect(result.current.rateLimit).toEqual(mockRateLimit)
      expect(mockGitHubService.testConnection).toHaveBeenCalledWith(
        mockAjaxUrl,
        mockNonce,
        mockToken
      )
      expect(mockGitHubService.getRateLimit).toHaveBeenCalledWith(
        mockAjaxUrl,
        mockNonce
      )
    })

    it('should handle invalid token', async () => {
      mockGitHubService.testConnection.mockResolvedValue(false)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      await act(async () => {
        await result.current.validateToken(mockToken)
      })

      expect(result.current.status).toBe('invalid')
      expect(result.current.rateLimit).toBeNull()
      expect(mockGitHubService.getRateLimit).not.toHaveBeenCalled()
    })

    it('should handle validation errors', async () => {
      mockGitHubService.testConnection.mockRejectedValue(new Error('Network error'))

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      await act(async () => {
        await result.current.validateToken(mockToken)
      })

      expect(result.current.status).toBe('invalid')
      expect(result.current.rateLimit).toBeNull()
    })

    it('should set status to idle when empty token and no constant', async () => {
      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      await act(async () => {
        await result.current.validateToken('')
      })

      expect(result.current.status).toBe('idle')
      expect(result.current.rateLimit).toBeNull()
      expect(mockGitHubService.testConnection).not.toHaveBeenCalled()
    })

    it('should validate empty token when constant is defined', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: true,
          gitHubService: mockGitHubService
        })
      )

      // Clear initial call
      mockGitHubService.testConnection.mockClear()
      mockGitHubService.getRateLimit.mockClear()

      await act(async () => {
        await result.current.validateToken('')
      })

      expect(result.current.status).toBe('valid')
      expect(mockGitHubService.testConnection).toHaveBeenCalledWith(
        mockAjaxUrl,
        mockNonce,
        ''
      )
    })

    it('should set status to checking during validation', async () => {
      let resolveConnection: (value: boolean) => void
      mockGitHubService.testConnection.mockImplementation(() =>
        new Promise(resolve => {
          resolveConnection = resolve
        })
      )
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Start validation without await
      act(() => {
        result.current.validateToken(mockToken)
      })

      // Check intermediate state
      expect(result.current.status).toBe('checking')

      // Resolve the promise
      await act(async () => {
        resolveConnection!(true)
      })

      // Wait for state to update
      await waitFor(() => {
        expect(result.current.status).toBe('valid')
      })
    })
  })

  describe('refreshStatus', () => {
    it('should refresh validation and rate limit', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: mockToken,
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Wait for initial validation
      await waitFor(() => {
        expect(result.current).toBeDefined()
        expect(result.current.status).toBe('valid')
      })

      // Clear mocks
      mockGitHubService.testConnection.mockClear()
      mockGitHubService.getRateLimit.mockClear()

      // Update rate limit for refresh
      const newRateLimit = { ...mockRateLimit, remaining: 4950 }
      mockGitHubService.getRateLimit.mockResolvedValue(newRateLimit)

      await act(async () => {
        await result.current.refreshStatus(mockToken)
      })

      expect(result.current.rateLimit).toEqual(newRateLimit)
      expect(mockGitHubService.testConnection).toHaveBeenCalled()
      expect(mockGitHubService.getRateLimit).toHaveBeenCalled()
    })

    it('should not refresh when already checking', async () => {
      let resolveConnection: (value: boolean) => void
      mockGitHubService.testConnection.mockImplementation(() =>
        new Promise(resolve => {
          resolveConnection = resolve
        })
      )

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Start validation
      act(() => {
        result.current.validateToken(mockToken)
      })

      // Try to refresh while checking
      await act(async () => {
        await result.current.refreshStatus(mockToken)
      })

      // Should only be called once (from validateToken)
      expect(mockGitHubService.testConnection).toHaveBeenCalledTimes(1)

      // Clean up by resolving
      await act(async () => {
        resolveConnection!(true)
      })
    })

    it('should not refresh when loading rate limit', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: mockToken,
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Wait for initial validation
      await waitFor(() => {
        expect(result.current).toBeDefined()
        expect(result.current.status).toBe('valid')
      })

      // Clear mocks and set slow rate limit
      mockGitHubService.testConnection.mockClear()
      mockGitHubService.getRateLimit.mockClear()

      let resolveRateLimit: (value: any) => void
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockImplementation(() =>
        new Promise(resolve => {
          resolveRateLimit = resolve
        })
      )

      // Start a refresh
      act(() => {
        result.current.refreshStatus(mockToken)
      })

      // Should be loading
      expect(result.current.isLoadingRateLimit).toBe(true)

      // Try another refresh while loading
      await act(async () => {
        await result.current.refreshStatus(mockToken)
      })

      // Should only be called once
      expect(mockGitHubService.testConnection).toHaveBeenCalledTimes(1)

      // Resolve the promise
      await act(async () => {
        resolveRateLimit!(mockRateLimit)
      })
    })

    it('should not refresh without token and not constant defined', async () => {
      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Wait for hook to be ready
      await waitFor(() => {
        expect(result.current).toBeDefined()
      })

      await act(async () => {
        await result.current.refreshStatus('')
      })

      expect(mockGitHubService.testConnection).not.toHaveBeenCalled()
    })

    it('should manage isLoadingRateLimit flag correctly', async () => {
      // Test that isLoadingRateLimit is properly managed
      // We can't easily test the intermediate state due to React batching,
      // but we can verify it starts false and ends false after refresh
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '',
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Initial state should not be loading
      expect(result.current.isLoadingRateLimit).toBe(false)

      // Validate token first
      await act(async () => {
        await result.current.validateToken(mockToken)
      })

      expect(result.current.status).toBe('valid')
      expect(result.current.isLoadingRateLimit).toBe(false)

      // After a refresh, loading should be back to false
      await act(async () => {
        await result.current.refreshStatus(mockToken)
      })

      expect(result.current.isLoadingRateLimit).toBe(false)
      expect(result.current.status).toBe('valid')

      // Verify the service was called correctly
      expect(mockGitHubService.testConnection).toHaveBeenCalledTimes(2)
      expect(mockGitHubService.getRateLimit).toHaveBeenCalledTimes(2)
    })

    it('should handle errors during refresh', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(mockRateLimit)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '', // Start without token to avoid auto-validation
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Manually validate first
      await act(async () => {
        await result.current.validateToken(mockToken)
      })

      expect(result.current.status).toBe('valid')

      // Make refresh fail
      mockGitHubService.testConnection.mockRejectedValue(new Error('Network error'))

      await act(async () => {
        await result.current.refreshStatus(mockToken)
      })

      expect(result.current.status).toBe('invalid')
      expect(result.current.isLoadingRateLimit).toBe(false)
    })
  })

  describe('rate limit handling', () => {
    it('should handle null rate limit response', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      mockGitHubService.getRateLimit.mockResolvedValue(null)

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '', // Start without token to avoid auto-validation issue
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Manually validate
      await act(async () => {
        await result.current.validateToken(mockToken)
      })

      expect(result.current.status).toBe('valid')
      expect(result.current.rateLimit).toBeNull()
    })

    it('should handle rate limit fetch error', async () => {
      mockGitHubService.testConnection.mockResolvedValue(true)
      // Note: In real GitHubService, getRateLimit catches errors and returns null
      // But the hook catches any thrown errors and sets status to invalid
      // So this tests the case where getRateLimit actually throws
      mockGitHubService.getRateLimit.mockRejectedValue(new Error('Rate limit error'))

      const { result } = renderHook(() =>
        useTokenValidation({
          initialToken: '', // Start without token to avoid auto-validation issue
          ajaxUrl: mockAjaxUrl,
          nonce: mockNonce,
          isConstantDefined: false,
          gitHubService: mockGitHubService
        })
      )

      // Manually validate
      await act(async () => {
        await result.current.validateToken(mockToken)
      })

      // When getRateLimit throws, the outer catch sets status to invalid
      expect(result.current.status).toBe('invalid')
      expect(result.current.rateLimit).toBeNull()
    })
  })
})