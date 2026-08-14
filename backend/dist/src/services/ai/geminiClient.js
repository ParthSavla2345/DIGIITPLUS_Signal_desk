"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PROMPT_VERSION = exports.MODELS = void 0;
exports.getGeminiClient = getGeminiClient;
const genai_1 = require("@google/genai");
const env_1 = require("../../config/env");
let _client = null;
function getGeminiClient() {
    if (!_client) {
        _client = new genai_1.GoogleGenAI({ apiKey: env_1.env.GEMINI_API_KEY });
    }
    return _client;
}
exports.MODELS = {
    GENERATION: 'gemini-2.0-flash',
    EMBEDDING: 'gemini-embedding-001',
};
exports.PROMPT_VERSION = 'v1.0.0';
//# sourceMappingURL=geminiClient.js.map