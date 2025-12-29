// data/projects.ts
export type Project = {
  slug: string;
  title: string;
  tagline: string;
  description: string;
  stack: string[];
  links: {
    github?: string;
    demo?: string;
  };
};

export const projects: Project[] = [
  {
    slug: "project-one",
    title: "Project One",
    tagline: "One-line value proposition of the project",
    description:
      "2–3 sentences: what problem it solves, what you built, and what impact it had.",
    stack: ["Next.js", "TypeScript", "Tailwind"],
    links: {
      github: "https://github.com/YOUR_USERNAME/REPO",
      demo: "https://example.com",
    },
  },
  {
    slug: "project-two",
    title: "Project Two",
    tagline: "Another strong project, ideally with a demo",
    description:
      "Explain your contribution and a technical highlight (performance, architecture, reliability).",
    stack: ["Python", "FastAPI", "PostgreSQL"],
    links: {
      github: "https://github.com/YOUR_USERNAME/REPO",
    },
  },
  {
    slug: "project-three",
    title: "Project Three",
    tagline: "A team project or something impressive",
    description:
      "Focus on what YOU did and quantify results if possible (latency, accuracy, users, cost).",
    stack: ["React", "Node.js", "SQL"],
    links: {},
  },
  {
    slug: "project-four",
    title: "Project Four",
    tagline: "Optional fourth card",
    description:
      "If you only want 3 cards, you can delete this one from data/projects.ts.",
    stack: ["Java", "JUnit", "GitHub Actions"],
    links: {},
  },
];
