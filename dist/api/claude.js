"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ClaudeClient = void 0;
const sdk_1 = __importDefault(require("@anthropic-ai/sdk"));
const DEFAULT_MODEL = 'claude-sonnet-4-20250514';
class ClaudeClient {
    client;
    model;
    constructor(apiKey, model) {
        this.client = new sdk_1.default({ apiKey });
        this.model = model || DEFAULT_MODEL;
    }
    async analyzeChanges(diff, context) {
        const systemPrompt = `당신은 테스트 엔지니어링 전문가입니다. 코드 변경사항을 분석하고 테스트해야 할 항목을 제안해주세요.
반드시 한글로 응답하고, 다음 JSON 형식의 배열로 반환해주세요:
[
  {
    "description": "테스트해야 할 내용에 대한 설명 (한글로 작성)",
    "priority": "high" | "medium" | "low",
    "type": "unit" | "integration" | "e2e",
    "codeExample": "// 테스트 코드 예시\\ndescribe('테스트 스위트', () => {\\n  it('테스트 케이스', () => {\\n    // 테스트 로직\\n  });\\n});"
  }
]
codeExample에는 해당 테스트를 구현하기 위한 간단한 테스트 코드 예시를 포함해주세요.
JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요.`;
        const userPrompt = `다음 코드 변경사항을 분석하고 테스트 제안을 해주세요:

${context ? `컨텍스트:\n${context}\n\n` : ''}코드 변경사항 (diff):
${diff}`;
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 4096,
            messages: [
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
            system: systemPrompt,
        });
        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from Claude API');
        }
        try {
            const suggestions = JSON.parse(content.text);
            return suggestions;
        }
        catch {
            throw new Error(`Failed to parse Claude response as JSON: ${content.text}`);
        }
    }
    async generateTestCode(sourceCode, suggestions, language) {
        const systemPrompt = `You are a test engineering expert. Generate test code based on the source code and test suggestions.
Return your response as a JSON object with the following format:
{
  "fileName": "suggested test file name",
  "content": "the complete test code",
  "suggestions": [array of TestSuggestion objects that were implemented]
}
Only return the JSON object, no additional text.`;
        const userPrompt = `Generate test code for the following:

Language: ${language}

Source Code:
${sourceCode}

Test Suggestions:
${JSON.stringify(suggestions, null, 2)}

Generate comprehensive test code that covers the suggested test cases.`;
        const response = await this.client.messages.create({
            model: this.model,
            max_tokens: 8192,
            messages: [
                {
                    role: 'user',
                    content: userPrompt,
                },
            ],
            system: systemPrompt,
        });
        const content = response.content[0];
        if (content.type !== 'text') {
            throw new Error('Unexpected response type from Claude API');
        }
        try {
            const result = JSON.parse(content.text);
            return result;
        }
        catch {
            throw new Error(`Failed to parse Claude response as JSON: ${content.text}`);
        }
    }
}
exports.ClaudeClient = ClaudeClient;
//# sourceMappingURL=claude.js.map