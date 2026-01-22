"use client";

import { Edit, LogOut } from "lucide-react";
import { useSession, signOut } from "next-auth/react";
import { useTranslations, useLocale } from "next-intl";

import { Link } from "@/i18n/navigation";
import { Avatar } from "@/components/Avatar";

export function ProfileView() {
  const { data: session } = useSession();
  const t = useTranslations("Profile");
  const locale = useLocale();
  if (!session?.user) {
    return null;
  }

  const user = session.user;
  const displayName = user.displayName ?? user.username ?? user.email ?? "User";

  return (
    <div className="mt-4 space-y-6">
      <div className="flex items-center gap-6">
        <Avatar user={user} size="lg" />
        <div className="flex-1">
          <h2 className="text-2xl font-semibold">{displayName}</h2>
          {user.email && (
            <p className="mt-1 text-sm text-zinc-600">{user.email}</p>
          )}
          {user.username && user.username !== displayName && (
            <p className="mt-1 text-sm text-zinc-500">@{user.username}</p>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Link
            href="/profile/edit"
            className="flex items-center gap-2 rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            <Edit className="h-4 w-4" />
            {t("form.edit") || "Edit"}
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
            className="flex items-center gap-2 rounded-md border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-700 hover:bg-red-50"
          >
            <LogOut className="h-4 w-4" />
            {t("form.logout") || "Log out"}
          </button>
        </div>
      </div>
    </div>
  );
}
