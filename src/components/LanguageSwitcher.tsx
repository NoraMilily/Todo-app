"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale } from "next-intl";

import { locales, type AppLocale } from "@/i18n/routing";

const label: Record<AppLocale, { flag: string; text: string }> = {
  en: { flag: "🇺🇸", text: "ENG" },
  ru: { flag: "🇷🇺", text: "РУС" },
};

function swapLocaleInPath(pathname: string, nextLocale: AppLocale) {
  const segments = pathname.split("/");
  const currentLocale = segments[1] as AppLocale | undefined;
  if (currentLocale && locales.includes(currentLocale)) {
    segments[1] = nextLocale;
    return segments.join("/") || `/${nextLocale}`;
  }
  return `/${nextLocale}${pathname.startsWith("/") ? "" : "/"}${pathname}`;
}

export function LanguageSwitcher() {
  const locale = useLocale() as AppLocale;
  const pathname = usePathname() || "/";

  const current = label[locale];

  return (
    <details className="relative">
      <summary className="flex cursor-pointer list-none items-center gap-2 rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-sm font-medium text-zinc-900 hover:bg-zinc-50">
        <span aria-hidden>{current.flag}</span>
        <span>{current.text}</span>
      </summary>

      <div className="absolute right-0 z-50 mt-2 w-40 overflow-hidden rounded-md border border-zinc-200 bg-white shadow-lg">
        {locales.map((l) => {
          const item = label[l];
          const href = swapLocaleInPath(pathname, l);
          const active = l === locale;
          return (
            <Link
              key={l}
              href={href}
              className={
                "flex items-center gap-2 px-3 py-2 text-sm hover:bg-zinc-50 " +
                (active ? "bg-zinc-50 font-semibold text-zinc-900" : "text-zinc-700")
              }
            >
              <span aria-hidden>{item.flag}</span>
              <span>{item.text}</span>
            </Link>
          );
        })}
      </div>
    </details>
  );
}

