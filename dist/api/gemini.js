"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = void 0;
const generative_ai_1 = require("@google/generative-ai");
const DEFAULT_MODEL = 'gemini-1.5-pro';
class GeminiClient {
    client;
    model;
    constructor(apiKey, model) {
        this.client = new generative_ai_1.GoogleGenerativeAI(apiKey);
        this.model = model || DEFAULT_MODEL;
    }
    async analyzeChanges(diff, context) {
        const model = this.client.getGenerativeModel({ model: this.model });
        const prompt = `당신은 테스트 엔지니어링 전문가입니다. 코드 변경사항을 분석하고 테스트해야 할 항목을 제안해주세요.

**중요: 모든 응답은 반드시 한국어(Korean)로 작성해야 합니다. 영어로 작성하지 마세요.**

다음 JSON 형식의 배열로 반환해주세요:
[
  {
    "description": "테스트해야 할 내용에 대한 설명 (반드시 한글로 작성)",
    "priority": "high" | "medium" | "low",
    "type": "unit" | "integration" | "e2e",
    "codeExample": "// 실제 구현 가능한 테스트 코드 예시 (한글 주석 포함)"
  }
]

**필수 요구사항:**
1. description은 반드시 한글로 작성 (예: "사용자 로그인 기능이 정상 동작하는지 확인")
2. codeExample에는 실제 실행 가능한 테스트 코드를 포함 (Jest/Vitest 형식)
3. codeExample의 주석과 테스트 설명도 한글로 작성
4. JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요

${context ? `컨텍스트:\n${context}\n\n` : ''}코드 변경사항 (diff):
${diff}`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        try {
            const jsonMatch = text.match(/\[[\s\S]*\]/);
            if (!jsonMatch) {
                throw new Error('No JSON array found in response');
            }
            const suggestions = JSON.parse(jsonMatch[0]);
            return suggestions;
        }
        catch {
            throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
        }
    }
    async generateTestCode(sourceCode, suggestions, language) {
        const model = this.client.getGenerativeModel({ model: this.model });
        const prompt = `You are a test engineering expert. Generate test code based on the source code and test suggestions.
Return your response as a JSON object with the following format:
{
  "fileName": "suggested test file name",
  "content": "the complete test code",
  "suggestions": [array of TestSuggestion objects that were implemented]
}
Only return the JSON object, no additional text.

Language: ${language}

Source Code:
${sourceCode}

Test Suggestions:
${JSON.stringify(suggestions, null, 2)}

Generate comprehensive test code that covers the suggested test cases.`;
        const result = await model.generateContent(prompt);
        const response = result.response;
        const text = response.text();
        try {
            const jsonMatch = text.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No JSON object found in response');
            }
            const generatedTest = JSON.parse(jsonMatch[0]);
            return generatedTest;
        }
        catch {
            throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
        }
    }
}
exports.GeminiClient = GeminiClient;
//# sourceMappingURL=gemini.js.map