export default function HomePage() {
  return (
    <main className="min-h-[calc(100vh-72px)]">
      {/* Hero */}
      <section className="mx-auto max-w-[1200px] px-8 pt-28 md:pt-36">
        <h1 className="text-5xl font-semibold tracking-tight text-neutral-900 md:text-6xl lg:text-7xl">
          Hi, I’m Dongjue Xie.
        </h1>

        <p className="mt-6 text-sm text-neutral-500 md:text-base">
          Computer Science Student · Software Engineer
        </p>

        {/* Optional quick actions */}
        <div className="mt-10 flex flex-wrap items-center gap-4">
          <a
            href="/resume"
            className="inline-flex items-center rounded-full border border-neutral-200 px-5 py-2.5 text-sm font-medium text-neutral-900 transition hover:border-neutral-300 hover:bg-neutral-50"
          >
            View Resume
          </a>

          <a
            href="/about"
            className="inline-flex items-center rounded-full px-5 py-2.5 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 hover:text-neutral-900"
          >
            About Me
          </a>
        </div>

        {/* Subtle divider / hint */}
        <div className="mt-24 border-t border-neutral-200" />
      </section>

      {/* Content preview section (minimal, you can expand later) */}
      <section className="mx-auto max-w-[1200px] px-8 py-14">
        <div className="grid gap-10 md:grid-cols-3">
          <div className="md:col-span-1">
            <h2 className="text-sm font-semibold text-neutral-900">
              Currently
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-600">
              Building projects in web + systems, and applying for internships.
              I like clean UI, solid fundamentals, and shipping.
            </p>
          </div>

          <div className="md:col-span-2">
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                title="Projects"
                desc="A few things I’ve built — web, tools, and experiments."
                href="/about"
              />
              <Card
                title="Resume"
                desc="Experience, education, and skills in one page."
                href="/resume"
              />
              <Card
                title="Contact"
                desc="Email / links — easy ways to reach me."
                href="/about"
              />
              <Card
                title="Notes"
                desc="Small write-ups, learnings, and bookmarks."
                href="/about"
              />
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}

function Card({
  title,
  desc,
  href,
}: {
  title: string;
  desc: string;
  href: string;
}) {
  return (
    <a
      href={href}
      className="group rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-md"
    >
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
        <span className="text-neutral-300 transition group-hover:text-neutral-500">
          →
        </span>
      </div>
      <p className="mt-3 text-sm leading-6 text-neutral-600">{desc}</p>
    </a>
  );
}
