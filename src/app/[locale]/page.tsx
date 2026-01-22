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

  const todos = await prisma.todo.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return (
    <TodoApp
      displayName={session.user?.displayName ?? session.user?.username ?? session.user?.email ?? ""}
      avatarUrl={session.user?.avatarUrl ?? null}
      todos={todos.map((t) => ({
        id: t.id,
        text: t.text,
        completed: t.completed,
        createdAt: t.createdAt.toISOString(),
      }))}
    />
  );
}

