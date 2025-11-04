import type { IStringKeys } from '../interfaces/IStringKeys';
/**
 * Get translated string by key from backend configuration
 * Falls back to English defaults if translation is not found
 *
 * @param key - Translation key from IStringKeys
 * @returns Translated string or English fallback
 */
export declare const getString: (key: keyof IStringKeys) => string;
//# sourceMappingURL=getString.d.ts.map