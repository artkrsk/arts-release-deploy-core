import type { IRateLimit } from './';
import type { TValidationStatus } from '../types';
import type { GitHubService } from '../services';
/** Configuration for token validation hook */
export interface IUseTokenValidationConfig {
    /** Initial token value */
    initialToken: string;
    /** AJAX URL for API requests */
    ajaxUrl: string;
    /** WordPress nonce for security */
    nonce: string;
    /** Whether token is defined via PHP constant */
    isConstantDefined: boolean;
    /** Optional GitHub service for dependency injection */
    gitHubService?: typeof GitHubService;
}
/** Return type for useTokenValidation hook */
export interface IUseTokenValidationReturn {
    /** Current validation status */
    status: TValidationStatus;
    /** GitHub API rate limit information */
    rateLimit: IRateLimit | null;
    /** Whether rate limit is currently being fetched */
    isLoadingRateLimit: boolean;
    /** Validate a token */
    validateToken: (token: string) => Promise<void>;
    /** Refresh the status and rate limit */
    refreshStatus: (token: string) => Promise<void>;
}
//# sourceMappingURL=IUseTokenValidation.d.ts.map