"use client";

import { useActionState, useState, useEffect, useRef } from "react";
import { useFormStatus } from "react-dom";
import { useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import type { ForgotPasswordState } from "@/app/actions/auth";
import {
  findUserForPasswordReset,
  resetPasswordAction,
} from "@/app/actions/auth";
import { Link } from "@/i18n/navigation";

const initialState: ForgotPasswordState = { ok: false };

function SubmitButton({ label }: { label: string }) {
  const { pending } = useFormStatus();
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? label : label}
    </button>
  );
}

export function ForgotPasswordForm() {
  const [state, formAction] = useActionState(findUserForPasswordReset, initialState);
  const [resetState, resetAction] = useActionState(resetPasswordAction, initialState);
  const identifierRef = useRef<string>("");
  const [step, setStep] = useState<"findUser" | "resetPassword">("findUser");
  const router = useRouter();
  const locale = useLocale();
  const t = useTranslations("Auth.forgotPassword");

  // If user was found, move to password reset step
  useEffect(() => {
    if (state.ok && state.step === "userFound" && step === "findUser") {
      setStep("resetPassword");
    }
  }, [state, step]);

  // If password was changed, redirect to login
  useEffect(() => {
    if (resetState.ok && resetState.step === "passwordChanged") {
      router.push(`/${locale}/auth/login?passwordReset=1`);
      router.refresh();
    }
  }, [resetState, router, locale]);

  if (step === "resetPassword") {
    return (
      <form action={resetAction} className="space-y-4">
        <input type="hidden" name="identifier" value={identifierRef.current} />

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("fields.newPassword")}
          </label>
          <input
            name="password"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          {resetState.ok === false && resetState.fieldErrors?.password?.[0] ? (
            <p className="mt-1 text-sm text-red-600">
              {resetState.fieldErrors.password[0]}
            </p>
          ) : null}
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("fields.confirmNewPassword")}
          </label>
          <input
            name="confirmPassword"
            type="password"
            required
            minLength={6}
            autoComplete="new-password"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          {resetState.ok === false &&
          resetState.fieldErrors?.confirmPassword?.[0] ? (
            <p className="mt-1 text-sm text-red-600">
              {resetState.fieldErrors.confirmPassword[0]}
            </p>
          ) : null}
        </div>

        {resetState.ok === false && resetState.formError ? (
          <p className="text-sm text-red-600">{resetState.formError}</p>
        ) : null}

        <SubmitButton label={t("form.submitReset")} />
      </form>
    );
  }

  return (
    <form
      action={formAction}
      onSubmit={(e) => {
        const form = e.currentTarget;
        const identifierInput = form.elements.namedItem(
          "identifier",
        ) as HTMLInputElement;
        identifierRef.current = identifierInput.value;
      }}
      className="space-y-4"
    >
      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("fields.identifier")}
        </label>
        <input
          name="identifier"
          type="text"
          required
          autoComplete="username"
          placeholder={t("fields.identifierPlaceholder")}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        {state.ok === false && state.fieldErrors?.identifier?.[0] ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.identifier[0]}
          </p>
        ) : null}
      </div>

      {state.ok === false && state.formError ? (
        <p className="text-sm text-red-600">{state.formError}</p>
      ) : null}

      <SubmitButton label={t("form.submitFind")} />
    </form>
  );
}
