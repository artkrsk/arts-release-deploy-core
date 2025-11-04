import type { IConfig } from './interfaces'

/** Global type declarations for WordPress/jQuery environment */
declare global {
  /** jQuery interface for EDD-specific usage */
  interface JQuery<TElement = HTMLElement> {
    [key: string]: any
  }

  /** jQuery global function */
  const jQuery: (selector: string | Element | Document) => JQuery

  /** Window extensions */
  interface Window {
    releaseDeployEDD: IConfig
  }
}

export {}
