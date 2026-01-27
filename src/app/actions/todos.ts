"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLocale, getTranslations } from "next-intl/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

const todoPrioritySchema = z.enum(["IMPORTANT", "MEDIUM", "EASY"], {
  errorMap: () => ({ message: "Invalid priority value" }),
});

export type AddTodoState =
  | { ok: true }
  | { ok: false; fieldErrors?: Record<string, string[]>; formError?: string };

export async function addTodoAction(
  _prev: AddTodoState,
  formData: FormData,
): Promise<AddTodoState> {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "Todos" });

    // Validate and parse text
    const textSchema = z
      .string()
      .trim()
      .min(1, t("errors.textRequired", { defaultValue: "Todo text is required" }))
      .max(200, t("errors.textMaxLength", { defaultValue: "Todo must be 200 characters or less" }));

    const textResult = textSchema.safeParse(String(formData.get("text") ?? ""));
    if (!textResult.success) {
      return {
        ok: false,
        fieldErrors: { text: textResult.error.errors.map((e) => e.message) },
      };
    }
    const text = textResult.data;

    // Validate and parse due date
    const dueDateString = String(formData.get("dueDate") ?? "").trim();
    
    if (!dueDateString) {
      return {
        ok: false,
        fieldErrors: { dueDate: [t("errors.dueDateRequired")] },
      };
    }

    // Date input returns YYYY-MM-DD format, convert to Date
    // Use UTC to avoid timezone issues
    const dueDateSchema = z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("errors.invalidDateFormat", { defaultValue: "Invalid date format" }))
      .transform((str) => {
        // Parse YYYY-MM-DD to Date object using UTC to avoid timezone issues
        const [year, month, day] = str.split("-").map(Number);
        // Create date in UTC to ensure consistent comparison
        return new Date(Date.UTC(year, month - 1, day));
      })
      .pipe(
        z.date().refine(
          (date) => {
            // Ensure date is today or in the future (not in the past)
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const dateToCheck = new Date(date);
            dateToCheck.setUTCHours(0, 0, 0, 0);
            // Allow today (>=) as per requirements
            return dateToCheck >= today;
          },
          { message: t("errors.dueDatePast") }
        )
      );

    const dueDateResult = dueDateSchema.safeParse(dueDateString);
    if (!dueDateResult.success) {
      return {
        ok: false,
        fieldErrors: { dueDate: dueDateResult.error.errors.map((e) => e.message) },
      };
    }
    const dueDate = dueDateResult.data;

    // Validate and parse priority
    const priorityString = String(formData.get("priority") ?? "MEDIUM");
    
    const priorityResult = todoPrioritySchema.safeParse(priorityString);
    if (!priorityResult.success) {
      return {
        ok: false,
        fieldErrors: { priority: [t("errors.priorityInvalid")] },
      };
    }
    const priority = priorityResult.data;

    // Create todo in database
    await prisma.todo.create({
      data: {
        text,
        dueDate,
        priority,
        userId,
      },
    });

    revalidatePath(`/${locale}`);
    return { ok: true };
  } catch (error) {
    // Handle unexpected errors
    console.error("[ADD_TODO] Failed to create todo:", error instanceof Error ? error.message : String(error));
    
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "Todos" });
    
    // Return user-friendly error message
    let errorMessage = t("errors.createFailed", { defaultValue: "Failed to create todo. Please try again." });
    
    if (error instanceof Error) {
      const errorMsg = error.message;
      
      // Check for specific error patterns
      if (errorMsg.includes("prisma generate") || errorMsg.includes("schema mismatch")) {
        errorMessage = "Database schema is out of sync. Please contact administrator.";
      } else if (errorMsg.includes("Unknown field") || errorMsg.includes("does not exist")) {
        errorMessage = "Database schema mismatch. Please run 'npm run prisma:generate'.";
      } else if (errorMsg.includes("Unauthorized")) {
        errorMessage = "You are not authorized to perform this action. Please log in again.";
      }
    }
    
    return {
      ok: false,
      formError: errorMessage,
    };
  }
}

export async function toggleTodoAction(id: string, completed: boolean) {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();

    await prisma.todo.updateMany({
      where: { id, userId },
      data: { completed },
    });

    revalidatePath(`/${locale}`);
  } catch (error) {
    console.error("[TOGGLE_TODO] Failed to toggle todo:", error instanceof Error ? error.message : String(error));
    throw error; // Re-throw to be handled by client
  }
}

export async function updateTodoAction(
  id: string,
  text: string,
  dueDate: string,
  priority: "IMPORTANT" | "MEDIUM" | "EASY"
) {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();
    const t = await getTranslations({ locale, namespace: "Todos" });

    // Validate and parse text
    const textSchema = z
      .string()
      .trim()
      .min(1, t("errors.textRequired", { defaultValue: "Todo text is required" }))
      .max(200, t("errors.textMaxLength", { defaultValue: "Todo must be 200 characters or less" }));

    const textResult = textSchema.safeParse(text);
    if (!textResult.success) {
      throw new Error(textResult.error.errors[0]?.message ?? "Invalid text");
    }
    const validatedText = textResult.data;

    // Validate and parse due date
    const dueDateString = dueDate.trim();
    if (!dueDateString) {
      throw new Error(t("errors.dueDateRequired"));
    }

    // Date input returns YYYY-MM-DD format, convert to Date
    const dueDateSchema = z
      .string()
      .regex(/^\d{4}-\d{2}-\d{2}$/, t("errors.invalidDateFormat", { defaultValue: "Invalid date format" }))
      .transform((str) => {
        const [year, month, day] = str.split("-").map(Number);
        return new Date(Date.UTC(year, month - 1, day));
      })
      .pipe(
        z.date().refine(
          (date) => {
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const dateToCheck = new Date(date);
            dateToCheck.setUTCHours(0, 0, 0, 0);
            return dateToCheck >= today;
          },
          { message: t("errors.dueDatePast") }
        )
      );

    const dueDateResult = dueDateSchema.safeParse(dueDateString);
    if (!dueDateResult.success) {
      throw new Error(dueDateResult.error.errors[0]?.message ?? "Invalid due date");
    }
    const validatedDueDate = dueDateResult.data;

    // Validate priority
    const priorityResult = todoPrioritySchema.safeParse(priority);
    if (!priorityResult.success) {
      throw new Error(t("errors.priorityInvalid"));
    }
    const validatedPriority = priorityResult.data;

    // Update the todo
    await prisma.todo.updateMany({
      where: { id, userId },
      data: {
        text: validatedText,
        dueDate: validatedDueDate,
        priority: validatedPriority,
      },
    });

    revalidatePath(`/${locale}`);
  } catch (error) {
    console.error("[UPDATE_TODO] Failed to update todo:", error instanceof Error ? error.message : String(error));
    throw error; // Re-throw to be handled by client
  }
}

export async function deleteTodoAction(id: string) {
  try {
    const userId = await requireUserId();
    const locale = await getLocale();

    await prisma.todo.deleteMany({
      where: { id, userId },
    });

    revalidatePath(`/${locale}`);
  } catch (error) {
    console.error("[DELETE_TODO] Failed to delete todo:", error instanceof Error ? error.message : String(error));
    throw error; // Re-throw to be handled by client
  }
}
