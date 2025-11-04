/**
 * Default English fallback translations for development and testing
 * These are used when translation keys are not found in the backend configuration
 */
export const TRANSLATION_FALLBACKS = {
    // Common strings
    'common.getPro': 'Get Pro',
    'common.fixIt': 'Fix It',
    // Token field strings
    'token.checking': 'Checking connection...',
    'token.connected': 'Connected',
    'token.invalid': 'Invalid GitHub token',
    'token.apiCalls': 'API calls remaining',
    'token.managedViaConstant': 'Managed via PHP constant',
    'token.constantHelp': 'Token is defined via EDD_RELEASE_DEPLOY_TOKEN constant (typically in wp-config.php)',
    'token.enterHelp': 'Enter your GitHub PAT with repo scope. You can also define EDD_RELEASE_DEPLOY_TOKEN constant in wp-config.php',
    'token.hide': 'Hide token',
    'token.show': 'Show token',
    'token.refresh': 'Click to refresh',
    'token.howToCreate': 'How to Create a GitHub Token',
    'token.instruction1': 'Go to GitHub.com → Settings → Developer settings → Personal access tokens → Tokens (classic)',
    'token.instruction2': 'Click "Generate new token (classic)"',
    'token.instruction3': 'Give your token a descriptive name (e.g., "WordPress EDD")',
    'token.instruction4': 'Select the "repo" scope (full control of private repositories)',
    'token.instruction5': 'Click "Generate token" and copy the token immediately',
    'token.instruction6': 'Paste the token in the field above and it will be validated automatically',
    // File status strings
    'file.testing': 'Testing...',
    'file.ready': 'Ready',
    'file.networkError': 'Network error',
    'file.retest': 'Click to re-test',
    'file.retry': 'Click to retry',
    // Sync strings
    'sync.autoVersionSync': 'Auto Version Sync',
    'sync.autoChangelogSync': 'Auto Changelog Sync'
};
