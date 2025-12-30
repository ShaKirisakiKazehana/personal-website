import CodeFloatBg from "@/components/CodeFloatBg";

export default function AboutPage() {
  return (
    <>
        <CodeFloatBg tone="strong"/>

        <main className="mx-auto max-w-[1200px] px-8 pt-24">
          <h2 className="text-3xl font-semibold">About</h2>
          <p className="mt-6 max-w-xl text-neutral-600">
            I’m a Computer Science student interested in building clean,
            practical software with good UX.
          </p>
        </main>
    </>
  );
}
