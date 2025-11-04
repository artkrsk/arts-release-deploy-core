import { useState, useEffect, useRef } from 'react';
import { GITHUB_PROTOCOL, INTERVALS, EDD_SELECTORS } from '../constants';
/**
 * Custom hook for monitoring EDD file input changes
 * Handles event listeners and polling
 * Separates DOM interaction logic from FileStatus component
 *
 * @param config - Configuration object
 * @returns Current URL state
 */
export function useFileInputMonitor({ initialUrl, rootElement, onUrlChange, debounceDelay = INTERVALS.DEBOUNCE, pollInterval = INTERVALS.POLL }) {
    const [currentUrl, setCurrentUrl] = useState(initialUrl);
    const isMountedRef = useRef(true);
    useEffect(() => {
        isMountedRef.current = true;
        // Find the wrapper and input elements relative to where component is mounted
        const statusElement = rootElement || document.querySelector(`[data-file-url="${initialUrl}"]`);
        if (!statusElement)
            return;
        const wrapper = statusElement.closest(EDD_SELECTORS.UPLOAD_WRAPPER);
        if (!wrapper)
            return;
        const fileInput = wrapper.querySelector(EDD_SELECTORS.UPLOAD_FIELD);
        if (!fileInput)
            return;
        let debounceTimer = null;
        let lastValue = fileInput.value;
        /** Handle input value changes */
        const handleInputChange = () => {
            const newValue = fileInput.value;
            // Only process if value actually changed
            if (newValue === lastValue)
                return;
            lastValue = newValue;
            // Clear old timer
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            // Update URL immediately
            setCurrentUrl(newValue);
            if (newValue && newValue.startsWith(GITHUB_PROTOCOL)) {
                // Debounce the callback for GitHub URLs
                debounceTimer = window.setTimeout(() => {
                    if (isMountedRef.current) {
                        onUrlChange(newValue);
                    }
                }, debounceDelay);
            }
            else {
                // Non-GitHub URL - notify immediately
                onUrlChange(newValue);
            }
        };
        // Setup event listeners
        fileInput.addEventListener('input', handleInputChange);
        fileInput.addEventListener('change', handleInputChange);
        // Polling to catch EDD's media library selections
        // EDD changes input values directly without triggering change events
        const poll = window.setInterval(() => {
            const currentValue = fileInput.value;
            if (currentValue !== lastValue) {
                handleInputChange();
            }
        }, pollInterval);
        // Cleanup
        return () => {
            isMountedRef.current = false;
            if (debounceTimer) {
                clearTimeout(debounceTimer);
            }
            clearInterval(poll);
            fileInput.removeEventListener('input', handleInputChange);
            fileInput.removeEventListener('change', handleInputChange);
        };
    }, [rootElement, initialUrl, onUrlChange, debounceDelay, pollInterval]);
    return { currentUrl };
}
