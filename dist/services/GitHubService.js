import { API_ACTIONS } from '../constants';
/**
 * EDD-specific GitHub API service for file testing and token validation
 * Supports dependency injection for testing
 */
class GitHubServiceClass {
    constructor(fetcher = fetch.bind(globalThis), actions = API_ACTIONS) {
        this.fetcher = fetcher;
        this.actions = actions;
    }
    /** Create FormData for WordPress AJAX request */
    createFormData(action, nonce, data) {
        const formData = new FormData();
        formData.append('action', action);
        formData.append('nonce', nonce);
        if (data) {
            Object.entries(data).forEach(([key, value]) => {
                formData.append(key, value);
            });
        }
        return formData;
    }
    /** Test if a GitHub file exists and get its info */
    async testFile(ajaxUrl, nonce, fileUrl, signal) {
        const formData = this.createFormData(this.actions.TEST_FILE, nonce, {
            file_url: fileUrl
        });
        const fetchOptions = {
            method: 'POST',
            body: formData
        };
        if (signal) {
            fetchOptions.signal = signal;
        }
        const response = await this.fetcher(ajaxUrl, fetchOptions);
        const data = await response.json();
        if (!data.success) {
            const error = new Error(data.data?.message || 'Test failed');
            if (data.data?.code) {
                error.code = data.data.code;
            }
            throw error;
        }
        return data.data;
    }
    /** Test GitHub token connection */
    async testConnection(ajaxUrl, nonce, token) {
        const formData = this.createFormData(this.actions.TEST_CONNECTION, nonce, {
            token
        });
        const response = await this.fetcher(ajaxUrl, {
            method: 'POST',
            body: formData
        });
        const data = await response.json();
        return data.success;
    }
    /** Get GitHub API rate limit */
    async getRateLimit(ajaxUrl, nonce) {
        const formData = this.createFormData(this.actions.GET_RATE_LIMIT, nonce);
        try {
            const response = await this.fetcher(ajaxUrl, {
                method: 'POST',
                body: formData
            });
            const data = await response.json();
            if (!data.success) {
                return null;
            }
            return data.data?.rate_limit || null;
        }
        catch (error) {
            return null;
        }
    }
}
/** Default instance for use in production code */
const defaultInstance = new GitHubServiceClass();
/**
 * GitHubService - Static-like API for backward compatibility
 * Usage: GitHubService.testFile(...), GitHubService.testConnection(...), etc.
 */
export const GitHubService = {
    testFile: defaultInstance.testFile.bind(defaultInstance),
    testConnection: defaultInstance.testConnection.bind(defaultInstance),
    getRateLimit: defaultInstance.getRateLimit.bind(defaultInstance)
};
/**
 * Factory function for creating custom instances (mainly for testing)
 * @example
 * const service = createGitHubService(mockFetch)
 * await service.testFile(...)
 */
export const createGitHubService = (fetcher) => new GitHubServiceClass(fetcher);
