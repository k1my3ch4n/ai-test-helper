import { TestGenerator } from '../../src/generator/test-generator';
import { AIClient, TestSuggestion, GeneratedTest } from '../../src/api/types';
import { ChangedFile, GitAnalysisResult } from '../../src/git/types';
import { TestGeneratorConfig } from '../../src/generator/types';

describe('Git + Generator 통합 테스트', () => {
  let mockAIClient: AIClient;
  let testGenerator: TestGenerator;

  const mockSuggestions: TestSuggestion[] = [
    { description: 'userService의 로그인 기능 테스트', priority: 'high', type: 'unit' },
    { description: 'userService의 에러 처리 테스트', priority: 'medium', type: 'unit' },
    { description: 'API 엔드포인트 통합 테스트', priority: 'low', type: 'integration' },
  ];

  const mockGeneratedTest: GeneratedTest = {
    fileName: 'userService.test.ts',
    content: `describe('UserService', () => {
  it('로그인이 성공해야 한다', () => {
    expect(true).toBe(true);
  });
});`,
    suggestions: mockSuggestions.slice(0, 2),
  };

  beforeEach(() => {
    mockAIClient = {
      analyzeChanges: jest.fn().mockResolvedValue(mockSuggestions),
      generateTestCode: jest.fn().mockResolvedValue(mockGeneratedTest),
    };

    const config: TestGeneratorConfig = {
      outputDir: './generated-tests',
      testFramework: 'jest',
      language: 'typescript',
    };

    testGenerator = new TestGenerator(mockAIClient, config);
  });

  describe('Git 분석 결과를 Generator에 전달', () => {
    it('변경된 파일 목록을 기반으로 테스트를 생성해야 한다', async () => {
      const changedFiles: ChangedFile[] = [
        { filename: 'src/services/userService.ts', status: 'modified', additions: 50, deletions: 10 },
        { filename: 'src/utils/helper.ts', status: 'added', additions: 30, deletions: 0 },
      ];

      const diff = `
--- a/src/services/userService.ts
+++ b/src/services/userService.ts
@@ -10,6 +10,15 @@ export class UserService {
+  async login(email: string, password: string) {
+    // 로그인 로직
+  }
`;

      const getFileContent = jest.fn().mockResolvedValue('export class UserService {}');

      const result = await testGenerator.generateTests(changedFiles, diff, getFileContent);

      expect(result.success).toBe(true);
      expect(result.suggestions).toEqual(mockSuggestions);
      expect(mockAIClient.analyzeChanges).toHaveBeenCalledWith(diff);
    });

    it('코드 파일만 필터링하여 처리해야 한다', async () => {
      const changedFiles: ChangedFile[] = [
        { filename: 'src/app.ts', status: 'modified', additions: 10, deletions: 5 },
        { filename: 'README.md', status: 'modified', additions: 5, deletions: 2 },
        { filename: 'package.json', status: 'modified', additions: 1, deletions: 1 },
        { filename: 'src/styles.css', status: 'added', additions: 20, deletions: 0 },
      ];

      const getFileContent = jest.fn().mockResolvedValue('code content');

      await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

      // app.ts만 처리되어야 함
      expect(mockAIClient.generateTestCode).toHaveBeenCalledTimes(1);
    });

    it('삭제된 파일은 테스트 생성에서 제외해야 한다', async () => {
      const changedFiles: ChangedFile[] = [
        { filename: 'src/newFile.ts', status: 'added', additions: 100, deletions: 0 },
        { filename: 'src/oldFile.ts', status: 'removed', additions: 0, deletions: 50 },
      ];

      const getFileContent = jest.fn().mockResolvedValue('code content');

      await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

      expect(mockAIClient.generateTestCode).toHaveBeenCalledTimes(1);
      expect(getFileContent).toHaveBeenCalledWith('src/newFile.ts');
      expect(getFileContent).not.toHaveBeenCalledWith('src/oldFile.ts');
    });

    it('테스트 파일은 테스트 생성에서 제외해야 한다', async () => {
      const changedFiles: ChangedFile[] = [
        { filename: 'src/service.ts', status: 'modified', additions: 10, deletions: 5 },
        { filename: 'src/service.test.ts', status: 'modified', additions: 5, deletions: 2 },
        { filename: '__tests__/util.ts', status: 'added', additions: 20, deletions: 0 },
        { filename: 'src/helper.spec.ts', status: 'modified', additions: 3, deletions: 1 },
      ];

      const getFileContent = jest.fn().mockResolvedValue('code content');

      await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

      expect(mockAIClient.generateTestCode).toHaveBeenCalledTimes(1);
    });
  });

  describe('GitAnalysisResult 구조 활용', () => {
    it('PR 정보와 변경된 파일을 함께 처리해야 한다', async () => {
      const analysisResult: GitAnalysisResult = {
        pullRequest: {
          number: 123,
          title: '사용자 로그인 기능 추가',
          body: '로그인 기능을 구현했습니다.',
          baseBranch: 'main',
          headBranch: 'feature/login',
        },
        changedFiles: [
          { filename: 'src/auth/login.ts', status: 'added', additions: 100, deletions: 0 },
        ],
        diff: '+ async function login() {}',
      };

      const getFileContent = jest.fn().mockResolvedValue('code');

      const result = await testGenerator.generateTests(
        analysisResult.changedFiles,
        analysisResult.diff,
        getFileContent
      );

      expect(result.success).toBe(true);
      expect(mockAIClient.analyzeChanges).toHaveBeenCalledWith(analysisResult.diff);
    });

    it('빈 변경 파일 목록에 대해 빈 결과를 반환해야 한다', async () => {
      const analysisResult: GitAnalysisResult = {
        changedFiles: [],
        diff: '',
      };

      const getFileContent = jest.fn();

      const result = await testGenerator.generateTests(
        analysisResult.changedFiles,
        analysisResult.diff,
        getFileContent
      );

      expect(result.generatedTests).toHaveLength(0);
      expect(getFileContent).not.toHaveBeenCalled();
    });
  });

  describe('다양한 프로그래밍 언어 지원', () => {
    const languageTestCases = [
      { filename: 'app.ts', expectedLang: 'typescript' },
      { filename: 'app.js', expectedLang: 'javascript' },
      { filename: 'app.py', expectedLang: 'python' },
      { filename: 'App.java', expectedLang: 'java' },
      { filename: 'main.go', expectedLang: 'go' },
    ];

    languageTestCases.forEach(({ filename, expectedLang }) => {
      it(`${filename} 파일에 대해 ${expectedLang} 언어로 테스트를 생성해야 한다`, async () => {
        const changedFiles: ChangedFile[] = [
          { filename, status: 'modified', additions: 10, deletions: 5 },
        ];

        const getFileContent = jest.fn().mockResolvedValue('code content');

        await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

        expect(mockAIClient.generateTestCode).toHaveBeenCalledWith(
          expect.anything(),
          expect.anything(),
          expectedLang
        );
      });
    });
  });

  describe('에러 처리 통합', () => {
    it('AI 분석 실패 시 에러를 기록해야 한다', async () => {
      mockAIClient.analyzeChanges = jest.fn().mockRejectedValue(new Error('API 오류'));

      const changedFiles: ChangedFile[] = [
        { filename: 'src/app.ts', status: 'modified', additions: 10, deletions: 5 },
      ];

      const result = await testGenerator.generateTests(changedFiles, 'diff', jest.fn());

      expect(result.success).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('API 오류');
    });

    it('파일 내용을 읽지 못할 때 에러를 기록해야 한다', async () => {
      const changedFiles: ChangedFile[] = [
        { filename: 'src/app.ts', status: 'modified', additions: 10, deletions: 5 },
      ];

      const getFileContent = jest.fn().mockResolvedValue('');

      const result = await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

      expect(result.errors.some((e) => e.includes('Could not read source file'))).toBe(true);
    });

    it('테스트 코드 생성 실패 시 다음 파일로 계속 진행해야 한다', async () => {
      mockAIClient.generateTestCode = jest.fn()
        .mockRejectedValueOnce(new Error('생성 실패'))
        .mockResolvedValueOnce(mockGeneratedTest);

      const changedFiles: ChangedFile[] = [
        { filename: 'src/file1.ts', status: 'modified', additions: 10, deletions: 5 },
        { filename: 'src/file2.ts', status: 'modified', additions: 10, deletions: 5 },
      ];

      const getFileContent = jest.fn().mockResolvedValue('code content');

      const result = await testGenerator.generateTests(changedFiles, 'diff', getFileContent);

      expect(mockAIClient.generateTestCode).toHaveBeenCalledTimes(2);
      expect(result.generatedTests).toHaveLength(1);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});
