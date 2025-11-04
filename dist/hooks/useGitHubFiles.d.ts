/**
 * Hook for detecting and monitoring GitHub files in EDD download file fields
 * Extracts common logic from VersionSync and ChangelogSync components
 */
export declare function useGitHubFiles(): {
    hasGitHubFiles: boolean;
    linkedGitHubFileRef: import("react").MutableRefObject<string | null>;
    getFirstGitHubFile: () => string | null;
    checkForGitHubFiles: () => boolean;
    startPolling: (onFileChange?: () => void) => number;
};
//# sourceMappingURL=useGitHubFiles.d.ts.map