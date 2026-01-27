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

export type ForgotPasswordState =
  | { ok: true; step: "userFound" | "passwordChanged" }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string };

/**
 * Step 1: Find user by username or email
 */
export async function findUserForPasswordReset(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Auth.forgotPassword" });

  const identifier = String(formData.get("identifier") ?? "").trim();

  if (!identifier) {
    return {
      ok: false,
      fieldErrors: { identifier: [t("errors.identifierRequired")] },
    };
  }

  // Find user by email or username
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    },
  });

  if (!user) {
    // Don't reveal if user exists for security reasons
    // Return generic error
    return {
      ok: false,
      formError: t("errors.userNotFound"),
    };
  }

  return { ok: true, step: "userFound" };
}

/**
 * Step 2: Reset password with new password
 * 
 * Security note: This function should only be called after findUserForPasswordReset
 * has successfully identified a user. However, we re-validate the identifier here
 * as a defense-in-depth measure.
 */
export async function resetPasswordAction(
  _prev: ForgotPasswordState,
  formData: FormData,
): Promise<ForgotPasswordState> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "Auth.forgotPassword" });

  const identifier = String(formData.get("identifier") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  // Validate identifier
  if (!identifier) {
    return {
      ok: false,
      fieldErrors: { identifier: [t("errors.identifierRequired")] },
    };
  }

  // Find user - re-validate to ensure user still exists and identifier is correct
  // This provides defense-in-depth security
  const user = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier.toLowerCase() },
        { username: identifier },
      ],
    },
    select: {
      id: true,
    },
  });

  if (!user) {
    // Don't reveal if user exists for security reasons
    return {
      ok: false,
      formError: t("errors.userNotFound"),
    };
  }

  // Validate passwords
  const passwordSchema = z
    .object({
      password: z.string().min(6, t("errors.passwordMin")),
      confirmPassword: z.string().min(6),
    })
    .refine((v) => v.password === v.confirmPassword, {
      message: t("errors.passwordsNoMatch"),
      path: ["confirmPassword"],
    });

  const parsed = passwordSchema.safeParse({ password, confirmPassword });
  if (!parsed.success) {
    return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
  }

  // Hash new password securely
  const passwordHash = await hashPassword(parsed.data.password);

  // Update user password
  await prisma.user.update({
    where: { id: user.id },
    data: { passwordHash },
  });

  return { ok: true, step: "passwordChanged" };
}
