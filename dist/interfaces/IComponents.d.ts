import { IAsset, IRelease } from './IGitHub';
/** Props for FileStatus component */
export interface IFileStatusProps {
    fileUrl: string;
    rootElement?: HTMLElement;
}
/** Props for TokenField component */
export interface ITokenFieldProps {
    initialValue: string;
    onChange: (value: string) => void;
}
/** Props for AssetList component */
export interface IAssetListProps {
    assets: IAsset[];
    repository: string;
    releaseTag: string;
    isLatest: boolean;
    selectedAsset: IAsset | null;
    onSelectAsset: (asset: IAsset | null) => void;
}
/** Props for ReleaseList component */
export interface IReleaseListProps {
    releases: IRelease[];
    selectedRelease: string | null;
    onSelectRelease: (release: IRelease | 'latest') => void;
}
//# sourceMappingURL=IComponents.d.ts.map