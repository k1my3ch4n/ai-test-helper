import { AIClient, TestSuggestion, GeneratedTest } from './types';
export declare class ClaudeClient implements AIClient {
    private client;
    private model;
    constructor(apiKey: string, model?: string);
    analyzeChanges(diff: string, context?: string): Promise<TestSuggestion[]>;
    generateTestCode(sourceCode: string, suggestions: TestSuggestion[], language: string): Promise<GeneratedTest>;
}
//# sourceMappingURL=claude.d.ts.map