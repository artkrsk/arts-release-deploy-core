/**
 * Hook for managing polling intervals with automatic cleanup
 * Ensures intervals are properly cleaned up to prevent memory leaks
 */
export declare function usePolling(callback: () => void, interval: number, enabled?: boolean): {
    stopPolling: () => void;
    trigger: () => void;
};
/**
 * Hook for managing multiple timeouts with automatic cleanup
 * Useful for components that need to manage multiple delayed operations
 */
export declare function useTimeouts(): {
    setTrackedTimeout: (callback: () => void, delay: number) => NodeJS.Timeout;
    clearTrackedTimeout: (timeoutId: NodeJS.Timeout) => void;
    clearAllTimeouts: () => void;
};
//# sourceMappingURL=usePolling.d.ts.map