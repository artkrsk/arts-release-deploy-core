import { IRateLimit } from '../interfaces';
interface TestFileResponse {
    size: number;
    exists: boolean;
}
/** Fetcher type for dependency injection */
export type Fetcher = typeof fetch;
/**
 * EDD-specific GitHub API service for file testing and token validation
 * Supports dependency injection for testing
 */
declare class GitHubServiceClass {
    private readonly fetcher;
    private readonly actions;
    constructor(fetcher?: Fetcher, actions?: {
        readonly GET_REPOS: "edd_release_deploy_get_repos";
        readonly GET_RELEASES: "edd_release_deploy_get_releases";
        readonly TEST_FILE: "edd_release_deploy_test_file";
        readonly TEST_CONNECTION: "edd_release_deploy_test_connection";
        readonly CLEAR_CACHE: "edd_release_deploy_clear_cache";
        readonly GET_RATE_LIMIT: "edd_release_deploy_get_rate_limit";
    });
    /** Create FormData for WordPress AJAX request */
    private createFormData;
    /** Test if a GitHub file exists and get its info */
    testFile(ajaxUrl: string, nonce: string, fileUrl: string, signal?: AbortSignal): Promise<TestFileResponse>;
    /** Test GitHub token connection */
    testConnection(ajaxUrl: string, nonce: string, token: string): Promise<boolean>;
    /** Get GitHub API rate limit */
    getRateLimit(ajaxUrl: string, nonce: string): Promise<IRateLimit | null>;
}
/**
 * GitHubService - Static-like API for backward compatibility
 * Usage: GitHubService.testFile(...), GitHubService.testConnection(...), etc.
 */
export declare const GitHubService: {
    readonly testFile: (ajaxUrl: string, nonce: string, fileUrl: string, signal?: AbortSignal) => Promise<TestFileResponse>;
    readonly testConnection: (ajaxUrl: string, nonce: string, token: string) => Promise<boolean>;
    readonly getRateLimit: (ajaxUrl: string, nonce: string) => Promise<IRateLimit | null>;
};
/**
 * Factory function for creating custom instances (mainly for testing)
 * @example
 * const service = createGitHubService(mockFetch)
 * await service.testFile(...)
 */
export declare const createGitHubService: (fetcher?: Fetcher) => GitHubServiceClass;
export {};
//# sourceMappingURL=GitHubService.d.ts.map