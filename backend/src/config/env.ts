import dotenv from 'dotenv';
import { z } from 'zod';

dotenv.config();

const PLACEHOLDER_VALUES = [
  'YOUR_PROJECT_ID',
  'YOUR_SUPABASE_PUBLISHABLE_KEY',
  'YOUR_SUPABASE_SECRET_KEY',
  'YOUR_GEMINI_API_KEY',
];

function isPlaceholder(value: string): boolean {
  return PLACEHOLDER_VALUES.some((placeholder) => value.includes(placeholder));
}

const envSchema = z.object({
  SUPABASE_URL: z
    .string()
    .min(1, 'SUPABASE_URL is required')
    .refine((v) => !isPlaceholder(v), {
      message:
        'SUPABASE_URL still contains a placeholder. Replace YOUR_PROJECT_ID with your real Supabase project ID.',
    }),
  SUPABASE_SECRET_KEY: z
    .string()
    .min(1, 'SUPABASE_SECRET_KEY is required')
    .refine((v) => !isPlaceholder(v), {
      message:
        'SUPABASE_SECRET_KEY still contains a placeholder. Replace it with your real Supabase service role key.',
    }),
  SUPABASE_PUBLISHABLE_KEY: z
    .string()
    .min(1, 'SUPABASE_PUBLISHABLE_KEY is required')
    .refine((v) => !isPlaceholder(v), {
      message:
        'SUPABASE_PUBLISHABLE_KEY still contains a placeholder. Replace it with your real Supabase anon key.',
    }),
  GEMINI_API_KEY: z
    .string()
    .min(1, 'GEMINI_API_KEY is required')
    .refine((v) => !isPlaceholder(v), {
      message:
        'GEMINI_API_KEY still contains a placeholder. Replace it with your real Google AI Studio API key.',
    }),
  PORT: z
    .string()
    .optional()
    .default('5000')
    .transform(Number),
  NODE_ENV: z
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

export const env = validateEnv();
