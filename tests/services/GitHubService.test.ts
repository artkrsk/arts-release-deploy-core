import { describe, it, expect, vi, beforeEach } from 'vitest'
import { createGitHubService, GitHubService, type Fetcher } from '../../src/services/GitHubService'

describe('GitHubService', () => {
  describe('testFile', () => {
    it('should test file successfully', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: { size: 1024, exists: true }
        })
      })

      const service = createGitHubService(mockFetch)
      const result = await service.testFile('https://example.com/ajax', 'nonce123', 'file.zip')

      expect(result).toEqual({ size: 1024, exists: true })
      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/ajax',
        expect.objectContaining({
          method: 'POST',
          body: expect.any(FormData)
        })
      )
    })

    it('should throw error when test fails', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({
          success: false,
          data: { message: 'File not found', code: 'NOT_FOUND' }
        })
      })

      const service = createGitHubService(mockFetch)

      await expect(
        service.testFile('https://example.com/ajax', 'nonce123', 'file.zip')
      ).rejects.toThrow('File not found')
    })

    it('should include error code in thrown error', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({
          success: false,
          data: { message: 'Rate limited', code: 'RATE_LIMIT' }
        })
      })

      const service = createGitHubService(mockFetch)

      try {
        await service.testFile('https://example.com/ajax', 'nonce123', 'file.zip')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).toBe('Rate limited')
        expect(error.code).toBe('RATE_LIMIT')
      }
    })

    it('should support abort signal', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: { size: 1024, exists: true }
        })
      })

      const service = createGitHubService(mockFetch)
      const controller = new AbortController()

      await service.testFile('https://example.com/ajax', 'nonce123', 'file.zip', controller.signal)

      expect(mockFetch).toHaveBeenCalledWith(
        'https://example.com/ajax',
        expect.objectContaining({
          signal: controller.signal
        })
      )
    })

    it('should send correct FormData fields', async () => {
      let capturedFormData: FormData | null = null
      const mockFetch: Fetcher = vi.fn().mockImplementation(async (_, options: any) => {
        capturedFormData = options.body
        return {
          json: async () => ({ success: true, data: { size: 1024, exists: true } })
        }
      })

      const service = createGitHubService(mockFetch)
      await service.testFile('https://example.com/ajax', 'nonce123', 'edd-release-deploy://owner/repo/v1.0.0/file.zip')

      expect(capturedFormData).toBeInstanceOf(FormData)
      expect(capturedFormData!.get('action')).toBe('edd_release_deploy_test_file')
      expect(capturedFormData!.get('nonce')).toBe('nonce123')
      expect(capturedFormData!.get('file_url')).toBe('edd-release-deploy://owner/repo/v1.0.0/file.zip')
    })

    it('should use default error message when message is not provided', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({
          success: false,
          data: { code: 'UNKNOWN_ERROR' }
        })
      })

      const service = createGitHubService(mockFetch)

      await expect(
        service.testFile('https://example.com/ajax', 'nonce123', 'file.zip')
      ).rejects.toThrow('Test failed')
    })

    it('should throw error without code property when code is not provided', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({
          success: false,
          data: { message: 'Something went wrong' }
        })
      })

      const service = createGitHubService(mockFetch)

      try {
        await service.testFile('https://example.com/ajax', 'nonce123', 'file.zip')
        expect.fail('Should have thrown')
      } catch (error: any) {
        expect(error.message).toBe('Something went wrong')
        expect(error.code).toBeUndefined()
      }
    })
  })

  describe('testConnection', () => {
    it('should return true for successful connection', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({ success: true })
      })

      const service = createGitHubService(mockFetch)
      const result = await service.testConnection('https://example.com/ajax', 'nonce123', 'gh_token123')

      expect(result).toBe(true)
    })

    it('should return false for failed connection', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({ success: false })
      })

      const service = createGitHubService(mockFetch)
      const result = await service.testConnection('https://example.com/ajax', 'nonce123', 'invalid_token')

      expect(result).toBe(false)
    })

    it('should send correct FormData fields', async () => {
      let capturedFormData: FormData | null = null
      const mockFetch: Fetcher = vi.fn().mockImplementation(async (_, options: any) => {
        capturedFormData = options.body
        return {
          json: async () => ({ success: true })
        }
      })

      const service = createGitHubService(mockFetch)
      await service.testConnection('https://example.com/ajax', 'nonce123', 'gh_token123')

      expect(capturedFormData).toBeInstanceOf(FormData)
      expect(capturedFormData!.get('action')).toBe('edd_release_deploy_test_connection')
      expect(capturedFormData!.get('nonce')).toBe('nonce123')
      expect(capturedFormData!.get('token')).toBe('gh_token123')
    })
  })

  describe('getRateLimit', () => {
    it('should return rate limit data', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: {
            rate_limit: {
              limit: 5000,
              used: 150,
              remaining: 4850,
              reset: 1234567890
            }
          }
        })
      })

      const service = createGitHubService(mockFetch)
      const result = await service.getRateLimit('https://example.com/ajax', 'nonce123')

      expect(result).toEqual({
        limit: 5000,
        used: 150,
        remaining: 4850,
        reset: 1234567890
      })
    })

    it('should return null when request fails', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({ success: false })
      })

      const service = createGitHubService(mockFetch)
      const result = await service.getRateLimit('https://example.com/ajax', 'nonce123')

      expect(result).toBeNull()
    })

    it('should return null when fetch throws error', async () => {
      const mockFetch: Fetcher = vi.fn().mockRejectedValue(new Error('Network error'))

      const service = createGitHubService(mockFetch)
      const result = await service.getRateLimit('https://example.com/ajax', 'nonce123')

      expect(result).toBeNull()
    })

    it('should return null when rate_limit is missing in response', async () => {
      const mockFetch: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({
          success: true,
          data: {}
        })
      })

      const service = createGitHubService(mockFetch)
      const result = await service.getRateLimit('https://example.com/ajax', 'nonce123')

      expect(result).toBeNull()
    })

    it('should send correct FormData fields', async () => {
      let capturedFormData: FormData | null = null
      const mockFetch: Fetcher = vi.fn().mockImplementation(async (_, options: any) => {
        capturedFormData = options.body
        return {
          json: async () => ({
            success: true,
            data: {
              rate_limit: { limit: 5000, used: 0, remaining: 5000, reset: 123 }
            }
          })
        }
      })

      const service = createGitHubService(mockFetch)
      await service.getRateLimit('https://example.com/ajax', 'nonce123')

      expect(capturedFormData).toBeInstanceOf(FormData)
      expect(capturedFormData!.get('action')).toBe('edd_release_deploy_get_rate_limit')
      expect(capturedFormData!.get('nonce')).toBe('nonce123')
    })
  })

  describe('Static API (GitHubService)', () => {
    it('should provide static-like API for backward compatibility', async () => {
      // This tests that the default export works as expected
      expect(typeof GitHubService.testFile).toBe('function')
      expect(typeof GitHubService.testConnection).toBe('function')
      expect(typeof GitHubService.getRateLimit).toBe('function')
    })

    // Note: We can't easily test the static API with mocked fetch without affecting global fetch
    // The factory pattern (createGitHubService) is preferred for testing
  })

  describe('Factory function', () => {
    it('should create independent service instances', async () => {
      const mockFetch1: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({ success: true, data: { size: 100, exists: true } })
      })

      const mockFetch2: Fetcher = vi.fn().mockResolvedValue({
        json: async () => ({ success: true, data: { size: 200, exists: true } })
      })

      const service1 = createGitHubService(mockFetch1)
      const service2 = createGitHubService(mockFetch2)

      const result1 = await service1.testFile('url', 'nonce', 'file1.zip')
      const result2 = await service2.testFile('url', 'nonce', 'file2.zip')

      expect(result1.size).toBe(100)
      expect(result2.size).toBe(200)
      expect(mockFetch1).toHaveBeenCalledTimes(1)
      expect(mockFetch2).toHaveBeenCalledTimes(1)
    })

    it('should use default fetch when no fetcher provided', () => {
      const service = createGitHubService()
      expect(service).toBeDefined()
      // We can't easily test that it uses the global fetch without actually making network requests
      // But we can verify the service is created successfully
    })
  })
})
