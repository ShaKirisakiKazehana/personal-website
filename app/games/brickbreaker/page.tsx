import BrickBreaker from "@/components/BrickBreaker";

export default function BrickBreakerPage() {
  return (
    <main className="min-h-[calc(100vh-64px)] px-4 py-10">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-2xl md:text-3xl font-semibold">Brick Breaker</h1>
        <p className="mt-2 opacity-80">
          A small arcade game built with Canvas + requestAnimationFrame.
        </p>

        <div className="mt-6">
          <BrickBreaker />
        </div>
      </div>
    </main>
  );
}
