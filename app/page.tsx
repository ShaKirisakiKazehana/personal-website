import MatrixRainBg from "@/components/MatrixRainBg";
import Link from "next/link";
import FullPageScroll from "./_components/FullPageScroll";
export default function HomePage() {
  return (
    <>
    <MatrixRainBg
        opacity={0.14}
        fontSize={16}
        columnWidth={28}
        speed={0.2}
        enableOnMobile={true}
        highlightHead={true}
      />
  
      <FullPageScroll>
        {/* Page 1 */}
        <section data-snap-section className="snap-section">
          <main className="mx-auto max-w-[1200px] px-8 w-full">
            <div className="pt-40">
              <h1 className="text-6xl font-semibold tracking-tight">
                Hi, I’m Dongjue Xie.
              </h1>

              <p className="mt-6 text-sm text-neutral-500">
                Computer Science Student · Software Engineer
              </p>

              <p className="mt-10 text-sm text-neutral-500">
                Scroll down to continue ↓
              </p>
            </div>
          </main>
        </section>

        {/* Page 2 */}
        <section data-snap-section className="snap-section">
          <main className="mx-auto max-w-[1200px] px-8 w-full">
            <div className="pt-24">
              <h2 className="text-4xl font-semibold tracking-tight">About</h2>
              <p className="mt-6 text-sm text-neutral-600 max-w-[70ch]">
                A quick intro, what I’m building, and what I’m learning right now.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/about"
                  className="inline-flex items-center rounded-full border border-black/15 px-5 py-2 text-sm font-medium hover:bg-black hover:text-white transition"
                >
                  Open /about
                </Link>
                <Link
                  href="/resume"
                  className="inline-flex items-center rounded-full border border-black/15 px-5 py-2 text-sm font-medium hover:bg-black hover:text-white transition"
                >
                  Open /resume
                </Link>
              </div>

              <p className="mt-12 text-sm text-neutral-500">Scroll down for games ↓</p>
            </div>
          </main>
        </section>

        {/* Page 3 */}
        <section data-snap-section className="snap-section">
          <main className="mx-auto max-w-[1200px] px-8 w-full">
            <div className="pt-24">
              <h2 className="text-4xl font-semibold tracking-tight">Games</h2>
              <p className="mt-6 text-sm text-neutral-600 max-w-[70ch]">
                Mini games you can play directly in the browser.
              </p>

              <div className="mt-10 flex flex-wrap gap-4">
                <Link
                  href="/games"
                  className="inline-flex items-center rounded-full border border-black/15 px-5 py-2 text-sm font-medium hover:bg-black hover:text-white transition"
                >
                  Open /games
                </Link>
              </div>
            </div>
          </main>
        </section>
      </FullPageScroll>
    </>
  );
}  