import { AIClient, AIConfig, AIProvider } from './types';
export * from './types';
export { ClaudeClient } from './claude';
export { GeminiClient } from './gemini';
/**
 * AI 프로바이더에 따른 클라이언트 생성
 */
export declare function createAIClient(config: AIConfig): AIClient;
/**
 * 문자열을 AIProvider 타입으로 변환
 */
export declare function parseProvider(provider: string): AIProvider;
//# sourceMappingURL=index.d.ts.map