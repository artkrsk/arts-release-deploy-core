import type { IUseTokenValidationConfig, IUseTokenValidationReturn } from '../interfaces';
/**
 * Custom hook for GitHub token validation and rate limit fetching
 * Separates business logic from TokenField UI component
 *
 * @param config - Configuration object
 * @returns Token validation state and functions
 */
export declare function useTokenValidation({ initialToken, ajaxUrl, nonce, isConstantDefined, gitHubService }: IUseTokenValidationConfig): IUseTokenValidationReturn;
//# sourceMappingURL=useTokenValidation.d.ts.map