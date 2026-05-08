import { z } from "zod";

const serverSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  SUPABASE_SERVICE_ROLE_KEY: z.string().min(1, "SUPABASE_SERVICE_ROLE_KEY is required"),
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  DIRECT_URL: z.string().url("DIRECT_URL must be a valid URL"),
  OPENAI_API_KEY: z.string().min(1).optional(),
  OPENAI_MODEL: z.string().default("gpt-4o-mini"),
});

const clientSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.string().url("NEXT_PUBLIC_SITE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_URL: z.string().url("NEXT_PUBLIC_SUPABASE_URL must be a valid URL"),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().min(1, "NEXT_PUBLIC_SUPABASE_ANON_KEY is required"),
});

const clientEnvRaw = {
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL,
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL,
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
};

const clientParsed = clientSchema.safeParse(clientEnvRaw);
if (!clientParsed.success) {
  console.error(
    "Invalid public environment variables:",
    clientParsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid public environment variables. See console for details.");
}

export const clientEnv = clientParsed.data;

const isServer = typeof window === "undefined";

const serverParsed = isServer
  ? serverSchema.safeParse({
      NODE_ENV: process.env.NODE_ENV,
      SUPABASE_SERVICE_ROLE_KEY: process.env.SUPABASE_SERVICE_ROLE_KEY,
      DATABASE_URL: process.env.DATABASE_URL,
      DIRECT_URL: process.env.DIRECT_URL,
      OPENAI_API_KEY: process.env.OPENAI_API_KEY,
      OPENAI_MODEL: process.env.OPENAI_MODEL,
    })
  : null;

if (isServer && serverParsed && !serverParsed.success) {
  console.error(
    "Invalid server environment variables:",
    serverParsed.error.flatten().fieldErrors,
  );
  throw new Error("Invalid server environment variables. See console for details.");
}

export const serverEnv = serverParsed?.success ? serverParsed.data : (null as never);

export const env = {
  ...clientEnv,
  ...(isServer ? serverEnv : {}),
} as typeof clientEnv & (typeof serverEnv extends never ? object : z.infer<typeof serverSchema>);
