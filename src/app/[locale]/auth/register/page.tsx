import { getTranslations } from "next-intl/server";
import { RegisterForm } from "@/components/RegisterForm";
import { Link } from "@/i18n/navigation";

export default async function RegisterPage() {
  const t = await getTranslations("Auth");

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-col justify-center px-6 py-10">
      <div className="rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
        <h1 className="text-xl font-semibold">{t("register.title")}</h1>
        <p className="mt-1 text-sm text-zinc-600">{t("register.subtitle")}</p>

        <div className="mt-6">
          <RegisterForm />
        </div>

        <p className="mt-4 text-sm text-zinc-600">
          {t("register.haveAccount")}{" "}
          <Link className="font-medium text-zinc-900 underline" href="/auth/login">
            {t("register.signIn")}
          </Link>
        </p>
      </div>
    </main>
  );
}

