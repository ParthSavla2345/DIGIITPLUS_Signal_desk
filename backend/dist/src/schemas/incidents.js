"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listIncidentsQuerySchema = exports.resolveSchema = exports.escalateSchema = exports.addCommentSchema = exports.updateIncidentSchema = exports.createIncidentSchema = void 0;
const zod_1 = require("zod");
exports.createIncidentSchema = zod_1.z.object({
    title: zod_1.z
        .string()
        .min(5, 'Title must be at least 5 characters')
        .max(255, 'Title must be under 255 characters'),
    description: zod_1.z
        .string()
        .min(20, 'Description must be at least 20 characters')
        .max(10000, 'Description must be under 10,000 characters'),
});
exports.updateIncidentSchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    priority: zod_1.z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
    severity: zod_1.z.enum(['critical', 'high', 'medium', 'low']).optional(),
    category: zod_1.z.string().max(100).optional(),
    affected_service: zod_1.z.string().max(100).optional(),
    assigned_team: zod_1.z.string().max(100).optional(),
    resolution: zod_1.z.string().max(10000).optional(),
});
exports.addCommentSchema = zod_1.z.object({
    comment: zod_1.z
        .string()
        .min(1, 'Comment cannot be empty')
        .max(5000, 'Comment must be under 5,000 characters'),
    engineer: zod_1.z.string().max(100).optional(),
});
exports.escalateSchema = zod_1.z.object({
    target_team: zod_1.z.string().min(1).max(100),
    reason: zod_1.z.string().min(1).max(1000),
    engineer: zod_1.z.string().max(100).optional(),
});
exports.resolveSchema = zod_1.z.object({
    resolution: zod_1.z
        .string()
        .min(10, 'Resolution must be at least 10 characters')
        .max(10000, 'Resolution must be under 10,000 characters'),
    engineer: zod_1.z.string().max(100).optional(),
});
exports.listIncidentsQuerySchema = zod_1.z.object({
    status: zod_1.z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
    priority: zod_1.z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
    category: zod_1.z.string().optional(),
    limit: zod_1.z.coerce.number().min(1).max(100).optional().default(50),
    offset: zod_1.z.coerce.number().min(0).optional().default(0),
});
//# sourceMappingURL=incidents.js.map