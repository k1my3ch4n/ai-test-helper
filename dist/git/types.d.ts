/**
 * 변경된 파일 정보
 */
export interface ChangedFile {
    filename: string;
    status: 'added' | 'modified' | 'removed' | 'renamed';
    additions: number;
    deletions: number;
    patch?: string;
}
/**
 * PR 정보
 */
export interface PullRequestInfo {
    number: number;
    title: string;
    body: string | null;
    baseBranch: string;
    headBranch: string;
}
/**
 * Git 분석 결과
 */
export interface GitAnalysisResult {
    pullRequest?: PullRequestInfo;
    changedFiles: ChangedFile[];
    diff: string;
}
//# sourceMappingURL=types.d.ts.map