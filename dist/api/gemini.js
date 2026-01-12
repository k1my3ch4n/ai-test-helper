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
        const prompt = `You are a test engineering expert. Analyze the code changes and suggest what should be tested.
Return your response as a JSON array of test suggestions with the following format:
[
  {
    "description": "Description of what to test",
    "priority": "high" | "medium" | "low",
    "type": "unit" | "integration" | "e2e"
  }
]
Only return the JSON array, no additional text.

${context ? `Context:\n${context}\n\n` : ''}Code Changes (diff):
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