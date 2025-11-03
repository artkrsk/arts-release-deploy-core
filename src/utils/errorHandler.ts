import type { ErrorContext } from '../types'
import type { ErrorOptions } from '../interfaces'

/**
 * Centralized error handler for consistent error logging and user notification
 * Text-domain agnostic for use in both Lite and Pro versions
 *
 * @param error - The error object or message
 * @param context - The context where the error occurred
 * @param options - Additional options for error handling
 * @returns Formatted error object
 */
export function handleError(
  error: Error | string | unknown,
  context: ErrorContext,
  options: ErrorOptions = {}
) {
  const { notify = false, details = null, critical = false } = options

  // Extract error message
  const errorMessage = getErrorMessage(error)

  // Format console message
  const consoleMessage = `[EDD Release Deploy - ${context}] ${errorMessage}`

  // Log to console if critical (always log critical errors)
  if (critical) {
    console.error(consoleMessage, details || '')
  }

  // Show user notification if requested
  if (notify) {
    console.warn(`[${context}] ${errorMessage}`)
  }

  // Return formatted error for component use
  return {
    message: errorMessage,
    context,
    details
  }
}

/**
 * Helper function to safely extract error message from various error types
 * Pure function - no dependencies on i18n or WordPress
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message
  }

  if (typeof error === 'string') {
    return error
  }

  if (error && typeof error === 'object' && 'message' in error) {
    return String(error.message)
  }

  return 'An unknown error occurred'
}

/**
 * Get context label for error messages
 * Returns English labels - plugins should translate in their own code if needed
 */
export function getContextLabel(context: ErrorContext): string {
  const labels: Record<ErrorContext, string> = {
    'version-sync': 'Version Sync',
    'changelog-sync': 'Changelog Sync',
    webhook: 'Webhook',
    browser: 'File Browser',
    'file-status': 'File Status',
    settings: 'Settings',
    general: 'Release Deploy'
  }

  return labels[context] || 'Error'
}
