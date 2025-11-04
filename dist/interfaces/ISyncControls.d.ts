import { TSyncStatus } from '../types';
/** Sync controls component props */
export interface ISyncControlsProps {
    /** Callback for sync button click */
    onSync: () => void | Promise<void> | Promise<boolean>;
    /** Callback for link toggle button click */
    onToggleLink: () => void | Promise<void>;
    /** Whether auto-sync is linked */
    isLinked: boolean;
    /** Current sync operation status */
    status: TSyncStatus;
    /** Status message to display */
    message: string | null;
    /** Whether to show status info tooltip */
    showInfo: boolean;
    /** Whether buttons should be disabled */
    isDisabled: boolean;
    /** Whether this is a Pro feature (shows Get Pro badge) */
    isProFeature?: boolean;
    /** Tooltip text for sync button */
    syncTooltip: string;
    /** Tooltip text for link button */
    linkTooltip: string;
    /** Feature name for Pro teaser */
    featureName?: string;
    /** Icon class for Pro teaser */
    featureIcon?: string;
}
//# sourceMappingURL=ISyncControls.d.ts.map