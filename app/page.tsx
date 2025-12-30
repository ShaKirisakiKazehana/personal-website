import MatrixRainBg from "@/components/MatrixRainBg";
export default function HomePage() {
  return (
    <>
    <MatrixRainBg
        opacity={0.14}
        fontSize={16}
        columnWidth={28}
        speed={0.2}
        enableOnMobile={true}
        highlightHead={true}
      />
  
      <main className="mx-auto max-w-[1200px] px-8">
        <section className="pt-40">
          <h1 className="text-6xl font-semibold tracking-tight">
            Hi, I’m Dongjue Xie.
          </h1>
  
          <p className="mt-6 text-sm text-neutral-500">
            Computer Science Student · Software Engineer
          </p>
        </section>
      </main>
    </>
  );
}  