import { ClaudeClient } from '../../src/api/claude';
import { TestSuggestion, GeneratedTest } from '../../src/api/types';

describe('ClaudeClient', () => {
  describe('생성자', () => {
    it('빈 API 키로 클라이언트를 생성할 수 있어야 한다', () => {
      expect(() => new ClaudeClient('')).toBeDefined();
    });

    it('API 키로 클라이언트를 생성할 수 있어야 한다', () => {
      const client = new ClaudeClient('test-api-key');
      expect(client).toBeDefined();
    });

    it('커스텀 모델로 클라이언트를 생성할 수 있어야 한다', () => {
      const client = new ClaudeClient('test-api-key', 'claude-3-opus');
      expect(client).toBeDefined();
    });
  });
});
