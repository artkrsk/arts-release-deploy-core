import type { IUseFileInputMonitorConfig, IUseFileInputMonitorReturn } from '../interfaces';
/**
 * Custom hook for monitoring EDD file input changes
 * Handles event listeners and polling
 * Separates DOM interaction logic from FileStatus component
 *
 * @param config - Configuration object
 * @returns Current URL state
 */
export declare function useFileInputMonitor({ initialUrl, rootElement, onUrlChange, debounceDelay, pollInterval }: IUseFileInputMonitorConfig): IUseFileInputMonitorReturn;
//# sourceMappingURL=useFileInputMonitor.d.ts.map