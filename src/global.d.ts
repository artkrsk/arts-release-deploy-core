import type { IConfig } from './interfaces'

/** Global type declarations for WordPress/jQuery environment */
declare global {
  /** jQuery interface for EDD-specific usage */
  interface JQuery<TElement = HTMLElement> {
    [key: string]: any
  }

  /** jQuery global function */
  const jQuery: (selector: string | Element | Document) => JQuery

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
