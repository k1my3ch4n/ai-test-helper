import { createAIClient, parseProvider } from '../../src/api';
import { ClaudeClient } from '../../src/api/claude';
import { GeminiClient } from '../../src/api/gemini';
import { AIConfig } from '../../src/api/types';

jest.mock('../../src/api/claude');
jest.mock('../../src/api/gemini');

describe('API 인덱스 모듈', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createAIClient', () => {
    it('프로바이더가 claude일 때 ClaudeClient를 생성해야 한다', () => {
      const config: AIConfig = {
        provider: 'claude',
        apiKey: 'test-claude-key',
      };

      createAIClient(config);

      expect(ClaudeClient).toHaveBeenCalledWith('test-claude-key', undefined);
    });

    it('커스텀 모델로 ClaudeClient를 생성해야 한다', () => {
      const config: AIConfig = {
        provider: 'claude',
        apiKey: 'test-claude-key',
        model: 'claude-3-opus',
      };

      createAIClient(config);

      expect(ClaudeClient).toHaveBeenCalledWith('test-claude-key', 'claude-3-opus');
    });

    it('프로바이더가 gemini일 때 GeminiClient를 생성해야 한다', () => {
      const config: AIConfig = {
        provider: 'gemini',
        apiKey: 'test-gemini-key',
      };

      createAIClient(config);

      expect(GeminiClient).toHaveBeenCalledWith('test-gemini-key', undefined);
    });

    it('커스텀 모델로 GeminiClient를 생성해야 한다', () => {
      const config: AIConfig = {
        provider: 'gemini',
        apiKey: 'test-gemini-key',
        model: 'gemini-2.0-flash',
      };

      createAIClient(config);

      expect(GeminiClient).toHaveBeenCalledWith('test-gemini-key', 'gemini-2.0-flash');
    });

    it('지원하지 않는 프로바이더일 때 에러를 던져야 한다', () => {
      const config = {
        provider: 'openai' as any,
        apiKey: 'test-key',
      };

      expect(() => createAIClient(config)).toThrow('Unsupported AI provider: openai');
    });
  });

  describe('parseProvider', () => {
    it('"claude" 문자열에 대해 claude를 반환해야 한다', () => {
      expect(parseProvider('claude')).toBe('claude');
    });

    it('"CLAUDE" 문자열에 대해 claude를 반환해야 한다 (대소문자 무시)', () => {
      expect(parseProvider('CLAUDE')).toBe('claude');
    });

    it('"gemini" 문자열에 대해 gemini를 반환해야 한다', () => {
      expect(parseProvider('gemini')).toBe('gemini');
    });

    it('"Gemini" 문자열에 대해 gemini를 반환해야 한다 (대소문자 무시)', () => {
      expect(parseProvider('Gemini')).toBe('gemini');
    });

    it('유효하지 않은 프로바이더일 때 에러를 던져야 한다', () => {
      expect(() => parseProvider('openai')).toThrow(
        'Invalid AI provider: openai. Supported providers: claude, gemini'
      );
    });

    it('빈 문자열일 때 에러를 던져야 한다', () => {
      expect(() => parseProvider('')).toThrow(
        'Invalid AI provider: . Supported providers: claude, gemini'
      );
    });
  });
});
