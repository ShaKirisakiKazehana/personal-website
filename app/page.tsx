// app/page.tsx
import { profile } from "@/data/profile";
import { projects } from "@/data/projects";
import Section from "@/components/Section";
import ProjectCard from "@/components/ProjectCard";

export default function Home() {
  return (
    <main className="min-h-screen">
      <div className="max-w-5xl mx-auto px-6 py-14">
        {/* HERO */}
        <div className="rounded-3xl border p-8">
          <p className="text-sm text-neutral-600">{profile.location}</p>
          <h1 className="mt-2 text-3xl font-bold tracking-tight">
            {profile.name}
          </h1>
          <p className="mt-2 text-neutral-700">{profile.title}</p>
          <p className="mt-4 max-w-2xl text-sm text-neutral-700 leading-relaxed">
            {profile.bio}
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            <a
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 transition"
              href={profile.resumeUrl}
              target="_blank"
            >
              Download Resume
            </a>
            <a
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 transition"
              href={`mailto:${profile.email}`}
            >
              Email
            </a>
            <a
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 transition"
              href={profile.github}
              target="_blank"
            >
              GitHub
            </a>
            <a
              className="rounded-xl border px-4 py-2 text-sm hover:bg-neutral-50 transition"
              href={profile.linkedin}
              target="_blank"
            >
              LinkedIn
            </a>
          </div>
        </div>

        {/* SKILLS */}
        <Section title="Skills">
          <div className="flex flex-wrap gap-2">
            {profile.skills.map((s) => (
              <span
                key={s}
                className="rounded-full border px-3 py-1 text-sm text-neutral-700"
              >
                {s}
              </span>
            ))}
          </div>
        </Section>

        {/* FEATURED PROJECTS */}
        <Section title="Featured Projects">
          <div className="grid gap-4 md:grid-cols-2">
            {projects.slice(0, 3).map((p) => (
              <ProjectCard key={p.slug} project={p} />
            ))}
          </div>
        </Section>

        {/* CONTACT */}
        <Section title="Contact">
          <div className="rounded-2xl border p-6 text-sm text-neutral-700">
            <p>
              Best way to reach me:{" "}
              <a className="underline" href={`mailto:${profile.email}`}>
                {profile.email}
              </a>
            </p>
          </div>
        </Section>

        <footer className="py-10 text-xs text-neutral-500">
          © {new Date().getFullYear()} {profile.name}. Built with Next.js.
        </footer>
      </div>
    </main>
  );
}
