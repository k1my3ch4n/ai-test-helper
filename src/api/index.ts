import { AIClient, AIConfig, AIProvider } from './types';
import { ClaudeClient } from './claude';
import { GeminiClient } from './gemini';

export * from './types';
export { ClaudeClient } from './claude';
export { GeminiClient } from './gemini';

/**
 * AI 프로바이더에 따른 클라이언트 생성
 */
export function createAIClient(config: AIConfig): AIClient {
  switch (config.provider) {
    case 'claude':
      return new ClaudeClient(config.apiKey, config.model);
    case 'gemini':
      return new GeminiClient(config.apiKey, config.model);
    default:
      throw new Error(`Unsupported AI provider: ${config.provider as string}`);
  }
}

/**
 * 문자열을 AIProvider 타입으로 변환
 */
export function parseProvider(provider: string): AIProvider {
  const normalized = provider.toLowerCase();
  if (normalized === 'claude' || normalized === 'gemini') {
    return normalized;
  }
  throw new Error(`Invalid AI provider: ${provider}. Supported providers: claude, gemini`);
}
