import type { IConfig } from './interfaces'

/** Global type declarations for WordPress environment */
declare global {
  /** WordPress global object */
  const wp: {
    element: typeof import('@wordpress/element')
    components: typeof import('@wordpress/components')
    i18n: typeof import('@wordpress/i18n')
  }

  /** Window extensions */
  interface Window {
    releaseDeployEDD: IConfig
  }
}

export {}
