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
        const systemPrompt = `You are a test engineering expert. Analyze the code changes and suggest what should be tested.
Return your response as a JSON array of test suggestions with the following format:
[
  {
    "description": "Description of what to test",
    "priority": "high" | "medium" | "low",
    "type": "unit" | "integration" | "e2e"
  }
]
Only return the JSON array, no additional text.`;
        const userPrompt = `Analyze the following code changes and suggest tests:

${context ? `Context:\n${context}\n\n` : ''}Code Changes (diff):
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