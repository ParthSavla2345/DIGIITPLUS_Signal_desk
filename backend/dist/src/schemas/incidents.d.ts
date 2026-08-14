import { z } from 'zod';
export declare const createIncidentSchema: z.ZodObject<{
    title: z.ZodString;
    description: z.ZodString;
}, "strip", z.ZodTypeAny, {
    title: string;
    description: string;
}, {
    title: string;
    description: string;
}>;
export declare const updateIncidentSchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["open", "in_progress", "resolved", "closed"]>>;
    priority: z.ZodOptional<z.ZodEnum<["P1", "P2", "P3", "P4"]>>;
    severity: z.ZodOptional<z.ZodEnum<["critical", "high", "medium", "low"]>>;
    category: z.ZodOptional<z.ZodString>;
    affected_service: z.ZodOptional<z.ZodString>;
    assigned_team: z.ZodOptional<z.ZodString>;
    resolution: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    status?: "open" | "in_progress" | "resolved" | "closed" | undefined;
    priority?: "P1" | "P2" | "P3" | "P4" | undefined;
    category?: string | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    affected_service?: string | undefined;
    assigned_team?: string | undefined;
    resolution?: string | undefined;
}, {
    status?: "open" | "in_progress" | "resolved" | "closed" | undefined;
    priority?: "P1" | "P2" | "P3" | "P4" | undefined;
    category?: string | undefined;
    severity?: "critical" | "high" | "medium" | "low" | undefined;
    affected_service?: string | undefined;
    assigned_team?: string | undefined;
    resolution?: string | undefined;
}>;
export declare const addCommentSchema: z.ZodObject<{
    comment: z.ZodString;
    engineer: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    comment: string;
    engineer?: string | undefined;
}, {
    comment: string;
    engineer?: string | undefined;
}>;
export declare const escalateSchema: z.ZodObject<{
    target_team: z.ZodString;
    reason: z.ZodString;
    engineer: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    target_team: string;
    reason: string;
    engineer?: string | undefined;
}, {
    target_team: string;
    reason: string;
    engineer?: string | undefined;
}>;
export declare const resolveSchema: z.ZodObject<{
    resolution: z.ZodString;
    engineer: z.ZodOptional<z.ZodString>;
}, "strip", z.ZodTypeAny, {
    resolution: string;
    engineer?: string | undefined;
}, {
    resolution: string;
    engineer?: string | undefined;
}>;
export declare const listIncidentsQuerySchema: z.ZodObject<{
    status: z.ZodOptional<z.ZodEnum<["open", "in_progress", "resolved", "closed"]>>;
    priority: z.ZodOptional<z.ZodEnum<["P1", "P2", "P3", "P4"]>>;
    category: z.ZodOptional<z.ZodString>;
    limit: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
    offset: z.ZodDefault<z.ZodOptional<z.ZodNumber>>;
}, "strip", z.ZodTypeAny, {
    limit: number;
    offset: number;
    status?: "open" | "in_progress" | "resolved" | "closed" | undefined;
    priority?: "P1" | "P2" | "P3" | "P4" | undefined;
    category?: string | undefined;
}, {
    status?: "open" | "in_progress" | "resolved" | "closed" | undefined;
    priority?: "P1" | "P2" | "P3" | "P4" | undefined;
    category?: string | undefined;
    limit?: number | undefined;
    offset?: number | undefined;
}>;
//# sourceMappingURL=incidents.d.ts.map