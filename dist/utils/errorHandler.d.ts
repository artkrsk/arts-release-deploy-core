import type { ErrorContext } from '../types';
import type { ErrorOptions } from '../interfaces';
/**
 * Centralized error handler for consistent error logging and user notification
 * Text-domain agnostic for use in both Lite and Pro versions
 *
 * @param error - The error object or message
 * @param context - The context where the error occurred
 * @param options - Additional options for error handling
 * @returns Formatted error object
 */
export declare function handleError(error: Error | string | unknown, context: ErrorContext, options?: ErrorOptions): {
    message: string;
    context: ErrorContext;
    details: any;
};
/**
 * Helper function to safely extract error message from various error types
 * Pure function - no dependencies on i18n or WordPress
 */
export declare function getErrorMessage(error: unknown): string;
/**
 * Get context label for error messages
 * Returns English labels - plugins should translate in their own code if needed
 */
export declare function getContextLabel(context: ErrorContext): string;
//# sourceMappingURL=errorHandler.d.ts.map