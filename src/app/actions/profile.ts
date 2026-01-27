"use server";

import { z } from "zod";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getLocale, getTranslations } from "next-intl/server";
import { writeFile, mkdir, unlink } from "fs/promises";
import { join } from "path";
import { existsSync } from "fs";

import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";

export type UpdateDisplayNameState =
  | { ok: true; displayName?: string; avatarUrl?: string | null }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string };

async function ensureAvatarsDir() {
  const avatarsDir = join(process.cwd(), "public", "avatars");
  if (!existsSync(avatarsDir)) {
    await mkdir(avatarsDir, { recursive: true });
  }
  return avatarsDir;
}

function getFileExtension(filename: string, mimeType?: string): string {
  // Try to get extension from filename
  const filenameExt = filename.split(".").pop()?.toLowerCase();
  if (filenameExt && ["jpg", "jpeg", "png", "gif", "webp", "svg"].includes(filenameExt)) {
    return filenameExt;
  }
  // Fallback to MIME type
  if (mimeType) {
    const mimeMap: Record<string, string> = {
      "image/jpeg": "jpg",
      "image/jpg": "jpg",
      "image/png": "png",
      "image/gif": "gif",
      "image/webp": "webp",
      "image/svg+xml": "svg",
    };
    return mimeMap[mimeType] || "jpg";
  }
  return "jpg";
}

export async function updateDisplayNameAction(
  _prev: UpdateDisplayNameState,
  formData: FormData,
): Promise<UpdateDisplayNameState> {
  try {
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "Profile" });
    const tExtra = await getTranslations({ locale, namespace: "ProfileExtra" });

    const session = await auth();
    const userId = session?.user?.id;
    if (!userId) {
      redirect(`/${locale}/auth/login`);
    }

    // Get current user to check for old avatar
    const currentUser = await prisma.user.findUnique({
      where: { id: userId },
      select: { avatarUrl: true },
    });

    let finalAvatarUrl: string | null | undefined = undefined; // undefined = don't update, null = clear, string = set value

    // Handle file upload
    const avatarFile = formData.get("avatarFile") as File | null;

    // Check if file is actually a File object and has content
    // In Next.js Server Actions, empty file inputs return File with size 0
    if (avatarFile && avatarFile instanceof File && avatarFile.size > 0) {
      // Validate file type
      if (!avatarFile.type.startsWith("image/")) {
        return {
          ok: false,
          fieldErrors: {
            avatarUrl: [tExtra("errors.invalidFileType")],
          },
        };
      }

      // Validate file size (2MB)
      if (avatarFile.size > 2 * 1024 * 1024) {
        return {
          ok: false,
          fieldErrors: {
            avatarUrl: [tExtra("errors.fileTooLarge")],
          },
        };
      }

      try {
        const avatarsDir = await ensureAvatarsDir();
        const extension = getFileExtension(avatarFile.name, avatarFile.type);
        const filename = `${userId}-${Date.now()}.${extension}`;
        const filepath = join(avatarsDir, filename);

        const bytes = await avatarFile.arrayBuffer();
        const buffer = Buffer.from(bytes);
        await writeFile(filepath, buffer);

        finalAvatarUrl = `/avatars/${filename}`;

        // Delete old avatar file if it exists and is a local file
        if (currentUser?.avatarUrl && currentUser.avatarUrl.startsWith("/avatars/")) {
          const oldFilePath = join(process.cwd(), "public", currentUser.avatarUrl);
          try {
            if (existsSync(oldFilePath)) {
              await unlink(oldFilePath);
            }
          } catch (error) {
            // Ignore errors when deleting old file
            console.error("[PROFILE] Failed to delete old avatar file:", error instanceof Error ? error.message : String(error));
          }
        }
      } catch (error) {
        console.error("[PROFILE] Failed to save avatar file:", error instanceof Error ? error.message : String(error));
        return {
          ok: false,
          formError: tExtra("errors.uploadFailed"),
        };
      }
    }

    // Handle URL input (only if no file was uploaded, or prioritize file)
    const avatarUrlInput = String(formData.get("avatarUrl") ?? "").trim();
    if (avatarUrlInput && finalAvatarUrl === undefined) {
      // Validate URL
      try {
        new URL(avatarUrlInput);
        finalAvatarUrl = avatarUrlInput;
      } catch {
        return {
          ok: false,
          fieldErrors: {
            avatarUrl: [tExtra("errors.invalidUrl")],
          },
        };
      }
    }

    // Get displayName from form
    const displayNameInput = String(formData.get("displayName") ?? "").trim();

    const schema = z.object({
      displayName: z.string().trim().max(50).optional(),
    });

    const parsed = schema.safeParse({
      displayName: displayNameInput || undefined,
    });

    if (!parsed.success) {
      return { ok: false, fieldErrors: parsed.error.flatten().fieldErrors };
    }

    // If avatar is being cleared (set to null) and old avatar was a local file, delete it
    if (finalAvatarUrl === null && currentUser?.avatarUrl && currentUser.avatarUrl.startsWith("/avatars/")) {
      const oldFilePath = join(process.cwd(), "public", currentUser.avatarUrl);
      try {
        if (existsSync(oldFilePath)) {
          await unlink(oldFilePath);
        }
      } catch (error) {
        // Ignore errors when deleting old file
        console.error("[PROFILE] Failed to delete old avatar file:", error instanceof Error ? error.message : String(error));
      }
    }

    // Prepare update data - always update displayName if provided, and avatarUrl if changed
    const updateData: {
      displayName?: string;
      avatarUrl?: string | null;
    } = {};

    // Update displayName if provided and not empty
    // displayName field is always in the form, so we check if it has a value
    if (displayNameInput.length > 0) {
      updateData.displayName = displayNameInput;
    }

    // Update avatarUrl if a change was requested (finalAvatarUrl is not undefined)
    if (finalAvatarUrl !== undefined) {
      updateData.avatarUrl = finalAvatarUrl;
    }

    // If nothing to update, return current data (no error, just no changes)
    if (Object.keys(updateData).length === 0) {
      const currentUserData = await prisma.user.findUnique({
        where: { id: userId },
        select: {
          displayName: true,
          avatarUrl: true,
        },
      });
      return {
        ok: true,
        displayName: currentUserData?.displayName ?? undefined,
        avatarUrl: currentUserData?.avatarUrl ?? null,
      };
    }

    // Update user in database
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData as { displayName?: string; avatarUrl?: string | null },
      select: {
        displayName: true,
        avatarUrl: true,
      },
    });

    // Prepare response first - ensure it's serializable
    const response: UpdateDisplayNameState = {
      ok: true,
      displayName: updatedUser.displayName || undefined,
      avatarUrl: updatedUser.avatarUrl ?? null,
    };

    // Revalidate paths AFTER preparing response but before returning
    // This ensures response is ready before any potential side effects
    try {
      revalidatePath(`/${locale}/profile`);
      revalidatePath(`/${locale}`);
      revalidatePath(`/${locale}/`, "layout");
    } catch (revalidateError) {
      console.error("[PROFILE] Error during revalidatePath:", revalidateError instanceof Error ? revalidateError.message : String(revalidateError));
      // Don't fail the update if revalidation fails
    }

    return response;
  } catch (error) {
    console.error("[PROFILE UPDATE] Failed to update profile:", error instanceof Error ? error.message : String(error));
    const locale = await getLocale();
    const tExtra = await getTranslations({ locale, namespace: "ProfileExtra" });
    return {
      ok: false,
      formError: tExtra("errors.uploadFailed") || "Failed to update profile",
    };
  }
}

