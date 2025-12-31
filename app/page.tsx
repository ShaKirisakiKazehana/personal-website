import FullPageScroll from "./_components/FullPageScroll";
import BackgroundSwitcher from "./_components/BackgroundSwitcher";
import GamesSection from "./_components/GamesSection";
import ResumeDeck from "./_components/ResumeDeck";
import { glass, cn } from "./_styles/glass";

export default function HomePage() {
  return (
    <>
      <BackgroundSwitcher />
  
      <FullPageScroll>
        {/* Page 1 */}
        <section id="home" data-snap-section data-section="home" className="snap-section">
          <main className="mx-auto max-w-[1200px] px-8 w-full">
            <div className="section-inner pt-24">
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
        <section id="about" data-snap-section data-section="about" className="snap-section">
          <main className="mx-auto max-w-[1200px] px-8 w-full">
            <div className="section-inner pt-16">
              <h2 className="text-4xl font-semibold tracking-tight">About</h2>
              <p className="mt-6 max-w-xl text-sm text-neutral-600">
                I’m a Computer Science student interested in building clean, practical software with good UX.
              </p>

              <div className="mt-10 grid gap-4 sm:grid-cols-2">
                <div className={cn(glass.card, "p-5")}>
                  <div className="text-sm font-semibold">Currently</div>
                  <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                    <li>• Shipping small projects fast (Next.js / TypeScript)</li>
                    <li>• Polishing UI/UX details & motion</li>
                    <li>• Keeping things simple, readable, and reliable</li>
                  </ul>
                </div>
                <div className={cn(glass.card, "p-5")}>
                  <div className="text-sm font-semibold">Focus</div>
                  <p className="mt-3 text-sm text-neutral-600">
                    Frontend engineering, interactive experiences, and backend APIs when needed.
                  </p>
                </div>
              </div>

              <p className="mt-12 text-sm text-neutral-500">Scroll down for games ↓</p>
            </div>
          </main>
        </section>

        {/* Page 3 */}
        <GamesSection />

        {/* Page 4 */}
        <section id="resume" data-snap-section data-section="resume" className="snap-section">
          {/* ResumeDeck 内部自己已经做了 max-width / padding / sticky header */}
          <ResumeDeck />
        </section>

      </FullPageScroll>
    </>
  );
}  