/** Configuration for file input monitor hook */
export interface IUseFileInputMonitorConfig {
    /** Initial file URL */
    initialUrl: string;
    /** Root element to find input relative to */
    rootElement?: HTMLElement;
    /** Callback when URL changes */
    onUrlChange: (url: string) => void;
    /** Debounce delay in milliseconds */
    debounceDelay?: number;
    /** Poll interval in milliseconds */
    pollInterval?: number;
}
/** Return type for useFileInputMonitor hook */
export interface IUseFileInputMonitorReturn {
    /** Current URL from input */
    currentUrl: string;
}
//# sourceMappingURL=IUseFileInputMonitor.d.ts.map