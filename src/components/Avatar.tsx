"use client";

import type { Session } from "next-auth";

export type AvatarUser = {
  id?: string;
  displayName?: string | null;
  username?: string | null;
  email?: string | null;
  name?: string | null;
  avatarUrl?: string | null;
};

type AvatarSize = "sm" | "md" | "lg";

const sizeClasses: Record<AvatarSize, string> = {
  sm: "h-8 w-8 text-sm",
  md: "h-10 w-10 text-base",
  lg: "h-16 w-16 text-lg",
};

interface AvatarProps {
  user: AvatarUser;
  size?: AvatarSize;
  onClick?: () => void;
  previewUrl?: string | null;
  className?: string;
}

export function Avatar({
  user,
  size = "md",
  onClick,
  previewUrl,
  className = "",
}: AvatarProps) {
  const displayName =
    user?.displayName ?? user?.username ?? user?.email ?? user?.name ?? "";
  const initial = displayName.trim().charAt(0).toUpperCase() || "?";
  const avatarUrl = user?.avatarUrl || previewUrl;

  const baseClasses = `flex items-center justify-center overflow-hidden rounded-full bg-black font-bold text-white shadow-sm transition ${
    onClick ? "cursor-pointer hover:scale-105 hover:shadow-md" : ""
  } ${sizeClasses[size]} ${className}`;

  const content = avatarUrl ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={avatarUrl}
      alt={displayName || "Avatar"}
      className="h-full w-full object-cover"
      onError={(e) => {
        // Fallback to initial if image fails to load
        const target = e.target as HTMLImageElement;
        const parent = target.parentElement;
        if (parent) {
          target.style.display = "none";
          if (!parent.querySelector("span")) {
            const span = document.createElement("span");
            span.textContent = initial;
            span.className = "flex h-full w-full items-center justify-center";
            parent.appendChild(span);
          }
        }
      }}
    />
  ) : (
    <span className="flex h-full w-full items-center justify-center">{initial}</span>
  );

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={baseClasses}>
        {content}
      </button>
    );
  }

  return <div className={baseClasses}>{content}</div>;
}
