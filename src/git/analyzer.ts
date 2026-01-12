import * as github from '@actions/github';
import * as core from '@actions/core';
import { ChangedFile, PullRequestInfo, GitAnalysisResult } from './types';

type OctokitClient = ReturnType<typeof github.getOctokit>;

export class GitAnalyzer {
  private octokit: OctokitClient;
  private owner: string;
  private repo: string;

  constructor(token: string) {
    this.octokit = github.getOctokit(token);
    const context = github.context;
    this.owner = context.repo.owner;
    this.repo = context.repo.repo;
  }

  /**
   * PR 정보 가져오기
   */
  async getPullRequestInfo(prNumber: number): Promise<PullRequestInfo> {
    const { data: pr } = await this.octokit.rest.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
    });

    return {
      number: pr.number,
      title: pr.title,
      body: pr.body,
      baseBranch: pr.base.ref,
      headBranch: pr.head.ref,
    };
  }

  /**
   * PR에서 변경된 파일 목록 가져오기
   */
  async getChangedFiles(prNumber: number): Promise<ChangedFile[]> {
    const changedFiles: ChangedFile[] = [];
    let page = 1;
    const perPage = 100;

    while (true) {
      const { data: files } = await this.octokit.rest.pulls.listFiles({
        owner: this.owner,
        repo: this.repo,
        pull_number: prNumber,
        per_page: perPage,
        page,
      });

      if (files.length === 0) break;

      for (const file of files) {
        changedFiles.push({
          filename: file.filename,
          status: this.mapFileStatus(file.status),
          additions: file.additions,
          deletions: file.deletions,
          patch: file.patch,
        });
      }

      if (files.length < perPage) break;
      page++;
    }

    return changedFiles;
  }

  /**
   * PR의 전체 diff 가져오기
   */
  async getPullRequestDiff(prNumber: number): Promise<string> {
    const { data: diff } = await this.octokit.rest.pulls.get({
      owner: this.owner,
      repo: this.repo,
      pull_number: prNumber,
      mediaType: {
        format: 'diff',
      },
    });

    return diff as unknown as string;
  }

  /**
   * 특정 파일의 내용 가져오기
   */
  async getFileContent(path: string, ref: string): Promise<string> {
    try {
      const { data } = await this.octokit.rest.repos.getContent({
        owner: this.owner,
        repo: this.repo,
        path,
        ref,
      });

      if ('content' in data && data.content) {
        return Buffer.from(data.content, 'base64').toString('utf-8');
      }

      throw new Error(`Unable to get content for file: ${path}`);
    } catch (error) {
      core.warning(`Failed to get content for ${path}: ${error}`);
      return '';
    }
  }

  /**
   * PR 분석 실행
   */
  async analyzePullRequest(prNumber: number): Promise<GitAnalysisResult> {
    core.info(`Analyzing PR #${prNumber}`);

    const [pullRequest, changedFiles, diff] = await Promise.all([
      this.getPullRequestInfo(prNumber),
      this.getChangedFiles(prNumber),
      this.getPullRequestDiff(prNumber),
    ]);

    core.info(`Found ${changedFiles.length} changed files`);

    return {
      pullRequest,
      changedFiles,
      diff,
    };
  }

  /**
   * 코드 파일만 필터링
   */
  filterCodeFiles(files: ChangedFile[]): ChangedFile[] {
    const codeExtensions = [
      '.ts',
      '.tsx',
      '.js',
      '.jsx',
      '.py',
      '.java',
      '.go',
      '.rs',
      '.cpp',
      '.c',
      '.cs',
      '.rb',
      '.php',
      '.swift',
      '.kt',
    ];

    return files.filter((file) => {
      const ext = file.filename.substring(file.filename.lastIndexOf('.'));
      return codeExtensions.includes(ext) && file.status !== 'removed';
    });
  }

  /**
   * 파일 상태 매핑
   */
  private mapFileStatus(status: string): ChangedFile['status'] {
    switch (status) {
      case 'added':
        return 'added';
      case 'modified':
      case 'changed':
        return 'modified';
      case 'removed':
        return 'removed';
      case 'renamed':
        return 'renamed';
      default:
        return 'modified';
    }
  }
}
