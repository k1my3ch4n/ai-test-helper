import { createAIClient, parseProvider } from '../../src/api';
import { TestGenerator } from '../../src/generator/test-generator';
import { AIClient, TestSuggestion, GeneratedTest } from '../../src/api/types';
import { ChangedFile, PullRequestInfo, GitAnalysisResult } from '../../src/git/types';
import { TestGeneratorConfig, TestGenerationResult } from '../../src/generator/types';

describe('전체 워크플로우 통합 테스트', () => {
  describe('GitHub Action 워크플로우 시뮬레이션', () => {
    let mockAIClient: AIClient;

    const mockPRInfo: PullRequestInfo = {
      number: 42,
      title: '새로운 인증 시스템 구현',
      body: '## 변경 사항\n- JWT 기반 인증 추가\n- 로그인/로그아웃 API 구현',
      baseBranch: 'main',
      headBranch: 'feature/auth',
    };

    const mockChangedFiles: ChangedFile[] = [
      { filename: 'src/auth/jwt.ts', status: 'added', additions: 80, deletions: 0 },
      { filename: 'src/auth/login.ts', status: 'added', additions: 120, deletions: 0 },
      { filename: 'src/auth/logout.ts', status: 'added', additions: 40, deletions: 0 },
      { filename: 'src/middleware/authMiddleware.ts', status: 'added', additions: 60, deletions: 0 },
      { filename: 'README.md', status: 'modified', additions: 20, deletions: 5 },
    ];

    const mockDiff = `
diff --git a/src/auth/jwt.ts b/src/auth/jwt.ts
new file mode 100644
+export function generateToken(payload: object): string {
+  // JWT 토큰 생성 로직
+}
+
+export function verifyToken(token: string): object {
+  // JWT 토큰 검증 로직
+}
`;

    const mockSuggestions: TestSuggestion[] = [
      { description: 'jwt 토큰 생성 기능 테스트', priority: 'high', type: 'unit', codeExample: 'it("유효한 토큰을 생성해야 한다", () => {\n  const token = generateToken({ userId: 1 });\n  expect(token).toBeDefined();\n});' },
      { description: 'jwt 토큰 검증 기능 테스트', priority: 'high', type: 'unit', codeExample: 'it("유효한 토큰을 검증해야 한다", () => {\n  const payload = verifyToken(token);\n  expect(payload.userId).toBe(1);\n});' },
      { description: '로그인 API 엔드포인트 테스트', priority: 'high', type: 'integration', codeExample: 'it("로그인 성공 시 토큰을 반환해야 한다", async () => {\n  const res = await request(app).post("/login");\n  expect(res.body.token).toBeDefined();\n});' },
      { description: '인증 미들웨어 테스트', priority: 'medium', type: 'unit', codeExample: 'it("유효한 토큰으로 요청 시 next()를 호출해야 한다", () => {\n  authMiddleware(req, res, next);\n  expect(next).toHaveBeenCalled();\n});' },
    ];

    beforeEach(() => {
      mockAIClient = {
        analyzeChanges: jest.fn().mockResolvedValue(mockSuggestions),
        generateTestCode: jest.fn().mockImplementation((code, suggestions, lang) => {
          return Promise.resolve({
            fileName: 'test.ts',
            content: `describe('테스트', () => { it('동작해야 한다', () => {}); });`,
            suggestions: suggestions.slice(0, 2),
          });
        }),
      };
    });

    it('전체 워크플로우를 성공적으로 실행해야 한다', async () => {
      // 1. 입력값 시뮬레이션
      const inputs = {
        ai_provider: 'claude',
        ai_api_key: 'test-api-key',
        github_token: 'test-github-token',
        output_dir: './generated-tests',
        test_framework: 'jest',
      };

      // 2. AI 클라이언트 생성
      const provider = parseProvider(inputs.ai_provider);
      expect(provider).toBe('claude');

      // 3. Git 분석 결과 시뮬레이션
      const analysisResult: GitAnalysisResult = {
        pullRequest: mockPRInfo,
        changedFiles: mockChangedFiles,
        diff: mockDiff,
      };

      // 4. 코드 파일 필터링 (README.md 제외)
      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go'];
      const codeFiles = analysisResult.changedFiles.filter((file) => {
        const ext = file.filename.substring(file.filename.lastIndexOf('.'));
        return codeExtensions.includes(ext) && file.status !== 'removed';
      });

      expect(codeFiles).toHaveLength(4); // README.md 제외

      // 5. TestGenerator 생성 및 테스트 생성
      const config: TestGeneratorConfig = {
        outputDir: inputs.output_dir,
        testFramework: inputs.test_framework as any,
        language: 'typescript',
      };

      const testGenerator = new TestGenerator(mockAIClient, config);
      const getFileContent = jest.fn().mockResolvedValue('export function test() {}');

      const result = await testGenerator.generateTests(codeFiles, analysisResult.diff, getFileContent);

      // 6. 결과 확인
      expect(result.success).toBe(true);
      expect(result.suggestions).toEqual(mockSuggestions);
      expect(result.generatedTests.length).toBeGreaterThan(0);
      expect(mockAIClient.analyzeChanges).toHaveBeenCalledWith(mockDiff);
    });

    it('코드 파일이 없을 때 빈 결과를 반환해야 한다', async () => {
      const analysisResult: GitAnalysisResult = {
        pullRequest: mockPRInfo,
        changedFiles: [
          { filename: 'README.md', status: 'modified', additions: 10, deletions: 5 },
          { filename: 'package.json', status: 'modified', additions: 2, deletions: 1 },
        ],
        diff: 'diff content',
      };

      const codeExtensions = ['.ts', '.tsx', '.js', '.jsx'];
      const codeFiles = analysisResult.changedFiles.filter((file) => {
        const ext = file.filename.substring(file.filename.lastIndexOf('.'));
        return codeExtensions.includes(ext) && file.status !== 'removed';
      });

      expect(codeFiles).toHaveLength(0);
    });

    it('여러 프로바이더를 순차적으로 테스트할 수 있어야 한다', () => {
      const providers = ['claude', 'gemini'];

      providers.forEach((providerInput) => {
        const provider = parseProvider(providerInput);
        const client = createAIClient({
          provider,
          apiKey: 'test-key',
        });

        expect(client).toBeDefined();
        expect(typeof client.analyzeChanges).toBe('function');
        expect(typeof client.generateTestCode).toBe('function');
      });
    });
  });

  describe('다양한 PR 시나리오', () => {
    let mockAIClient: AIClient;

    beforeEach(() => {
      mockAIClient = {
        analyzeChanges: jest.fn().mockResolvedValue([]),
        generateTestCode: jest.fn().mockResolvedValue({
          fileName: 'test.ts',
          content: 'test code',
          suggestions: [],
        }),
      };
    });

    it('새 파일만 있는 PR을 처리해야 한다', async () => {
      const changedFiles: ChangedFile[] = [
        { filename: 'src/new-feature.ts', status: 'added', additions: 100, deletions: 0 },
        { filename: 'src/new-utils.ts', status: 'added', additions: 50, deletions: 0 },
      ];

      const config: TestGeneratorConfig = {
        outputDir: './tests',
        testFramework: 'jest',
        language: 'typescript',
      };

      const testGenerator = new TestGenerator(mockAIClient, config);
      const getFileContent = jest.fn().mockResolvedValue('code');

      const result = await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

      expect(mockAIClient.generateTestCode).toHaveBeenCalledTimes(2);
    });

    it('수정된 파일만 있는 PR을 처리해야 한다', async () => {
      const changedFiles: ChangedFile[] = [
        { filename: 'src/existing.ts', status: 'modified', additions: 20, deletions: 10 },
      ];

      const config: TestGeneratorConfig = {
        outputDir: './tests',
        testFramework: 'jest',
        language: 'typescript',
      };

      const testGenerator = new TestGenerator(mockAIClient, config);
      const getFileContent = jest.fn().mockResolvedValue('modified code');

      await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

      expect(mockAIClient.generateTestCode).toHaveBeenCalledTimes(1);
    });

    it('혼합된 파일 상태의 PR을 처리해야 한다', async () => {
      const changedFiles: ChangedFile[] = [
        { filename: 'src/new.ts', status: 'added', additions: 50, deletions: 0 },
        { filename: 'src/modified.ts', status: 'modified', additions: 10, deletions: 5 },
        { filename: 'src/deleted.ts', status: 'removed', additions: 0, deletions: 100 },
        { filename: 'src/renamed.ts', status: 'renamed', additions: 5, deletions: 5 },
      ];

      const config: TestGeneratorConfig = {
        outputDir: './tests',
        testFramework: 'jest',
        language: 'typescript',
      };

      const testGenerator = new TestGenerator(mockAIClient, config);
      const getFileContent = jest.fn().mockResolvedValue('code');

      await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

      // deleted 파일은 제외되어야 함
      expect(mockAIClient.generateTestCode).toHaveBeenCalledTimes(3);
    });
  });

  describe('출력 결과 형식', () => {
    it('GitHub Action 출력 형식으로 결과를 생성해야 한다', async () => {
      const mockSuggestions: TestSuggestion[] = [
        { description: '기능 테스트', priority: 'high', type: 'unit', codeExample: 'it("기능이 동작해야 한다", () => { expect(true).toBe(true); });' },
      ];

      const mockGeneratedTests: GeneratedTest[] = [
        { fileName: 'feature.test.ts', content: 'test code', suggestions: mockSuggestions },
      ];

      const result: TestGenerationResult = {
        success: true,
        suggestions: mockSuggestions,
        generatedTests: mockGeneratedTests,
        errors: [],
      };

      // GitHub Action 출력 시뮬레이션
      const outputs = {
        suggestions: JSON.stringify(result.suggestions),
        generated_tests: JSON.stringify(result.generatedTests.map((t) => t.fileName)),
        success: result.success.toString(),
      };

      expect(JSON.parse(outputs.suggestions)).toEqual(mockSuggestions);
      expect(JSON.parse(outputs.generated_tests)).toEqual(['feature.test.ts']);
      expect(outputs.success).toBe('true');
    });

    it('에러가 있을 때도 결과를 생성해야 한다', () => {
      const result: TestGenerationResult = {
        success: false,
        suggestions: [],
        generatedTests: [],
        errors: ['API 오류', '파일 읽기 실패'],
      };

      const outputs = {
        suggestions: JSON.stringify(result.suggestions),
        generated_tests: JSON.stringify(result.generatedTests.map((t) => t.fileName)),
        success: result.success.toString(),
        errors: result.errors.join(', '),
      };

      expect(outputs.success).toBe('false');
      expect(outputs.errors).toContain('API 오류');
    });
  });

  describe('PR 코멘트 형식', () => {
    it('테스트 제안을 마크다운 형식으로 생성해야 한다', () => {
      const suggestions: TestSuggestion[] = [
        { description: 'JWT 토큰 생성 테스트', priority: 'high', type: 'unit', codeExample: 'it("토큰 생성", () => {});' },
        { description: '로그인 API 테스트', priority: 'medium', type: 'integration', codeExample: 'it("로그인", () => {});' },
        { description: '에러 처리 테스트', priority: 'low', type: 'unit', codeExample: 'it("에러", () => {});' },
      ];

      const suggestionList = suggestions
        .map((s) => `- **[${s.priority.toUpperCase()}]** (${s.type}) ${s.description}`)
        .join('\n');

      const commentBody = `## AI Test Helper - Test Suggestions

The following tests are suggested for this PR:

${suggestionList}

---
*Generated by AI Test Helper*`;

      expect(commentBody).toContain('**[HIGH]**');
      expect(commentBody).toContain('**[MEDIUM]**');
      expect(commentBody).toContain('**[LOW]**');
      expect(commentBody).toContain('(unit)');
      expect(commentBody).toContain('(integration)');
    });
  });
});
