/**
 * AI 프로바이더 타입
 */
export type AIProvider = 'claude' | 'gemini';

/**
 * AI API 설정
 */
export interface AIConfig {
  provider: AIProvider;
  apiKey: string;
  model?: string;
}

/**
 * 테스트 제안 항목
 */
export interface TestSuggestion {
  description: string;
  priority: 'high' | 'medium' | 'low';
  type: 'unit' | 'integration' | 'e2e';
}

/**
 * 생성된 테스트 코드
 */
export interface GeneratedTest {
  fileName: string;
  content: string;
  suggestions: TestSuggestion[];
}

/**
 * AI 클라이언트 인터페이스
 */
export interface AIClient {
  /**
   * 코드 변경사항을 분석하여 테스트해야 할 항목 목록 생성
   */
  analyzeChanges(diff: string, context?: string): Promise<TestSuggestion[]>;

  /**
   * 테스트 코드 생성
   */
  generateTestCode(
    sourceCode: string,
    suggestions: TestSuggestion[],
    language: string
  ): Promise<GeneratedTest>;
}
