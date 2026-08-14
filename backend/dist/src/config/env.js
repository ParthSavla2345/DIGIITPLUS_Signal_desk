"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.env = void 0;
const dotenv_1 = __importDefault(require("dotenv"));
const zod_1 = require("zod");
dotenv_1.default.config();
const PLACEHOLDER_VALUES = [
    'YOUR_PROJECT_ID',
    'YOUR_SUPABASE_PUBLISHABLE_KEY',
    'YOUR_SUPABASE_SECRET_KEY',
    'YOUR_GEMINI_API_KEY',
];
function isPlaceholder(value) {
    return PLACEHOLDER_VALUES.some((placeholder) => value.includes(placeholder));
}
const envSchema = zod_1.z.object({
    SUPABASE_URL: zod_1.z
        .string()
        .min(1, 'SUPABASE_URL is required')
        .refine((v) => !isPlaceholder(v), {
        message: 'SUPABASE_URL still contains a placeholder. Replace YOUR_PROJECT_ID with your real Supabase project ID.',
    }),
    SUPABASE_SECRET_KEY: zod_1.z
        .string()
        .min(1, 'SUPABASE_SECRET_KEY is required')
        .refine((v) => !isPlaceholder(v), {
        message: 'SUPABASE_SECRET_KEY still contains a placeholder. Replace it with your real Supabase service role key.',
    }),
    SUPABASE_PUBLISHABLE_KEY: zod_1.z
        .string()
        .min(1, 'SUPABASE_PUBLISHABLE_KEY is required')
        .refine((v) => !isPlaceholder(v), {
        message: 'SUPABASE_PUBLISHABLE_KEY still contains a placeholder. Replace it with your real Supabase anon key.',
    }),
    GEMINI_API_KEY: zod_1.z
        .string()
        .min(1, 'GEMINI_API_KEY is required')
        .refine((v) => !isPlaceholder(v), {
        message: 'GEMINI_API_KEY still contains a placeholder. Replace it with your real Google AI Studio API key.',
    }),
    PORT: zod_1.z
        .string()
        .optional()
        .default('5000')
        .transform(Number),
    NODE_ENV: zod_1.z
        .enum(['development', 'production', 'test'])
        .optional()
        .default('development'),
});
function validateEnv() {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
        console.error('\n❌ Environment Configuration Error\n');
        result.error.errors.forEach((err) => {
            const field = err.path.join('.');
            console.error(`  Missing required environment variable: ${field}`);
            console.error(`  → ${err.message}\n`);
        });
        console.error('👉 Copy backend/.env.example to backend/.env and fill in your real credentials.\n');
        process.exit(1);
    }
    return result.data;
}
exports.env = validateEnv();
//# sourceMappingURL=env.js.map