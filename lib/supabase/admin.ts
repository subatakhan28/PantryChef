import "server-only";
import { createClient } from "@supabase/supabase-js";
import { clientEnv, serverEnv } from "@/lib/env";

/**
 * Service-role Supabase client. Bypasses Row Level Security.
 *
 * MUST NEVER be imported into a client component or any file that ships
 * to the browser. The `import "server-only"` above will fail the build
 * if that ever happens.
 *
 * Use this client only for trusted server work: seeding data, admin
 * dashboards, scheduled jobs, and migrations.
 */
export function createAdminClient() {
  return createClient(clientEnv.NEXT_PUBLIC_SUPABASE_URL, serverEnv.SUPABASE_SERVICE_ROLE_KEY, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
