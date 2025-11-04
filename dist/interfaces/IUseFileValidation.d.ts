import type { TStatusState } from '../types';
import type { GitHubService } from '../services';
/** Configuration for file validation hook */
export interface IUseFileValidationConfig {
    /** File URL to validate */
    fileUrl: string;
    /** AJAX URL for API requests */
    ajaxUrl: string;
    /** WordPress nonce for security */
    nonce: string;
    /** Whether validation is enabled */
    enabled?: boolean;
    /** Optional GitHub service for dependency injection */
    gitHubService?: typeof GitHubService;
}
/** Return type for useFileValidation hook */
export interface IUseFileValidationReturn {
    /** Current validation status */
    status: TStatusState;
    /** Validation result (size and exists flag) */
    result: {
        size: number;
        exists: boolean;
    } | null;
    /** Error message if validation failed */
    error: string | null;
    /** Error code from API */
    errorCode: string | null;
    /** Manually test a file */
    testFile: (urlToTest?: string) => Promise<void>;
}
//# sourceMappingURL=IUseFileValidation.d.ts.map