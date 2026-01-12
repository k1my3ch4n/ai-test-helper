import { TestSuggestion, GeneratedTest } from '../api/types';

/**
 * 테스트 생성 설정
 */
export interface TestGeneratorConfig {
  outputDir: string;
  testFramework: 'jest' | 'mocha' | 'vitest' | 'pytest' | 'junit' | 'auto';
  language: string;
}

/**
 * 테스트 생성 결과
 */
export interface TestGenerationResult {
  success: boolean;
  suggestions: TestSuggestion[];
  generatedTests: GeneratedTest[];
  errors: string[];
}

/**
 * 파일별 테스트 생성 결과
 */
export interface FileTestResult {
  sourceFile: string;
  testFile: string;
  suggestions: TestSuggestion[];
  generatedTest?: GeneratedTest;
  error?: string;
}
