/** Parse GitHub URL to extract components */
export declare function parseGitHubUrl(url: string): {
    owner?: string;
    repo?: string;
    release?: string;
    filename?: string;
} | null;
/** Build GitHub URL from components */
export declare function buildGitHubUrl(repo: string, release: string | 'latest', filename: string): string;
//# sourceMappingURL=github.d.ts.map