import { z } from 'zod';

export const createIncidentSchema = z.object({
  title: z
    .string()
    .min(5, 'Title must be at least 5 characters')
    .max(255, 'Title must be under 255 characters'),
  description: z
    .string()
    .min(20, 'Description must be at least 20 characters')
    .max(10000, 'Description must be under 10,000 characters'),
});

export const updateIncidentSchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  severity: z.enum(['critical', 'high', 'medium', 'low']).optional(),
  category: z.string().max(100).optional(),
  affected_service: z.string().max(100).optional(),
  assigned_team: z.string().max(100).optional(),
  resolution: z.string().max(10000).optional(),
});

export const addCommentSchema = z.object({
  comment: z
    .string()
    .min(1, 'Comment cannot be empty')
    .max(5000, 'Comment must be under 5,000 characters'),
  engineer: z.string().max(100).optional(),
});

export const escalateSchema = z.object({
  target_team: z.string().min(1).max(100),
  reason: z.string().min(1).max(1000),
  engineer: z.string().max(100).optional(),
});

export const resolveSchema = z.object({
  resolution: z
    .string()
    .min(10, 'Resolution must be at least 10 characters')
    .max(10000, 'Resolution must be under 10,000 characters'),
  engineer: z.string().max(100).optional(),
});

export const listIncidentsQuerySchema = z.object({
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).optional(),
  priority: z.enum(['P1', 'P2', 'P3', 'P4']).optional(),
  category: z.string().optional(),
  limit: z.coerce.number().min(1).max(100).optional().default(50),
  offset: z.coerce.number().min(0).optional().default(0),
});
