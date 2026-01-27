"use client";

import { useMemo, useState, useTransition, useActionState, useEffect, useRef } from "react";
import { signOut } from "next-auth/react";
import { useLocale, useTranslations } from "next-intl";
import { AnimatePresence, motion } from "framer-motion";

import {
  addTodoAction,
  deleteTodoAction,
  toggleTodoAction,
  updateTodoAction,
  type AddTodoState,
} from "@/app/actions/todos";
import { Avatar } from "@/components/Avatar";

export type TodoPriority = "IMPORTANT" | "MEDIUM" | "EASY";

export type TodoDTO = {
  id: string;
  text: string;
  completed: boolean;
  dueDate: string;
  priority: TodoPriority;
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
  const [addTodoState, addTodoFormAction] = useActionState(addTodoAction, { ok: false });
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [editingDueDate, setEditingDueDate] = useState("");
  const [editingPriority, setEditingPriority] = useState<TodoPriority>("MEDIUM");
  const [filter, setFilter] = useState<"all" | "active" | "completed">("all");
  const locale = useLocale();
  const t = useTranslations("Todos");
  const formRef = useRef<HTMLFormElement>(null);

  // Reset form after successful creation
  useEffect(() => {
    if (addTodoState.ok && formRef.current) {
      formRef.current.reset();
    }
  }, [addTodoState.ok]);

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
          ref={formRef}
          action={addTodoFormAction}
          onSubmit={(e) => {
            // Client-side validation for better UX
            const form = e.currentTarget;
            const dueDateInput = form.elements.namedItem("dueDate") as HTMLInputElement;
            
            if (!dueDateInput.value) {
              e.preventDefault();
              return;
            }
            
            // Validate date: must be today or in the future
            // Use UTC to match server-side validation
            const selectedDate = new Date(dueDateInput.value + "T00:00:00Z");
            const today = new Date();
            today.setUTCHours(0, 0, 0, 0);
            const dateToCheck = new Date(selectedDate);
            dateToCheck.setUTCHours(0, 0, 0, 0);
            
            if (dateToCheck < today) {
              e.preventDefault();
              return;
            }
          }}
          className="space-y-4"
        >
          <div>
            <label className="mb-1 block text-sm font-medium">
              {t("fields.text")}
            </label>
            <input
              name="text"
              placeholder={t("addPlaceholder")}
              required
              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
            />
            {addTodoState.ok === false && addTodoState.fieldErrors?.text?.[0] ? (
              <p className="mt-1 text-sm text-red-600">
                {addTodoState.fieldErrors.text[0]}
              </p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("fields.dueDate")} <span className="text-red-500">*</span>
              </label>
              <input
                name="dueDate"
                type="date"
                required
                min={new Date().toISOString().split("T")[0]}
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              />
              {addTodoState.ok === false && addTodoState.fieldErrors?.dueDate?.[0] ? (
                <p className="mt-1 text-sm text-red-600">
                  {addTodoState.fieldErrors.dueDate[0]}
                </p>
              ) : null}
            </div>

            <div>
              <label className="mb-1 block text-sm font-medium">
                {t("fields.priority")}
              </label>
              <select
                name="priority"
                defaultValue="MEDIUM"
                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
              >
                <option value="IMPORTANT">{t("priorities.IMPORTANT")}</option>
                <option value="MEDIUM">{t("priorities.MEDIUM")}</option>
                <option value="EASY">{t("priorities.EASY")}</option>
              </select>
              {addTodoState.ok === false && addTodoState.fieldErrors?.priority?.[0] ? (
                <p className="mt-1 text-sm text-red-600">
                  {addTodoState.fieldErrors.priority[0]}
                </p>
              ) : null}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60"
          >
            {t("add")}
          </button>
        </form>

        {addTodoState.ok === false && addTodoState.formError ? (
          <p className="mt-3 text-sm text-red-600">{addTodoState.formError}</p>
        ) : null}

        {error ? (
          <p className="mt-3 text-sm text-red-600">{error}</p>
        ) : null}

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
                          className="space-y-3"
                          onSubmit={(e) => {
                            e.preventDefault();
                            setError(null);
                            
                            // Client-side validation
                            if (!editingDueDate) {
                              setError(t("errors.dueDateRequired"));
                              return;
                            }
                            
                            // Validate date: must be today or in the future
                            const selectedDate = new Date(editingDueDate + "T00:00:00Z");
                            const today = new Date();
                            today.setUTCHours(0, 0, 0, 0);
                            const dateToCheck = new Date(selectedDate);
                            dateToCheck.setUTCHours(0, 0, 0, 0);
                            
                            if (dateToCheck < today) {
                              setError(t("errors.dueDatePast"));
                              return;
                            }
                            
                            startTransition(async () => {
                              try {
                                await updateTodoAction(
                                  todo.id,
                                  editingText,
                                  editingDueDate,
                                  editingPriority
                                );
                                setEditingId(null);
                                setEditingText("");
                                setEditingDueDate("");
                                setEditingPriority("MEDIUM");
                              } catch {
                                setError(t("errors.updateFailed"));
                              }
                            });
                          }}
                        >
                          <div className="space-y-2">
                            <input
                              value={editingText}
                              onChange={(e) => setEditingText(e.target.value)}
                              placeholder={t("fields.text")}
                              required
                              className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                            />
                            
                            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                              <input
                                type="date"
                                value={editingDueDate}
                                onChange={(e) => setEditingDueDate(e.target.value)}
                                min={new Date().toISOString().split("T")[0]}
                                required
                                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                              />
                              
                              <select
                                value={editingPriority}
                                onChange={(e) => setEditingPriority(e.target.value as TodoPriority)}
                                className="w-full rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm outline-none focus:border-zinc-900"
                              >
                                <option value="IMPORTANT">{t("priorities.IMPORTANT")}</option>
                                <option value="MEDIUM">{t("priorities.MEDIUM")}</option>
                                <option value="EASY">{t("priorities.EASY")}</option>
                              </select>
                            </div>
                          </div>
                          
                          <div className="flex gap-2">
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
                                setEditingDueDate("");
                                setEditingPriority("MEDIUM");
                              }}
                              className="rounded-md border border-zinc-300 bg-white px-3 py-2 text-sm font-medium hover:bg-zinc-50"
                            >
                              {t("cancel")}
                            </button>
                          </div>
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

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-zinc-500">
                        <span>
                          {t("created", {
                            date: new Intl.DateTimeFormat(locale, {
                              dateStyle: "medium",
                              timeStyle: "short",
                            }).format(new Date(todo.createdAt)),
                          })}
                        </span>
                        <span>•</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-medium ${
                            todo.priority === "IMPORTANT"
                              ? "bg-red-100 text-red-700"
                              : todo.priority === "MEDIUM"
                              ? "bg-yellow-100 text-yellow-700"
                              : "bg-green-100 text-green-700"
                          }`}
                        >
                          {t("priorities." + todo.priority)}
                        </span>
                        <span>•</span>
                        <span>
                          {t("dueDate", {
                            date: new Intl.DateTimeFormat(locale, {
                              dateStyle: "medium",
                            }).format(new Date(todo.dueDate)),
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setError(null);
                          setEditingId(todo.id);
                          setEditingText(todo.text);
                          // Set dueDate in YYYY-MM-DD format for date input
                          const dueDate = new Date(todo.dueDate);
                          setEditingDueDate(dueDate.toISOString().split("T")[0]);
                          setEditingPriority(todo.priority);
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
