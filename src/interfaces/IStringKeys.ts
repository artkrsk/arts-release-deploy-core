/**
 * Translation key interface for the Release Deploy translation system
 * Defines all available translation keys used throughout the application
 */
export interface IStringKeys {
  // Common strings
  'common.getPro': string
  'common.fixIt': string

  // Token field strings
  'token.checking': string
  'token.connected': string
  'token.invalid': string
  'token.apiCalls': string
  'token.managedViaConstant': string
  'token.constantHelp': string
  'token.enterHelp': string
  'token.hide': string
  'token.show': string
  'token.refresh': string
  'token.howToCreate': string
  'token.instruction1': string
  'token.instruction2': string
  'token.instruction3': string
  'token.instruction4': string
  'token.instruction5': string
  'token.instruction6': string

  // File status strings
  'file.testing': string
  'file.ready': string
  'file.networkError': string
  'file.retest': string
  'file.retry': string

  // Sync strings
  'sync.autoVersionSync': string
  'sync.autoChangelogSync': string
}
