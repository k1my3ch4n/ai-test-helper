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
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const api_1 = require("./api");
const git_1 = require("./git");
const generator_1 = require("./generator");
async function run() {
    try {
        core.info('AI Test Helper started');
        // 1. 입력값 가져오기
        const aiProvider = core.getInput('ai_provider', { required: true });
        const aiApiKey = core.getInput('ai_api_key', { required: true });
        const githubToken = core.getInput('github_token', { required: true });
        const aiModel = core.getInput('ai_model') || undefined;
        const outputDir = core.getInput('output_dir') || './generated-tests';
        const testFramework = core.getInput('test_framework') || 'auto';
        // 2. PR 번호 확인
        const context = github.context;
        const prNumber = context.payload.pull_request?.number;
        if (!prNumber) {
            core.setFailed('This action must be run on a pull request event');
            return;
        }
        core.info(`Processing PR #${prNumber}`);
        // 3. AI 클라이언트 생성
        const provider = (0, api_1.parseProvider)(aiProvider);
        const aiClient = (0, api_1.createAIClient)({
            provider,
            apiKey: aiApiKey,
            model: aiModel,
        });
        core.info(`Using AI provider: ${provider}`);
        // 4. Git 분석기 생성 및 PR 분석
        const gitAnalyzer = new git_1.GitAnalyzer(githubToken);
        const analysisResult = await gitAnalyzer.analyzePullRequest(prNumber);
        core.info(`Found ${analysisResult.changedFiles.length} changed files`);
        // 5. 코드 파일만 필터링
        const codeFiles = gitAnalyzer.filterCodeFiles(analysisResult.changedFiles);
        if (codeFiles.length === 0) {
            core.info('No code files to analyze');
            core.setOutput('suggestions', JSON.stringify([]));
            core.setOutput('generated_tests', JSON.stringify([]));
            return;
        }
        core.info(`Processing ${codeFiles.length} code files`);
        // 6. 테스트 생성기 생성
        const testGenerator = new generator_1.TestGenerator(aiClient, {
            outputDir,
            testFramework: testFramework,
            language: 'auto',
        });
        // 7. 파일 내용 가져오는 함수
        const getFileContent = async (filePath) => {
            return gitAnalyzer.getFileContent(filePath, analysisResult.pullRequest?.headBranch || 'HEAD');
        };
        // 8. 테스트 생성
        const testResult = await testGenerator.generateTests(codeFiles, analysisResult.diff, getFileContent);
        // 9. 결과 출력
        core.info(`Generated ${testResult.suggestions.length} test suggestions`);
        core.info(`Generated ${testResult.generatedTests.length} test files`);
        // 10. 생성된 테스트 파일 저장
        if (testResult.generatedTests.length > 0) {
            const savedFiles = await testGenerator.saveGeneratedTests(testResult.generatedTests);
            core.info(`Saved ${savedFiles.length} test files to ${outputDir}`);
        }
        // 11. 출력 설정
        core.setOutput('suggestions', JSON.stringify(testResult.suggestions));
        core.setOutput('generated_tests', JSON.stringify(testResult.generatedTests.map((t) => t.fileName)));
        core.setOutput('success', testResult.success.toString());
        if (testResult.errors.length > 0) {
            core.warning(`Errors occurred: ${testResult.errors.join(', ')}`);
        }
        // 12. PR에 코멘트 작성 (선택적)
        const addComment = core.getInput('add_comment') === 'true';
        if (addComment && testResult.suggestions.length > 0) {
            await addPRComment(githubToken, prNumber, testResult.suggestions);
        }
        core.info('AI Test Helper completed successfully');
    }
    catch (error) {
        if (error instanceof Error) {
            core.setFailed(error.message);
        }
        else {
            core.setFailed('An unexpected error occurred');
        }
    }
}
/**
 * PR에 테스트 제안 코멘트 작성
 */
async function addPRComment(token, prNumber, suggestions) {
    const octokit = github.getOctokit(token);
    const context = github.context;
    const suggestionList = suggestions
        .map((s) => {
        let item = `### **[${s.priority.toUpperCase()}]** (${s.type}) ${s.description}`;
        if (s.codeExample) {
            item += `\n\n<details>\n<summary>테스트 코드 예시</summary>\n\n\`\`\`typescript\n${s.codeExample}\n\`\`\`\n\n</details>`;
        }
        return item;
    })
        .join('\n\n');
    const body = `## AI Test Helper - 테스트 제안

이 PR에 대해 다음 테스트들이 제안되었습니다:

${suggestionList}

---
*Generated by AI Test Helper*`;
    await octokit.rest.issues.createComment({
        owner: context.repo.owner,
        repo: context.repo.repo,
        issue_number: prNumber,
        body,
    });
    core.info('Added test suggestions comment to PR');
}
run();
//# sourceMappingURL=index.js.map