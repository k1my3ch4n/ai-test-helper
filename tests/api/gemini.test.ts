import { GeminiClient } from '../../src/api/gemini';
import { TestSuggestion, GeneratedTest } from '../../src/api/types';

describe('GeminiClient', () => {
  describe('생성자', () => {
    it('API 키로 클라이언트를 생성할 수 있어야 한다', () => {
      const client = new GeminiClient('test-api-key');
      expect(client).toBeDefined();
    });

    it('커스텀 모델로 클라이언트를 생성할 수 있어야 한다', () => {
      const client = new GeminiClient('test-api-key', 'gemini-2.0-flash');
      expect(client).toBeDefined();
    });
  });
});
