export default function LoadingPainel() {
  return (
    <main className="min-h-screen bg-black px-4 py-8 text-white md:px-8">
      <div className="mx-auto max-w-7xl animate-pulse">
        <header className="mb-8">
          <div className="h-4 w-24 rounded bg-zinc-800" />
          <div className="mt-3 h-9 w-52 rounded-lg bg-zinc-800" />
          <div className="mt-3 h-4 w-80 max-w-full rounded bg-zinc-900" />
        </header>

        <section className="mb-6 rounded-2xl border border-zinc-800 bg-zinc-950 p-6">
          <div className="h-4 w-48 rounded bg-zinc-800" />
          <div className="mt-4 h-9 w-40 rounded bg-zinc-800" />
        </section>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="h-[470px] rounded-2xl border border-zinc-800 bg-zinc-950" />

          <section className="rounded-2xl border border-zinc-800 bg-zinc-950 p-6 lg:col-span-2">
            <div className="h-6 w-48 rounded bg-zinc-800" />

            <div className="mt-6 space-y-3">
              {[1, 2, 3, 4].map((item) => (
                <div
                  key={item}
                  className="h-28 rounded-xl border border-zinc-800 bg-black"
                />
              ))}
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}