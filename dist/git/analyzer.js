"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.GitAnalyzer = void 0;
const github = __importStar(require("@actions/github"));
const core = __importStar(require("@actions/core"));
class GitAnalyzer {
    octokit;
    owner;
    repo;
    constructor(token) {
        this.octokit = github.getOctokit(token);
        const context = github.context;
        this.owner = context.repo.owner;
        this.repo = context.repo.repo;
    }
    /**
     * PR 정보 가져오기
     */
    async getPullRequestInfo(prNumber) {
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
    async getChangedFiles(prNumber) {
        const changedFiles = [];
        let page = 1;
        const perPage = 100;
        // eslint-disable-next-line no-constant-condition
        while (true) {
            const { data: files } = await this.octokit.rest.pulls.listFiles({
                owner: this.owner,
                repo: this.repo,
                pull_number: prNumber,
                per_page: perPage,
                page,
            });
            if (files.length === 0)
                break;
            for (const file of files) {
                changedFiles.push({
                    filename: file.filename,
                    status: this.mapFileStatus(file.status),
                    additions: file.additions,
                    deletions: file.deletions,
                    patch: file.patch,
                });
            }
            if (files.length < perPage)
                break;
            page++;
        }
        return changedFiles;
    }
    /**
     * PR의 전체 diff 가져오기
     */
    async getPullRequestDiff(prNumber) {
        const { data: diff } = await this.octokit.rest.pulls.get({
            owner: this.owner,
            repo: this.repo,
            pull_number: prNumber,
            mediaType: {
                format: 'diff',
            },
        });
        return diff;
    }
    /**
     * 특정 파일의 내용 가져오기
     */
    async getFileContent(path, ref) {
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
        }
        catch (error) {
            core.warning(`Failed to get content for ${path}: ${error}`);
            return '';
        }
    }
    /**
     * PR 분석 실행
     */
    async analyzePullRequest(prNumber) {
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
    filterCodeFiles(files) {
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
    mapFileStatus(status) {
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
exports.GitAnalyzer = GitAnalyzer;
//# sourceMappingURL=analyzer.js.map