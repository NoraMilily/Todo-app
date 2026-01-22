"use server";

import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { hashPassword } from "@/lib/password";
import { redirect } from "next/navigation";
import { getLocale, getTranslations } from "next-intl/server";

export type RegisterState =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string };

export async function registerAction(
  _prev: RegisterState,
  formData: FormData,
): Promise<RegisterState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Auth" });

  const registerSchema = z
    .object({
      email: z.string().email(),
      username: z.string().trim().min(3, t("errors.usernameMin")),
      displayName: z.string().trim().min(1, t("errors.displayNameRequired")),
      password: z.string().min(6, t("errors.passwordMin")),
      confirmPassword: z.string().min(6),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t("errors.passwordsNoMatch"),
      path: ["confirmPassword"],
    });

  const raw = {
    email: String(formData.get("email") ?? ""),
    username: String(formData.get("username") ?? ""),
    displayName: String(formData.get("displayName") ?? ""),
    password: String(formData.get("password") ?? ""),
    confirmPassword: String(formData.get("confirmPassword") ?? ""),
  };

  const parsed = registerSchema.safeParse(raw);
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  const { email, username, displayName, password } = parsed.data;

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { ok: false, formError: t("errors.emailExists") };
  }

  const existingUsername = await prisma.user.findUnique({ where: { username } });
  if (existingUsername) {
    return { ok: false, formError: t("errors.usernameExists") };
  }

  const passwordHash = await hashPassword(password);

  await prisma.user.create({
    data: {
      email: email.toLowerCase(),
      username,
      displayName,
      passwordHash,
    },
  });

  // After registration, send the user to login.
  redirect(`/${locale}/auth/login?registered=1`);
}
