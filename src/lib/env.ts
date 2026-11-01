import { z } from "zod";

const envSchema = z.object({
  MONGODB_URI: z.string().min(1),
  AUTH_SECRET: z.string().min(1),
  AUTH_URL: z.string().url(),
  RESEND_API_KEY: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
});

export type AppEnv = z.infer<typeof envSchema>;

export function getEnv(source: Record<string, string | undefined> = process.env): AppEnv {
  return envSchema.parse(source);
}
