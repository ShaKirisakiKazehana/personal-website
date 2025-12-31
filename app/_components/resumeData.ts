// app/_components/resumeData.ts
export type ResumeCard =
  | { id: string; title: string; subtitle?: string; bullets: string[]; tags?: string[] }
  | { id: string; title: string; subtitle?: string; groups: Array<{ label: string; items: string[] }> };

export const resumeCards: ResumeCard[] = [
  {
    id: "summary",
    title: "Professional Summary",
    bullets: [
      "Computer Science student graduating May 2026 with hands-on experience in Python and Java, focusing on backend systems, real-time networking, and client-server architectures.",
      "Worked across frontend detection logic, backend services, and Linux server management in production-style projects, including AR/VR-assisted systems with UX-driven design considerations.",
      "Collaborative problem-solver who values usability, system reliability, and maintainable software design.",
    ],
  },
  {
    id: "education",
    title: "Education",
    subtitle: "Temple University · Philadelphia, PA",
    bullets: ["B.S. Computer Science (Expected May 2026)"],
  },
  {
    id: "newsight",
    title: "Project · NewSight",
    subtitle: "Frontend Detection · Backend · Server Admin",
    tags: ["Python", "FastAPI", "Computer Vision", "Linux"],
    bullets: [
      "Implemented real-time detection logic on the frontend, processing sensor/image input and displaying results for assistive navigation use cases.",
      "Developed backend services using Python (FastAPI) to handle detection requests, data processing, and client-server communication.",
      "Designed and maintained a client-server architecture with reliable data exchange and low-latency response.",
      "Deployed and managed backend services on a Linux server (env setup, service config, runtime monitoring).",
      "Collaborated with a multidisciplinary team to integrate frontend, backend APIs, and detection into one system.",
    ],
  },
  {
    id: "brickbreaker",
    title: "Project · Multiplayer BrickBreaker",
    subtitle: "Logic Developer & Tester",
    tags: ["Python", "PyGame", "Sockets"],
    bullets: [
      "Designed and implemented core game logic (collision, scoring, power-ups, multi-level progression).",
      "Developed real-time multiplayer synchronization using Python sockets to keep host/client game states consistent.",
      "Integrated game logic with PyGame UI and networking modules using a modular, event-driven architecture.",
    ],
  },
  {
    id: "experience",
    title: "Experience",
    bullets: [
      "Technician · TAP Esports Center — Evaluated tools/tech, assembled equipment, troubleshot Windows/network issues, maintained uptime.",
      "Driver · Safeguard Transportation — Maintained reliable daily operations, followed safety & scheduling requirements.",
    ],
  },
  {
    id: "skills",
    title: "Skills",
    groups: [
      { label: "Languages", items: ["Python", "Java", "C", "Kotlin"] },
      { label: "Web/Backend", items: ["FastAPI", "Client-Server Architecture"] },
      { label: "Systems/Tools", items: ["Linux", "Git/GitHub"] },
    ],
  },
  {
    id: "languages",
    title: "Languages",
    bullets: ["English (Fluent)", "Chinese (Native)", "Japanese (Conversational)"],
  },
];
