const sections = [
  {
    title: 'What this platform is',
    description:
      'VelStack is a focused learning platform for developer notes, designed to turn core subjects into structured, high-clarity learning paths.',
  },
  {
    title: 'Why it exists',
    description:
      'Many resources are either scattered, too shallow, or too noisy. VelStack is built to make concepts easier to revisit, compare, and apply without friction.',
  },
  {
    title: 'How it is different',
    description:
      'Instead of one explanation for everyone, topics are framed across basic, real-world, production, and interview contexts. That makes the same note useful at different stages of growth.',
  },
  {
    title: 'Who it is for',
    description:
      'Students building foundations, self-taught developers organizing knowledge, and engineers revisiting concepts before interviews or production work.',
  },
]

export default function About() {
  return (
    <div className="space-y-10">
      <section className="brand-panel p-8">
        <p className="brand-label">About VelStack</p>
        <h1 className="mt-4 max-w-3xl font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
          A calmer, more practical way to study developer concepts.
        </h1>
        <p className="mt-4 max-w-3xl text-lg leading-8 text-brand-muted">
          The goal is simple: make learning feel product-grade, approachable for beginners, and still useful for working developers.
        </p>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        {sections.map((section) => (
          <article key={section.title} className="rounded-[2rem] border border-brand-border bg-white p-7 shadow-brand">
            <h2 className="font-display text-2xl font-semibold tracking-tight text-brand-ink">{section.title}</h2>
            <p className="mt-3 leading-7 text-brand-muted">{section.description}</p>
          </article>
        ))}
      </section>
    </div>
  )
}
