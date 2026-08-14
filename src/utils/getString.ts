import { TRANSLATION_FALLBACKS } from '../constants/TRANSLATION_FALLBACKS'
import type { IStringKeys } from '../interfaces/IStringKeys'

/**
 * Get translated string by key from backend configuration
 * Falls back to English defaults if translation is not found
 *
 * @param key - Translation key from IStringKeys
 * @returns Translated string or English fallback
 */
export const getString = (key: keyof IStringKeys): string => {
  // Access global config passed from PHP backend
  if (window.releaseDeployEDD?.strings?.[key]) {
    return window.releaseDeployEDD.strings[key]
  }

  // Fallback to English defaults for development/testing
  return TRANSLATION_FALLBACKS[key] || key
}
