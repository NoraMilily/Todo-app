"use client";

import { useMemo, useState, useTransition } from "react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

import {
  addTodoAction,
  deleteTodoAction,
  toggleTodoAction,
  updateTodoAction,
} from "@/app/actions/todos";
import { Avatar } from "@/components/Avatar";

export type TodoDTO = {
  id: string;
  text: string;
  completed: boolean;
  createdAt: string;
};

export function TodoApp({
  displayName,
  todos,
  avatarUrl,
}: {
  displayName: string;
  todos: TodoDTO[];
  avatarUrl?: string | null;
}) {
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const locale = useLocale();
  const t = useTranslations("Todos");

  const remaining = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos],
  );

  const activeCount = useMemo(
    () => todos.filter((t) => !t.completed).length,
    [todos],
  );

  const completedCount = useMemo(
    () => todos.filter((t) => t.completed).length,
    [todos],
  );

  const totalCount = todos.length;

  // Filter todos based on selected filter
  const filteredTodos = useMemo(() => {
    switch (filter) {
      case "active":
        return todos.filter((t) => !t.completed);
      case "completed":
        return todos.filter((t) => t.completed);
      case "all":
      default:
        return todos;
    }
  }, [todos, filter]);

  const user = {
    displayName,
    avatarUrl,
  };

  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <header className="flex items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Avatar user={user} size="md" />
          <div>
            <h1 className="text-2xl font-semibold">{t("title")}</h1>
            <p className="mt-1 text-sm text-zinc-600">
              {t("greeting", { name: displayName })} • {t("remaining", { count: remaining })}
            </p>
          </div>
        </div>
        <button
          onClick={() => signOut({ callbackUrl: `/${locale}/auth/login` })}
          className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
        >
          {t("logout")}
        </button>
      </header>

      <section className="mt-6 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
        <form
          action={addTodoAction}
          onSubmit={() => setError(null)}
          className="flex gap-2"
        >
          <input
            name="text"
            placeholder={t("addPlaceholder")}
            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
          />
          <button
            type="submit"
            disabled={isPending}
            className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {t("add")}
          </button>
        </form>

        {error ? <p className="mt-3 text-sm text-red-600">{error}</p> : null}

        {/* Filter Buttons */}
        {todos.length > 0 && (
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => setFilter("all")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {t("statistics.total")} ({totalCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("active")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === "active"
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {t("statistics.active")} ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilter("completed")}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                filter === "completed"
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-300 bg-white text-zinc-700 hover:bg-zinc-50"
              }`}
            >
              {t("statistics.completed")} ({completedCount})
            </button>
          </div>
        )}

        <div className="mt-4 divide-y divide-zinc-100">
          {filteredTodos.length === 0 ? (
            <p className="py-6 text-center text-sm text-zinc-600">
              {filter === "active"
                ? t("emptyActive", { defaultValue: "Нет активных задач." })
                : filter === "completed"
                ? t("emptyCompleted", { defaultValue: "Нет выполненных задач." })
                : t("empty")}
            </p>
          ) : (
            <AnimatePresence mode="popLayout">
              {filteredTodos.map((todo) => {
                const isEditing = editingId === todo.id;
                return (
                  <motion.div
                    key={todo.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9, y: -10 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.8, y: -10 }}
                    transition={{
                      duration: 0.2,
                      ease: "easeOut",
                    }}
                    className="flex items-start gap-3 py-3"
                  >
                    <input
                      type="checkbox"
                      checked={todo.completed}
                      aria-label={t("toggleCompleted")}
                      onChange={(e) => {
                        setError(null);
                        startTransition(async () => {
                          try {
                            await toggleTodoAction(todo.id, e.target.checked);
                          } catch {
                            setError(t("errors.updateFailed"));
                          }
                        });
                      }}
                      className="mt-1 h-4 w-4"
                    />

                    <div className="flex-1">
                      {isEditing ? (
                        <form
                          className="flex gap-2"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setError(null);
                            startTransition(async () => {
                              try {
                                await updateTodoAction(todo.id, editingText);
                                setEditingId(null);
                                setEditingText("");
                              } catch {
                                setError(t("errors.updateFailed"));
                              }
                            });
                          }}
                        >
                          <input
                            value={editingText}
                            onChange={(e) => setEditingText(e.target.value)}
                            className="flex-1 rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                          />
                          <button
                            type="submit"
                            disabled={isPending}
                            className="rounded-md bg-zinc-900 px-3 py-2 text-sm font-medium text-white disabled:opacity-60"
                          >
                            {t("save")}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null);
                              setEditingText("");
                            }}
                            className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                          >
                            {t("cancel")}
                          </button>
                        </form>
                      ) : (
                        <motion.p
                          className={
                            "text-sm transition-all duration-300 " +
                            (todo.completed
                              ? "text-zinc-400 line-through"
                              : "text-zinc-900")
                          }
                          animate={{
                            textDecorationLine: todo.completed ? "line-through" : "none",
                            opacity: todo.completed ? 0.6 : 1,
                          }}
                          transition={{ duration: 0.3 }}
                        >
                          {todo.text}
                        </motion.p>
                      )}

                      <p className="mt-1 text-xs text-zinc-500">
                        {t("created", {
                          date: new Intl.DateTimeFormat(locale, {
                            dateStyle: "medium",
                            timeStyle: "short",
                          }).format(new Date(todo.createdAt)),
                        })}
                      </p>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setEditingId(todo.id);
                          setEditingText(todo.text);
                        }}
                        className="rounded-md border border-zinc-300 bg-white px-3 py-1.5 text-sm font-medium hover:bg-zinc-50"
                      >
                        {t("edit")}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          startTransition(async () => {
                            try {
                              await deleteTodoAction(todo.id);
                            } catch {
                              setError(t("errors.deleteFailed"));
                            }
                          });
                        }}
                        className="rounded-md border border-red-200 bg-white px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-50"
                      >
                        {t("delete")}
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </section>
    </main>
  );
}
