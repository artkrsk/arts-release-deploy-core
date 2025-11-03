import { API_ACTIONS } from '../constants'
import { IRateLimit } from '../interfaces'

interface ApiResponse<T = any> {
  success: boolean
  data?: T & { message?: string; code?: string }
}

interface TestFileResponse {
  size: number
  exists: boolean
}

/** Fetcher type for dependency injection */
export type Fetcher = typeof fetch

/**
 * EDD-specific GitHub API service for file testing and token validation
 * Supports dependency injection for testing
 */
class GitHubServiceClass {
  constructor(
    private readonly fetcher: Fetcher = fetch.bind(globalThis),
    private readonly actions = API_ACTIONS
  ) {}

  /** Create FormData for WordPress AJAX request */
  private createFormData(action: string, nonce: string, data?: Record<string, string>): FormData {
    const formData = new FormData()
    formData.append('action', action)
    formData.append('nonce', nonce)

    if (data) {
      Object.entries(data).forEach(([key, value]) => {
        formData.append(key, value)
      })
    }

    return formData
  }

  /** Test if a GitHub file exists and get its info */
  async testFile(
    ajaxUrl: string,
    nonce: string,
    fileUrl: string,
    signal?: AbortSignal
  ): Promise<TestFileResponse> {
    const formData = this.createFormData(this.actions.TEST_FILE, nonce, {
      file_url: fileUrl
    })

    const fetchOptions: RequestInit = {
      method: 'POST',
      body: formData
    }

    if (signal) {
      fetchOptions.signal = signal
    }

    const response = await this.fetcher(ajaxUrl, fetchOptions)
    const data: ApiResponse<TestFileResponse> = await response.json()

    if (!data.success) {
      const error = new Error(data.data?.message || 'Test failed') as Error & { code?: string | undefined }
      if (data.data?.code) {
        error.code = data.data.code
      }
      throw error
    }

    return data.data!
  }

  /** Test GitHub token connection */
  async testConnection(
    ajaxUrl: string,
    nonce: string,
    token: string
  ): Promise<boolean> {
    const formData = this.createFormData(this.actions.TEST_CONNECTION, nonce, {
      token
    })

    const response = await this.fetcher(ajaxUrl, {
      method: 'POST',
      body: formData
    })

    const data: ApiResponse = await response.json()

    return data.success
  }

  /** Get GitHub API rate limit */
  async getRateLimit(
    ajaxUrl: string,
    nonce: string
  ): Promise<IRateLimit | null> {
    const formData = this.createFormData(this.actions.GET_RATE_LIMIT, nonce)

    try {
      const response = await this.fetcher(ajaxUrl, {
        method: 'POST',
        body: formData
      })

      const data: ApiResponse<{ rate_limit: IRateLimit }> = await response.json()

      if (!data.success) {
        return null
      }

      return data.data?.rate_limit || null
    } catch (error) {
      return null
    }
  }
}

/** Default instance for use in production code */
const defaultInstance = new GitHubServiceClass()

/**
 * GitHubService - Static-like API for backward compatibility
 * Usage: GitHubService.testFile(...), GitHubService.testConnection(...), etc.
 */
export const GitHubService = {
  testFile: defaultInstance.testFile.bind(defaultInstance),
  testConnection: defaultInstance.testConnection.bind(defaultInstance),
  getRateLimit: defaultInstance.getRateLimit.bind(defaultInstance)
} as const

/**
 * Factory function for creating custom instances (mainly for testing)
 * @example
 * const service = createGitHubService(mockFetch)
 * await service.testFile(...)
 */
export const createGitHubService = (fetcher?: Fetcher) => new GitHubServiceClass(fetcher)
