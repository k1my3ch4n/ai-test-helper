import { ChangedFile, PullRequestInfo, GitAnalysisResult } from './types';
export declare class GitAnalyzer {
    private octokit;
    private owner;
    private repo;
    constructor(token: string);
    /**
     * PR 정보 가져오기
     */
    getPullRequestInfo(prNumber: number): Promise<PullRequestInfo>;
    /**
     * PR에서 변경된 파일 목록 가져오기
     */
    getChangedFiles(prNumber: number): Promise<ChangedFile[]>;
    /**
     * PR의 전체 diff 가져오기
     */
    getPullRequestDiff(prNumber: number): Promise<string>;
    /**
     * 특정 파일의 내용 가져오기
     */
    getFileContent(path: string, ref: string): Promise<string>;
    /**
     * PR 분석 실행
     */
    analyzePullRequest(prNumber: number): Promise<GitAnalysisResult>;
    /**
     * 코드 파일만 필터링
     */
    filterCodeFiles(files: ChangedFile[]): ChangedFile[];
    /**
     * 파일 상태 매핑
     */
    private mapFileStatus;
}
//# sourceMappingURL=analyzer.d.ts.map