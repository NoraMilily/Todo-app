import { notFound } from "next/navigation";
import { getMessages, getTranslations } from "next-intl/server";
import { NextIntlClientProvider } from "next-intl";

import { auth } from "@/lib/auth";
import { NextAuthSessionProvider } from "@/components/SessionProvider";
import { PageTransition } from "@/components/PageTransition";
import { locales, type AppLocale } from "@/i18n/routing";
import { Header } from "@/components/Header";

export default async function LocaleLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}>) {
  const { locale } = await params;
  if (!locales.includes(locale as AppLocale)) notFound();

  const session = await auth();
  const messages = await getMessages();
  const t = await getTranslations("Nav");

  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      <NextAuthSessionProvider session={session}>
        <Header appName={t("appName")} />
        <PageTransition>{children}</PageTransition>
      </NextAuthSessionProvider>
    </NextIntlClientProvider>
  );
}

