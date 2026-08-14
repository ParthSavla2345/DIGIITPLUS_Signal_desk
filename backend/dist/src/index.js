"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("express-async-errors");
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const env_1 = require("./config/env");
const requestLogger_1 = require("./middleware/requestLogger");
const errorHandler_1 = require("./middleware/errorHandler");
const incidents_1 = __importDefault(require("./routes/incidents"));
const knowledge_1 = __importDefault(require("./routes/knowledge"));
const app = (0, express_1.default)();
// ============================================================
// Middleware
// ============================================================
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL ?? 'http://localhost:5173',
    methods: ['GET', 'POST', 'PATCH', 'DELETE'],
    allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express_1.default.json({ limit: '10mb' }));
app.use(requestLogger_1.requestLogger);
// ============================================================
// Routes
// ============================================================
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        service: 'SignalDesk API',
        version: '1.0.0',
        timestamp: new Date().toISOString(),
    });
});
app.use('/api/incidents', incidents_1.default);
app.use('/api/knowledge', knowledge_1.default);
// 404 handler
app.use((_req, res) => {
    res.status(404).json({ error: 'Route not found' });
});
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// ============================================================
// Start server
// ============================================================
app.listen(env_1.env.PORT, () => {
    console.log(`\n🚀 SignalDesk API Server`);
    console.log(`   Environment: ${env_1.env.NODE_ENV}`);
    console.log(`   Port: ${env_1.env.PORT}`);
    console.log(`   Health: http://localhost:${env_1.env.PORT}/api/health\n`);
});
exports.default = app;
//# sourceMappingURL=index.js.map