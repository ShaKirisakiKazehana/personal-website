export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[900px] px-8 py-20">
      <h1 className="text-4xl font-semibold tracking-tight text-neutral-900">
        About Me
      </h1>

      <p className="mt-6 text-base leading-7 text-neutral-600">
        I’m Dongjue Xie, a Computer Science student with a strong interest in
        software engineering, systems, and clean, minimal design.
      </p>

      <p className="mt-4 text-base leading-7 text-neutral-600">
        I enjoy building things end-to-end — from understanding the problem,
        designing the structure, to shipping something that works reliably.
      </p>

      <div className="mt-12 grid gap-6 sm:grid-cols-2">
        <InfoCard
          title="Interests"
          items={[
            "Web development",
            "Systems & fundamentals",
            "Clean UI / UX",
            "Practical engineering",
          ]}
        />

        <InfoCard
          title="Currently"
          items={[
            "Building personal projects",
            "Applying for internships",
            "Strengthening CS fundamentals",
          ]}
        />
      </div>
    </main>
  );
}

function InfoCard({
  title,
  items,
}: {
  title: string;
  items: string[];
}) {
  return (
    <div className="rounded-2xl border border-neutral-200 p-6">
      <h2 className="text-sm font-semibold text-neutral-900">
        {title}
      </h2>
      <ul className="mt-4 space-y-2 text-sm text-neutral-600">
        {items.map((item) => (
          <li key={item}>• {item}</li>
        ))}
      </ul>
    </div>
  );
}
