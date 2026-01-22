"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { getLocale } from "next-intl/server";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) throw new Error("Unauthorized");
  return userId;
}

export async function addTodoAction(formData: FormData) {
  const userId = await requireUserId();
  const locale = await getLocale();

  const text = z
    .string()
    .trim()
    .min(1, "Todo text is required")
    .max(200, "Todo must be 200 characters or less")
    .parse(String(formData.get("text") ?? ""));

  await prisma.todo.create({
    data: {
      text,
      userId,
    },
  });

  revalidatePath(`/${locale}`);
}

export async function toggleTodoAction(id: string, completed: boolean) {
  const userId = await requireUserId();
  const locale = await getLocale();

  await prisma.todo.updateMany({
    where: { id, userId },
    data: { completed },
  });

  revalidatePath(`/${locale}`);
}

export async function updateTodoAction(id: string, text: string) {
  const userId = await requireUserId();
  const locale = await getLocale();

  const nextText = z
    .string()
    .trim()
    .min(1, "Todo text is required")
    .max(200, "Todo must be 200 characters or less")
    .parse(text);

  await prisma.todo.updateMany({
    where: { id, userId },
    data: { text: nextText },
  });

  revalidatePath(`/${locale}`);
}

export async function deleteTodoAction(id: string) {
  const userId = await requireUserId();
  const locale = await getLocale();

  await prisma.todo.deleteMany({
    where: { id, userId },
  });

  revalidatePath(`/${locale}`);
}
