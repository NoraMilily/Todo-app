"use client";

import { NotebookPen } from "lucide-react";
import { useSession } from "next-auth/react";

import { Link } from "@/i18n/navigation";
import { LanguageSwitcher } from "@/components/LanguageSwitcher";
import { Avatar } from "@/components/Avatar";

function AvatarSkeleton() {
  return (
    <div className="h-10 w-10 animate-pulse rounded-full bg-zinc-200" />
  );
}

export function Header({ appName }: { appName: string }) {
  const { data: session, status } = useSession();

  return (
    <header className="border-b border-zinc-200 bg-white">
      <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2 rounded-md px-2 py-1 text-zinc-900 hover:bg-zinc-50">
          <NotebookPen className="h-8 w-8" />
          <span className="text-base font-semibold">{appName}</span>
        </Link>

        <div className="flex items-center gap-4">
          <LanguageSwitcher />
          {status === "loading" ? (
            <AvatarSkeleton />
          ) : session?.user ? (
            <Link href="/profile">
              <Avatar user={session.user} size="md" />
            </Link>
          ) : null}
        </div>
      </div>
    </header>
  );
}

