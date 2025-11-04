import type { IUseFileValidationConfig, IUseFileValidationReturn } from '../interfaces';
/**
 * Custom hook for GitHub file validation
 * Separates business logic from FileStatus UI component
 *
 * @param config - Configuration object
 * @returns File validation state and functions
 */
export declare function useFileValidation({ fileUrl, ajaxUrl, nonce, enabled, gitHubService }: IUseFileValidationConfig): IUseFileValidationReturn;
//# sourceMappingURL=useFileValidation.d.ts.map