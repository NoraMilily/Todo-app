import { createNavigation } from "next-intl/navigation";
import { locales, defaultLocale } from "./routing";

export const { Link, redirect, usePathname, useRouter, getPathname } =
  createNavigation({
    locales,
    defaultLocale,
  });

