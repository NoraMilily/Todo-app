import { redirect } from "next/navigation";

import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { TodoApp } from "@/components/TodoApp";

export default async function HomePage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

  const session = await auth();
  const userId = session?.user?.id;

  if (!userId) {
    redirect(`/${locale}/auth/login`);
  }

  const todosRaw = await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  // Type assertion needed until Prisma Client is regenerated with new schema
  const todos = todosRaw as unknown as Array<{
    id: string;
    text: string;
    completed: boolean;
    dueDate?: Date | null;
    priority?: "IMPORTANT" | "MEDIUM" | "EASY" | null;
    createdAt: Date;
  }>;

  return (
    <TodoApp
      displayName={session.user?.displayName ?? session.user?.username ?? session.user?.email ?? ""}
      avatarUrl={session.user?.avatarUrl ?? null}
      todos={todos.map((t) => {
        // Handle old records that may not have dueDate or priority
        const dueDate = t.dueDate
          ? t.dueDate
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days from now
        const priority = t.priority ?? "MEDIUM";

        return {
          id: t.id,
          text: t.text,
          completed: t.completed,
          dueDate: dueDate.toISOString(),
          priority: priority,
          createdAt: t.createdAt.toISOString(),
        };
      })}
    />
  );
}

