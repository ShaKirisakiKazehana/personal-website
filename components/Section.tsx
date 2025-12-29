// components/Section.tsx
export default function Section({
    title,
    children,
  }: {
    title: string;
    children: React.ReactNode;
  }) {
    return (
      <section className="py-10">
        <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
        <div className="mt-4">{children}</div>
      </section>
    );
  }
  