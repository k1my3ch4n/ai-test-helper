import { createAIClient, parseProvider, ClaudeClient, GeminiClient } from '../../src/api';
import { AIClient, AIConfig, TestSuggestion, GeneratedTest } from '../../src/api/types';

describe('API 모듈 통합 테스트', () => {
  describe('createAIClient와 클라이언트 통합', () => {
    it('Claude 설정으로 ClaudeClient 인스턴스를 생성해야 한다', () => {
      const config: AIConfig = {
        provider: 'claude',
        apiKey: 'test-api-key',
      };

      const client = createAIClient(config);

      expect(client).toBeInstanceOf(ClaudeClient);
    });

    it('Gemini 설정으로 GeminiClient 인스턴스를 생성해야 한다', () => {
      const config: AIConfig = {
        provider: 'gemini',
        apiKey: 'test-api-key',
      };

      const client = createAIClient(config);

      expect(client).toBeInstanceOf(GeminiClient);
    });

    it('parseProvider와 createAIClient를 함께 사용할 수 있어야 한다', () => {
      const providerString = 'CLAUDE';
      const provider = parseProvider(providerString);

      const config: AIConfig = {
        provider,
        apiKey: 'test-api-key',
        model: 'claude-3-opus',
      };

      const client = createAIClient(config);

      expect(client).toBeInstanceOf(ClaudeClient);
    });

    it('생성된 클라이언트가 AIClient 인터페이스를 구현해야 한다', () => {
      const claudeClient = createAIClient({
        provider: 'claude',
        apiKey: 'test-key',
      });

      const geminiClient = createAIClient({
        provider: 'gemini',
        apiKey: 'test-key',
      });

      // AIClient 인터페이스 메서드 확인
      expect(typeof claudeClient.analyzeChanges).toBe('function');
      expect(typeof claudeClient.generateTestCode).toBe('function');
      expect(typeof geminiClient.analyzeChanges).toBe('function');
      expect(typeof geminiClient.generateTestCode).toBe('function');
    });
  });

  describe('프로바이더 문자열 파싱 통합', () => {
    const validProviders = [
      { input: 'claude', expected: 'claude' },
      { input: 'CLAUDE', expected: 'claude' },
      { input: 'Claude', expected: 'claude' },
      { input: 'gemini', expected: 'gemini' },
      { input: 'GEMINI', expected: 'gemini' },
      { input: 'Gemini', expected: 'gemini' },
    ];

    validProviders.forEach(({ input, expected }) => {
      it(`"${input}" 입력을 "${expected}" 프로바이더로 파싱하고 클라이언트를 생성해야 한다`, () => {
        const provider = parseProvider(input);
        expect(provider).toBe(expected);

        const client = createAIClient({
          provider,
          apiKey: 'test-key',
        });

        expect(client).toBeDefined();
        expect(typeof client.analyzeChanges).toBe('function');
      });
    });

    const invalidProviders = ['openai', 'gpt', 'chatgpt', '', ' ', 'invalid'];

    invalidProviders.forEach((input) => {
      it(`유효하지 않은 프로바이더 "${input}"에 대해 에러를 던져야 한다`, () => {
        expect(() => parseProvider(input)).toThrow();
      });
    });
  });

  describe('AIClient 타입 호환성', () => {
    it('두 클라이언트 모두 동일한 인터페이스로 사용할 수 있어야 한다', () => {
      const clients: AIClient[] = [
        createAIClient({ provider: 'claude', apiKey: 'key1' }),
        createAIClient({ provider: 'gemini', apiKey: 'key2' }),
      ];

      clients.forEach((client) => {
        expect(client).toHaveProperty('analyzeChanges');
        expect(client).toHaveProperty('generateTestCode');
      });
    });

    it('다형성을 활용한 클라이언트 사용이 가능해야 한다', () => {
      function getClient(provider: string): AIClient {
        return createAIClient({
          provider: parseProvider(provider),
          apiKey: 'test-key',
        });
      }

      const claudeClient = getClient('claude');
      const geminiClient = getClient('gemini');

      expect(claudeClient).toBeDefined();
      expect(geminiClient).toBeDefined();
    });
  });
});
