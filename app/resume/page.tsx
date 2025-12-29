export default function AboutPage() {
  return (
    <main className="mx-auto max-w-[1200px] px-8 py-16">
      <h1 className="text-3xl font-semibold text-neutral-900">
        Resume
      </h1>

      <p className="mt-2 text-sm text-neutral-500">
        PDF version
      </p>

      <div className="mt-8 h-[85vh] w-full overflow-hidden rounded-xl border border-neutral-200">
        <iframe
          src="/resume.pdf"
          className="h-full w-full"
        />
      </div>

      <a
        href="/resume.pdf"
        target="_blank"
        className="mt-6 inline-block text-sm text-neutral-600 hover:text-neutral-900"
      >
        Open in new tab →
      </a>
    </main>
  );
}
