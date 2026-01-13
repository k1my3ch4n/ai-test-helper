import { GoogleGenerativeAI } from '@google/generative-ai';
import { AIClient, TestSuggestion, GeneratedTest } from './types';

const DEFAULT_MODEL = 'gemini-1.5-pro';

export class GeminiClient implements AIClient {
  private client: GoogleGenerativeAI;
  private model: string;

  constructor(apiKey: string, model?: string) {
    this.client = new GoogleGenerativeAI(apiKey);
    this.model = model || DEFAULT_MODEL;
  }

  async analyzeChanges(diff: string, context?: string): Promise<TestSuggestion[]> {
    const model = this.client.getGenerativeModel({ model: this.model });

    const prompt = `당신은 테스트 엔지니어링 전문가입니다. 코드 변경사항을 분석하고 테스트해야 할 항목을 제안해주세요.
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
JSON 배열만 반환하고 다른 텍스트는 포함하지 마세요.

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
      const suggestions = JSON.parse(jsonMatch[0]) as TestSuggestion[];
      return suggestions;
    } catch {
      throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
    }
  }

  async generateTestCode(
    sourceCode: string,
    suggestions: TestSuggestion[],
    language: string
  ): Promise<GeneratedTest> {
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
      const generatedTest = JSON.parse(jsonMatch[0]) as GeneratedTest;
      return generatedTest;
    } catch {
      throw new Error(`Failed to parse Gemini response as JSON: ${text}`);
    }
  }
}
