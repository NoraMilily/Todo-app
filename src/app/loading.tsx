export default function Loading() {
  return (
    <main className="mx-auto w-full max-w-2xl px-6 py-10">
      <div className="animate-pulse space-y-4">
        <div className="h-8 w-40 rounded bg-zinc-200" />
        <div className="h-20 rounded bg-zinc-200" />
        <div className="h-20 rounded bg-zinc-200" />
      </div>
    </main>
  );
}
