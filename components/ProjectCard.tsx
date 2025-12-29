// components/ProjectCard.tsx
import type { Project } from "@/data/projects";

export default function ProjectCard({ project }: { project: Project }) {
  return (
    <div className="rounded-2xl border p-6 hover:bg-neutral-50 transition">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-lg font-semibold">{project.title}</h3>
          <p className="mt-1 text-sm text-neutral-600">{project.tagline}</p>
        </div>
      </div>

      <p className="mt-4 text-sm text-neutral-700 leading-relaxed">
        {project.description}
      </p>

      <div className="mt-4 flex flex-wrap gap-2">
        {project.stack.map((s) => (
          <span
            key={s}
            className="text-xs rounded-full border px-2 py-1 text-neutral-700"
          >
            {s}
          </span>
        ))}
      </div>

      <div className="mt-5 flex gap-3 text-sm">
        {project.links.demo && (
          <a className="underline" href={project.links.demo} target="_blank">
            Live Demo
          </a>
        )}
        {project.links.github && (
          <a className="underline" href={project.links.github} target="_blank">
            GitHub
          </a>
        )}
      </div>
    </div>
  );
}
