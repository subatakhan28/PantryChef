import "server-only";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { prisma } from "@/lib/prisma";
import type { User } from "@prisma/client";

export type SessionUser = {
  authId: string;
  email: string;
  record: User;
};

export async function requireAuthUser(): Promise<SessionUser> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  let record = await prisma.user.findUnique({ where: { id: user.id } });

  if (!record) {
    record = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email ?? "",
        fullName: (user.user_metadata?.full_name as string | undefined) ?? null,
        avatarUrl: (user.user_metadata?.avatar_url as string | undefined) ?? null,
      },
    });
  }

  return { authId: user.id, email: user.email ?? record.email, record };
}

export async function requireOnboardedUser(): Promise<SessionUser> {
  const session = await requireAuthUser();
  if (!session.record.onboardingCompleted) {
    redirect("/onboarding");
  }
  return session;
}
