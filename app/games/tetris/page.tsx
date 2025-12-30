import Tetris from "@/components/Tetris";

export default function TetrisPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold">Tetris</h1>
        <p className="mt-2 opacity-80">Canvas + requestAnimationFrame 俄罗斯方块。</p>

        <div className="mt-6">
          <Tetris />
        </div>
      </div>
    </main>
  );
}
