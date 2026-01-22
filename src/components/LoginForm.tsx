"use client";

import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const locale = useLocale();
  const t = useTranslations("Auth");
  const registered = searchParams.get("registered");

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(false);

  return (
    <>
      {isLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-sm">
          <Loader2 className="h-8 w-8 animate-spin text-zinc-900" />
        </div>
      )}
      <div className="space-y-4">
        {registered ? (
          <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
            {t("loginForm.registeredSuccess")}
          </p>
        ) : null}

        <form
          className="space-y-4"
          onSubmit={(e) => {
            e.preventDefault();
            setError(null);
            setIsLoading(true);
            startTransition(async () => {
              const res = await signIn("credentials", {
                identifier,
                password,
                redirect: false,
              });

              if (res?.error) {
                setError(t("loginForm.invalidCredentials"));
                setIsLoading(false);
                return;
              }

              // Add delay to show loading state
              await new Promise((resolve) => setTimeout(resolve, 1000));

              router.push(`/${locale}`);
              router.refresh();
            });
          }}
        >
        <div>
          <label className="mb-1 block text-sm font-medium">
            {t("fields.emailOrUsername")}
          </label>
          <input
            value={identifier}
            onChange={(e) => setIdentifier(e.target.value)}
            type="text"
            required
            autoComplete="username"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </div>

        <div>
          <label className="mb-1 block text-sm font-medium">{t("fields.password")}</label>
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            required
            autoComplete="current-password"
            className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
        </div>

          {error ? <p className="text-sm text-red-600">{error}</p> : null}

          <button
            type="submit"
            disabled={isPending || isLoading}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {isPending || isLoading ? t("loginForm.submitting") : t("loginForm.submit")}
          </button>
        </form>
      </div>
    </>
  );
}
