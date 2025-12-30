import Link from "next/link";

export default function PlayPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold">Play</h1>
        <p className="mt-2 opacity-80">Mini games & interactive demos.</p>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <Link
            href="/games/brickbreaker"
            className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-5"
          >
          <Link
          href="/games/tetris"
          className="rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 p-5"
        >
          <div className="font-semibold">Tetris</div>
          <div className="text-sm opacity-75 mt-1">Classic blocks · rotate · clear lines</div>
        </Link>
        
            <div className="font-semibold">Brick Breaker</div>
            <div className="text-sm opacity-75 mt-1">Canvas arcade game · score/levels</div>
          </Link>
        </div>
      </div>
    </main>
  );
}
