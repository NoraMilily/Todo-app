"use client";

import { useActionState, useRef, useState, useEffect, useCallback } from "react";
import { useFormStatus } from "react-dom";
import { useTranslations } from "next-intl";
import { useSession } from "next-auth/react";
import { useRouter } from "@/i18n/navigation";

import type { UpdateDisplayNameState } from "@/app/actions/profile";
import { updateDisplayNameAction } from "@/app/actions/profile";
import { Avatar } from "@/components/Avatar";

const initialState: UpdateDisplayNameState = { ok: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  const t = useTranslations("Profile");
  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
    >
      {pending ? t("form.saving") : t("form.save")}
    </button>
  );
}

export function ProfileForm({
  initialDisplayName,
  initialAvatarUrl,
}: {
  initialDisplayName: string;
  initialAvatarUrl?: string | null;
}) {
  const { data: session, update } = useSession();
  const router = useRouter();
  const [state, formAction] = useActionState(updateDisplayNameAction, initialState);

  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);
  // Use ref to track if we've already processed a successful update to prevent infinite loops
  const hasProcessedSuccess = useRef(false);
  const t = useTranslations("Profile");
  const tExtra = useTranslations("ProfileExtra");

  // Get current user data from session for avatar display
  const currentUser = session?.user || {
    displayName: initialDisplayName,
    avatarUrl: initialAvatarUrl,
  };

  // Update session after successful save and redirect to profile view
  // Use useCallback to memoize the update function to prevent unnecessary re-renders
  const handleSuccessfulUpdate = useCallback(async () => {
    if (!update) {
      return;
    }

    try {
      // Get updated data from server action response
      // In NextAuth beta, update() might not trigger JWT callback properly
      // So we'll pass the data directly from server action response
      const updatedData = state.ok && "displayName" in state ? {
        user: {
          displayName: state.displayName,
          avatarUrl: state.avatarUrl,
        },
      } : null;

      // Call update() with data from server action response
      // This should update session directly without needing JWT callback
      await update(updatedData || {});

      // Wait a bit to ensure session is fully updated
      await new Promise(resolve => setTimeout(resolve, 200));

      // Redirect to profile view after successful update
      router.push("/profile");
    } catch (error) {
      console.error("[PROFILE] Failed to update session:", error instanceof Error ? error.message : String(error));
    }
  }, [update, router, state]);

  useEffect(() => {
    // Only process success once per state.ok change to prevent infinite loops
    // Check if state.ok is true (which means it's the success type with displayName/avatarUrl)
    if (state.ok && !hasProcessedSuccess.current) {
      hasProcessedSuccess.current = true;
      // Reset preview and file selection after successful save
      setPreviewUrl(null);
      setSelectedFile(null);
      // Call update and redirect - but only after we confirm the update was successful
      // The state.ok === true means the server action returned successfully
      handleSuccessfulUpdate();
    }

    // Reset the flag when state.ok becomes false (e.g., on new form submission)
    if (!state.ok) {
      hasProcessedSuccess.current = false;
    }
  }, [state.ok, handleSuccessfulUpdate]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setFileError(null);

    if (file) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        setFileError(tExtra("errors.invalidFileType"));
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      // Validate file size (2MB)
      if (file.size > 2 * 1024 * 1024) {
        setFileError(tExtra("errors.fileTooLarge"));
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
        setSelectedFile(null);
        setPreviewUrl(null);
        return;
      }
      // Store the selected file
      setSelectedFile(file);
      // Clear URL input when file is selected
      if (urlInputRef.current) {
        urlInputRef.current.value = "";
      }
      // Create preview using URL.createObjectURL for immediate display
      const objectUrl = URL.createObjectURL(file);
      setPreviewUrl(objectUrl);
    } else {
      // If file is cleared, reset preview and file selection
      setSelectedFile(null);
      setPreviewUrl(null);
    }
  };

  // Cleanup object URL when component unmounts or preview changes
  useEffect(() => {
    return () => {
      if (previewUrl && previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  const handleUrlChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const url = e.target.value.trim();
    setFileError(null);

    if (url) {
      // Try to set preview if it's a valid URL
      try {
        new URL(url);
        setPreviewUrl(url);
        // Clear file input when URL is entered
        if (fileInputRef.current) {
          fileInputRef.current.value = "";
        }
      } catch {
        // Invalid URL, reset preview
        setPreviewUrl(null);
      }
    } else {
      setPreviewUrl(null);
    }
  };

  const handleAvatarClick = () => {
    fileInputRef.current?.click();
  };

  return (
    <form
      action={formAction}
      className="mt-4 space-y-4"
    >
      {state.ok ? (
        <p className="rounded-md border border-green-200 bg-green-50 px-3 py-2 text-sm text-green-800">
          {t("saved")}
        </p>
      ) : null}

      <div className="space-y-3">
        <div className="flex items-start gap-4">
          <Avatar
            user={session?.user || currentUser}
            size="lg"
            onClick={handleAvatarClick}
            previewUrl={previewUrl}
          />
          <div className="flex-1 space-y-3">
            <div>
              <input
                ref={fileInputRef}
                type="file"
                name="avatarFile"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
              >
                {tExtra("uploadFromComputer")}
              </button>
              {fileError && (
                <p className="mt-1 text-sm text-red-600">{fileError}</p>
              )}
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("fields.avatarUrl")}
              </label>
              <input
                ref={urlInputRef}
                name="avatarUrl"
                type="url"
                defaultValue={initialAvatarUrl ?? ""}
                placeholder={tExtra("orEnterImageUrl")}
                onChange={handleUrlChange}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
              {state.ok === false && state.fieldErrors?.avatarUrl?.[0] ? (
                <p className="mt-1 text-sm text-red-600">{state.fieldErrors.avatarUrl[0]}</p>
              ) : null}
            </div>
            <p className="text-xs text-zinc-500">{tExtra("squareImageHelp")}</p>
          </div>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-sm font-medium">
          {t("fields.displayName")}
        </label>
        <input
          name="displayName"
          defaultValue={initialDisplayName}
          className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
        />
        {state.ok === false && state.fieldErrors?.displayName?.[0] ? (
          <p className="mt-1 text-sm text-red-600">{state.fieldErrors.displayName[0]}</p>
        ) : null}
      </div>

      {state.ok === false && state.formError ? (
        <p className="text-sm text-red-600">{state.formError}</p>
      ) : null}

      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => router.push("/profile")}
          className="rounded-md border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
        >
          {t("form.back")}
        </button>
        <SubmitButton />
      </div>
    </form>
  );
}

