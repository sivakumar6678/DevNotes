export const noteSections = [
  { key: 'definition', title: 'Definition', id: 'definition' },
  { key: 'problem_it_solves', title: 'Problem It Solves', id: 'problem-it-solves' },
  { key: 'detailed_explanation', title: 'Detailed Explanation', id: 'detailed-explanation' },
  { key: 'core_concepts', title: 'Core Concepts', id: 'core-concepts' },
  { key: 'how_it_works', title: 'How It Works', id: 'how-it-works' },
  { key: 'syntax', title: 'Syntax', id: 'syntax', isCode: true },
  { key: 'code_example', title: 'Code Example', id: 'code-example', isCode: true },
  { key: 'practical_example', title: 'Practical Example', id: 'practical-example' },
  { key: 'real_world_example', title: 'Real World Example', id: 'real-world-example' },
  { key: 'common_mistakes', title: 'Common Mistakes', id: 'common-mistakes' },
  { key: 'best_practices', title: 'Best Practices', id: 'best-practices' },
  { key: 'interview_notes', title: 'Interview Notes', id: 'interview-notes' },
]

function isNonEmptyString(value) {
  return typeof value === 'string' && value.trim().length > 0
}

function isNonEmptyArray(value) {
  return Array.isArray(value) && value.length > 0
}

export default function NoteContent({ version = {} }) {
  return (
    <article className="max-w-4xl">
      {noteSections.map((section) => {
        const value = version[section.key]
        if (value == null) {
          return null
        }

        if (section.key === 'core_concepts') {
          if (!isNonEmptyArray(value)) return null
          return (
            <section key={section.key} id={section.id} className="scroll-mt-32 border-b border-slate-200 py-4 last:border-b-0">
              <h2 className="font-display text-lg font-semibold text-brand-ink">{section.title}</h2>
              <ul className="mt-4 space-y-3 pl-5 text-base leading-7 text-slate-700">
                {value
                  .filter((item) => item && (isNonEmptyString(item.name) || isNonEmptyString(item.explanation)))
                  .map((item, idx) => (
                    <li key={`${item.name || 'concept'}:${idx}`}>
                      {isNonEmptyString(item.name) ? <strong className="text-brand-ink">{item.name}:</strong> : null}{' '}
                      {isNonEmptyString(item.explanation) ? item.explanation : ''}
                    </li>
                  ))}
              </ul>
            </section>
          )
        }

        if (['common_mistakes', 'best_practices', 'interview_notes'].includes(section.key)) {
          if (!isNonEmptyArray(value)) return null
          return (
            <section key={section.key} id={section.id} className="scroll-mt-32 border-b border-slate-200 py-4 last:border-b-0">
              <h2 className="font-display text-lg font-semibold text-brand-ink">{section.title}</h2>
              <ul className="mt-4 space-y-3 pl-5 text-base leading-7 text-slate-700">
                {value.filter((item) => isNonEmptyString(item)).map((item, idx) => (
                  <li key={`${section.key}:${idx}`}>{item}</li>
                ))}
              </ul>
            </section>
          )
        }

        return (
          <section key={section.key} id={section.id} className="scroll-mt-32 border-b border-slate-200 py-4 last:border-b-0">
            <h2 className="font-display text-lg font-semibold text-brand-ink">{section.title}</h2>
            {section.isCode ? (
              <pre className="mt-4 overflow-x-auto rounded bg-gray-900 p-4 text-sm text-white">
                <code>{isNonEmptyString(value) ? value : ''}</code>
              </pre>
            ) : (
              <p className="mt-4 text-base leading-8 text-slate-700">{isNonEmptyString(value) ? value : String(value)}</p>
            )}
          </section>
        )
      })}
    </article>
  )
}
