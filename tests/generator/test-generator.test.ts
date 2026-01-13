import * as path from 'path';
import { TestSuggestion, GeneratedTest } from '../../src/api/types';
import { ChangedFile } from '../../src/git/types';
import { TestGeneratorConfig, TestGenerationResult } from '../../src/generator/types';

describe('TestGenerator - 순수 함수', () => {
  const codeExtensions = [
    '.ts', '.tsx', '.js', '.jsx', '.py', '.java', '.go', '.rs',
    '.cpp', '.c', '.cs', '.rb', '.php', '.swift', '.kt',
  ];

  describe('코드 파일 필터링 로직', () => {
    const testPatterns = [
      /\.test\./,
      /\.spec\./,
      /_test\./,
      /Test\./,
      /__tests__\//,
      /tests?\//,
    ];

    function isTestFile(filename: string): boolean {
      return testPatterns.some((pattern) => pattern.test(filename));
    }

    function filterCodeFiles(files: ChangedFile[]): ChangedFile[] {
      return files.filter((file) => {
        if (isTestFile(file.filename)) {
          return false;
        }
        const ext = path.extname(file.filename).toLowerCase();
        return codeExtensions.includes(ext) && file.status !== 'removed';
      });
    }

    it('테스트 파일을 필터링해야 한다', () => {
      const files: ChangedFile[] = [
        { filename: 'src/app.ts', status: 'modified', additions: 5, deletions: 2 },
        { filename: 'src/app.test.ts', status: 'modified', additions: 3, deletions: 1 },
        { filename: '__tests__/utils.ts', status: 'added', additions: 10, deletions: 0 },
        { filename: 'src/utils.spec.ts', status: 'modified', additions: 2, deletions: 1 },
      ];

      const result = filterCodeFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('src/app.ts');
    });

    it('비코드 파일을 필터링해야 한다', () => {
      const files: ChangedFile[] = [
        { filename: 'src/app.ts', status: 'modified', additions: 5, deletions: 2 },
        { filename: 'README.md', status: 'modified', additions: 10, deletions: 5 },
        { filename: 'package.json', status: 'modified', additions: 1, deletions: 1 },
        { filename: 'src/styles.css', status: 'added', additions: 20, deletions: 0 },
      ];

      const result = filterCodeFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('src/app.ts');
    });

    it('삭제된 파일을 필터링해야 한다', () => {
      const files: ChangedFile[] = [
        { filename: 'src/app.ts', status: 'removed', additions: 0, deletions: 50 },
        { filename: 'src/utils.ts', status: 'modified', additions: 5, deletions: 2 },
      ];

      const result = filterCodeFiles(files);

      expect(result).toHaveLength(1);
      expect(result[0].filename).toBe('src/utils.ts');
    });
  });

  describe('테스트 파일명 생성 로직', () => {
    function getTestSuffix(ext: string): string {
      switch (ext) {
        case '.py':
          return '_test';
        case '.java':
          return 'Test';
        default:
          return '.test';
      }
    }

    function getTestFileName(sourceFile: string): string {
      const ext = path.extname(sourceFile);
      const baseName = path.basename(sourceFile, ext);
      const dirName = path.dirname(sourceFile);
      const testSuffix = getTestSuffix(ext);
      return path.join(dirName, `${baseName}${testSuffix}${ext}`);
    }

    it('TypeScript 파일에 .test 접미사를 사용해야 한다', () => {
      const result = getTestFileName('src/app.ts');
      expect(result).toContain('app.test.ts');
    });

    it('JavaScript 파일에 .test 접미사를 사용해야 한다', () => {
      const result = getTestFileName('src/utils.js');
      expect(result).toContain('utils.test.js');
    });

    it('Python 파일에 _test 접미사를 사용해야 한다', () => {
      const result = getTestFileName('src/app.py');
      expect(result).toContain('app_test.py');
    });

    it('Java 파일에 Test 접미사를 사용해야 한다', () => {
      const result = getTestFileName('src/App.java');
      expect(result).toContain('AppTest.java');
    });

    it('디렉토리 구조를 유지해야 한다', () => {
      const result = getTestFileName('src/components/Button.tsx');
      expect(result).toMatch(/src[\\/]components[\\/]Button\.test\.tsx/);
    });
  });

  describe('언어 감지 로직', () => {
    const languageMap: Record<string, string> = {
      '.ts': 'typescript',
      '.tsx': 'typescript',
      '.js': 'javascript',
      '.jsx': 'javascript',
      '.py': 'python',
      '.java': 'java',
      '.go': 'go',
      '.rs': 'rust',
      '.cpp': 'cpp',
      '.c': 'c',
      '.cs': 'csharp',
      '.rb': 'ruby',
      '.php': 'php',
      '.swift': 'swift',
      '.kt': 'kotlin',
    };

    function detectLanguage(filename: string, defaultLang = 'unknown'): string {
      const ext = path.extname(filename).toLowerCase();
      return languageMap[ext] || defaultLang;
    }

    const testCases = [
      { filename: 'app.ts', language: 'typescript' },
      { filename: 'app.tsx', language: 'typescript' },
      { filename: 'app.js', language: 'javascript' },
      { filename: 'app.jsx', language: 'javascript' },
      { filename: 'app.py', language: 'python' },
      { filename: 'App.java', language: 'java' },
      { filename: 'main.go', language: 'go' },
      { filename: 'lib.rs', language: 'rust' },
      { filename: 'app.cpp', language: 'cpp' },
      { filename: 'utils.c', language: 'c' },
      { filename: 'Program.cs', language: 'csharp' },
      { filename: 'script.rb', language: 'ruby' },
      { filename: 'index.php', language: 'php' },
      { filename: 'App.swift', language: 'swift' },
      { filename: 'Main.kt', language: 'kotlin' },
    ];

    testCases.forEach(({ filename, language }) => {
      it(`${filename}에서 ${language}를 감지해야 한다`, () => {
        expect(detectLanguage(filename)).toBe(language);
      });
    });

    it('지원하지 않는 확장자에 대해 unknown을 반환해야 한다', () => {
      expect(detectLanguage('file.xyz')).toBe('unknown');
    });

    it('기본 언어가 제공되면 해당 값을 사용해야 한다', () => {
      expect(detectLanguage('file.xyz', 'typescript')).toBe('typescript');
    });
  });

  describe('파일별 제안 필터링 로직', () => {
    function filterSuggestionsForFile(
      suggestions: TestSuggestion[],
      filename: string
    ): TestSuggestion[] {
      const baseName = path.basename(filename, path.extname(filename)).toLowerCase();

      return suggestions.filter((suggestion) => {
        const desc = suggestion.description.toLowerCase();
        return desc.includes(baseName) || desc.includes(filename.toLowerCase());
      });
    }

    it('파일과 관련된 제안만 필터링해야 한다', () => {
      const suggestions: TestSuggestion[] = [
        { description: 'Test app module', priority: 'high', type: 'unit' },
        { description: 'Test utils helper', priority: 'medium', type: 'unit' },
        { description: 'Test app error handling', priority: 'low', type: 'unit' },
      ];

      const result = filterSuggestionsForFile(suggestions, 'src/app.ts');

      expect(result).toHaveLength(2);
      expect(result[0].description).toBe('Test app module');
      expect(result[1].description).toBe('Test app error handling');
    });

    it('일치하는 제안이 없으면 빈 배열을 반환해야 한다', () => {
      const suggestions: TestSuggestion[] = [
        { description: 'Test user authentication', priority: 'high', type: 'unit' },
        { description: 'Test API endpoints', priority: 'medium', type: 'integration' },
      ];

      const result = filterSuggestionsForFile(suggestions, 'src/something.ts');

      expect(result).toHaveLength(0);
    });
  });

  describe('TestGenerationResult 구조', () => {
    it('올바른 초기 구조를 가져야 한다', () => {
      const result: TestGenerationResult = {
        success: true,
        suggestions: [],
        generatedTests: [],
        errors: [],
      };

      expect(result.success).toBe(true);
      expect(result.suggestions).toEqual([]);
      expect(result.generatedTests).toEqual([]);
      expect(result.errors).toEqual([]);
    });

    it('에러를 올바르게 추적해야 한다', () => {
      const result: TestGenerationResult = {
        success: false,
        suggestions: [],
        generatedTests: [],
        errors: ['Error 1', 'Error 2'],
      };

      expect(result.success).toBe(false);
      expect(result.errors).toHaveLength(2);
    });
  });

  describe('TestGeneratorConfig 구조', () => {
    it('모든 테스트 프레임워크 옵션을 허용해야 한다', () => {
      const frameworks: Array<TestGeneratorConfig['testFramework']> = [
        'jest', 'mocha', 'vitest', 'pytest', 'junit', 'auto',
      ];

      frameworks.forEach((framework) => {
        const config: TestGeneratorConfig = {
          outputDir: './tests',
          testFramework: framework,
          language: 'typescript',
        };
        expect(config.testFramework).toBe(framework);
      });
    });
  });
});
