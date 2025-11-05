/** Version Sync component props */
export interface IVersionSyncProps {
    /** Download post ID */
    downloadId: number;
    /** Current EDD SL version */
    currentVersion?: string;
    /** GitHub release version */
    githubVersion?: string;
    /** Last sync timestamp */
    lastSync?: number;
    /** WordPress nonce for AJAX */
    nonce: string;
    /** AJAX URL */
    ajaxUrl: string;
    /** Whether this is a Pro feature */
    isProFeature?: boolean;
    /** Initial linked state */
    isLinked?: boolean;
}
//# sourceMappingURL=IVersionSync.d.ts.map