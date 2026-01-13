import * as core from '@actions/core';
import * as fs from 'fs';
import * as path from 'path';
import { AIClient, TestSuggestion, GeneratedTest } from '../api/types';
import { ChangedFile } from '../git/types';
import { TestGeneratorConfig, TestGenerationResult, FileTestResult } from './types';

export class TestGenerator {
  private aiClient: AIClient;
  private config: TestGeneratorConfig;

  constructor(aiClient: AIClient, config: TestGeneratorConfig) {
    this.aiClient = aiClient;
    this.config = config;
  }

  /**
   * 변경된 파일들에 대한 테스트 생성
   */
  async generateTests(
    changedFiles: ChangedFile[],
    diff: string,
    getFileContent: (path: string) => Promise<string>
  ): Promise<TestGenerationResult> {
    const result: TestGenerationResult = {
      success: true,
      suggestions: [],
      generatedTests: [],
      errors: [],
    };

    // 1. 변경사항 분석하여 테스트 제안 생성
    core.info('Analyzing changes for test suggestions...');
    try {
      const suggestions = await this.aiClient.analyzeChanges(diff);
      result.suggestions = suggestions;
      core.info(`Generated ${suggestions.length} test suggestions`);
    } catch (error) {
      const errorMsg = `Failed to analyze changes: ${error}`;
      core.error(errorMsg);
      result.errors.push(errorMsg);
      result.success = false;
      return result;
    }

    // 2. 각 파일에 대해 테스트 코드 생성
    const codeFiles = this.filterCodeFiles(changedFiles);
    core.info(`Processing ${codeFiles.length} code files for test generation`);

    for (const file of codeFiles) {
      try {
        const fileResult = await this.generateTestForFile(file, result.suggestions, getFileContent);

        if (fileResult.generatedTest) {
          result.generatedTests.push(fileResult.generatedTest);
        }

        if (fileResult.error) {
          result.errors.push(fileResult.error);
        }
      } catch (error) {
        const errorMsg = `Failed to generate test for ${file.filename}: ${error}`;
        core.warning(errorMsg);
        result.errors.push(errorMsg);
      }
    }

    if (result.generatedTests.length === 0 && codeFiles.length > 0) {
      result.success = false;
    }

    return result;
  }

  /**
   * 단일 파일에 대한 테스트 생성
   */
  private async generateTestForFile(
    file: ChangedFile,
    suggestions: TestSuggestion[],
    getFileContent: (path: string) => Promise<string>
  ): Promise<FileTestResult> {
    core.info(`Generating test for: ${file.filename}`);

    const result: FileTestResult = {
      sourceFile: file.filename,
      testFile: this.getTestFileName(file.filename),
      suggestions: [],
    };

    // 파일 관련 제안만 필터링
    const fileSuggestions = this.filterSuggestionsForFile(suggestions, file.filename);
    result.suggestions = fileSuggestions;

    if (fileSuggestions.length === 0) {
      core.info(`No specific suggestions for ${file.filename}, using general suggestions`);
      result.suggestions = suggestions.slice(0, 5); // 상위 5개 사용
    }

    // 소스 코드 가져오기
    const sourceCode = await getFileContent(file.filename);
    if (!sourceCode) {
      result.error = `Could not read source file: ${file.filename}`;
      return result;
    }

    // 언어 감지
    const language = this.detectLanguage(file.filename);

    // 테스트 코드 생성
    try {
      const generatedTest = await this.aiClient.generateTestCode(
        sourceCode,
        result.suggestions,
        language
      );

      result.generatedTest = {
        ...generatedTest,
        fileName: result.testFile,
      };

      core.info(`Generated test file: ${result.testFile}`);
    } catch (error) {
      result.error = `Failed to generate test code: ${error}`;
    }

    return result;
  }

  /**
   * 생성된 테스트 파일 저장
   */
  async saveGeneratedTests(tests: GeneratedTest[]): Promise<string[]> {
    const savedFiles: string[] = [];

    // 출력 디렉토리 생성
    if (!fs.existsSync(this.config.outputDir)) {
      fs.mkdirSync(this.config.outputDir, { recursive: true });
    }

    for (const test of tests) {
      const filePath = path.join(this.config.outputDir, test.fileName);
      const dirPath = path.dirname(filePath);

      // 디렉토리 생성
      if (!fs.existsSync(dirPath)) {
        fs.mkdirSync(dirPath, { recursive: true });
      }

      // 파일 저장
      fs.writeFileSync(filePath, test.content, 'utf-8');
      savedFiles.push(filePath);
      core.info(`Saved test file: ${filePath}`);
    }

    return savedFiles;
  }

  /**
   * 테스트 파일명 생성
   */
  private getTestFileName(sourceFile: string): string {
    const ext = path.extname(sourceFile);
    const baseName = path.basename(sourceFile, ext);
    const dirName = path.dirname(sourceFile);

    // 테스트 파일 네이밍 컨벤션
    const testSuffix = this.getTestSuffix(ext);
    return path.join(dirName, `${baseName}${testSuffix}${ext}`);
  }

  /**
   * 테스트 파일 접미사 반환
   */
  private getTestSuffix(ext: string): string {
    switch (ext) {
      case '.py':
        return '_test';
      case '.java':
        return 'Test';
      default:
        return '.test';
    }
  }

  /**
   * 파일 확장자로 언어 감지
   */
  private detectLanguage(filename: string): string {
    const ext = path.extname(filename).toLowerCase();
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

    return languageMap[ext] || this.config.language || 'unknown';
  }

  /**
   * 코드 파일만 필터링
   */
  private filterCodeFiles(files: ChangedFile[]): ChangedFile[] {
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
      // 테스트 파일 제외
      if (this.isTestFile(file.filename)) {
        return false;
      }

      const ext = path.extname(file.filename).toLowerCase();
      return codeExtensions.includes(ext) && file.status !== 'removed';
    });
  }

  /**
   * 테스트 파일인지 확인
   */
  private isTestFile(filename: string): boolean {
    const testPatterns = [/\.test\./, /\.spec\./, /_test\./, /Test\./, /__tests__\//, /tests?\//];

    return testPatterns.some((pattern) => pattern.test(filename));
  }

  /**
   * 파일 관련 제안 필터링
   */
  private filterSuggestionsForFile(
    suggestions: TestSuggestion[],
    filename: string
  ): TestSuggestion[] {
    const baseName = path.basename(filename, path.extname(filename)).toLowerCase();

    return suggestions.filter((suggestion) => {
      const desc = suggestion.description.toLowerCase();
      return desc.includes(baseName) || desc.includes(filename.toLowerCase());
    });
  }
}
