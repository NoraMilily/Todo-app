"use client";

import { useActionState } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import type { RegisterState } from "@/app/actions/auth";
import { registerAction } from "@/app/actions/auth";

const initialState: RegisterState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("Auth");
  return (
    <button
      type="submit"
      disabled={pending}
      className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? t("registerForm.submitting") : t("registerForm.submit")}
    </button>
  );
}

export function RegisterForm() {
  const [state, formAction] = useActionState(registerAction, initialState);
  const t = useTranslations("Auth");

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium">{t("fields.email")}</label>
        <input
          name="email"
          type="email"
          required
          autoComplete="email"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        {state.ok === false && state.fieldErrors?.email?.[0] ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.email[0]}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t("fields.username")}</label>
        <input
          name="username"
          type="text"
          required
          autoComplete="username"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        {state.ok === false && state.fieldErrors?.username?.[0] ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.username[0]}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("fields.displayName")}
        </label>
        <input
          name="displayName"
          type="text"
          required
          autoComplete="name"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        {state.ok === false && state.fieldErrors?.displayName?.[0] ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.displayName[0]}
          </p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">{t("fields.password")}</label>
        <input
          name="password"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        {state.ok === false && state.fieldErrors?.password?.[0] ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.password[0]}</p>
        ) : null}
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("fields.confirmPassword")}
        </label>
        <input
          name="confirmPassword"
          type="password"
          required
          minLength={6}
          autoComplete="new-password"
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        {state.ok === false && state.fieldErrors?.confirmPassword?.[0] ? (
          <p className="mt-1 text-sm text-red-600">
            {state.fieldErrors.confirmPassword[0]}
          </p>
        ) : null}
      </div>

      {state.ok === false && state.formError ? (
        <p className="text-sm text-red-600">{state.formError}</p>
      ) : null}

      <SubmitButton />
    </form>
  );
}
