"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeminiClient = exports.ClaudeClient = void 0;
exports.createAIClient = createAIClient;
exports.parseProvider = parseProvider;
const claude_1 = require("./claude");
const gemini_1 = require("./gemini");
__exportStar(require("./types"), exports);
var claude_2 = require("./claude");
Object.defineProperty(exports, "ClaudeClient", { enumerable: true, get: function () { return claude_2.ClaudeClient; } });
var gemini_2 = require("./gemini");
Object.defineProperty(exports, "GeminiClient", { enumerable: true, get: function () { return gemini_2.GeminiClient; } });
/**
 * AI 프로바이더에 따른 클라이언트 생성
 */
function createAIClient(config) {
    switch (config.provider) {
        case 'claude':
            return new claude_1.ClaudeClient(config.apiKey, config.model);
        case 'gemini':
            return new gemini_1.GeminiClient(config.apiKey, config.model);
        default:
            throw new Error(`Unsupported AI provider: ${config.provider}`);
    }
}
/**
 * 문자열을 AIProvider 타입으로 변환
 */
function parseProvider(provider) {
    const normalized = provider.toLowerCase();
    if (normalized === 'claude' || normalized === 'gemini') {
        return normalized;
    }
    throw new Error(`Invalid AI provider: ${provider}. Supported providers: claude, gemini`);
}
//# sourceMappingURL=index.js.map