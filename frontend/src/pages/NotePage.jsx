import { useParams } from 'react-router-dom'
import Sidebar from '../components/Sidebar'
import TableOfContents from '../components/TableOfContents'
import VersionTabs from '../components/VersionTabs'
import NoteContent from '../components/NoteContent'
import NotFound from './NotFound'

const note = {
  slug: 'closures',
  topic: 'JavaScript',
  title: 'Closures in JavaScript',
  versions: {
    industry: {
      definition:
        'A closure is a function bundled with references to its surrounding lexical environment, allowing code to retain access to state after the outer function has finished executing.',
      problem_it_solves:
        'Closures solve the need for private state, deferred execution, and configurable reusable behavior without leaking implementation details into the global scope.',
      detailed_explanation:
        'In production code, closures show up anywhere logic needs to remember context. Event handlers, factory functions, memoization helpers, and hooks all depend on closures to preserve the values they were created with. This lets us create small, focused APIs while keeping internal state encapsulated.',
      core_concepts: [
        {
          name: 'Lexical scope',
          explanation:
            'A function can access variables from the scope in which it was defined, not just where it is called.',
        },
        {
          name: 'Encapsulation',
          explanation:
            'Closures help expose only the behavior we want while keeping supporting state private and controlled.',
        },
        {
          name: 'State preservation',
          explanation:
            'Captured variables remain available across multiple invocations, which makes closures useful for counters, caches, and reusable utilities.',
        },
      ],
      how_it_works:
        'When JavaScript creates an inner function, it keeps a reference to the surrounding bindings that function uses. As long as the inner function can still be reached, that lexical environment stays alive.',
      syntax: `function createCounter() {
  let count = 0

  return function increment() {
    count += 1
    return count
  }
}`,
      code_example: `const counter = createCounter()

console.log(counter()) // 1
console.log(counter()) // 2
console.log(counter()) // 3`,
      practical_example:
        'A common practical use is building configurable helpers. For example, a logger factory can capture environment settings once and return a reusable function for the rest of the app.',
      real_world_example:
        'React event handlers, debounced search callbacks, analytics wrappers, and memoization utilities all rely on closures to remember the values they were created with.',
      common_mistakes: [
        'Capturing stale values in asynchronous callbacks and assuming they will update automatically.',
        'Retaining large objects inside closures longer than needed, which can increase memory usage.',
      ],
      best_practices: [
        'Capture only the values a closure truly needs.',
        'Prefer clear factory function names so the purpose of the preserved state is obvious.',
      ],
      interview_notes: [
        'Define closures through lexical scope first, then explain why they matter in real code.',
        'Use one small example like a counter, and mention stale closure issues as an advanced production detail.',
      ],
    },
  },
}

export default function NotePage() {
  const { slug } = useParams()

  if (slug && slug !== note.slug) {
    return <NotFound message="The note you are looking for could not be found." />
  }

  const version = 'industry'
  const content = note.versions.industry
  const breadcrumb = note.topic ? `${note.topic} / ${note.title}` : note.title

  return (
    <div className="space-y-6">
      <div className="w-full">
        <VersionTabs selectedVersion={version} />
      </div>

      <div className="mt-[80px] grid gap-6 lg:grid-cols-[300px_minmax(0,1fr)_240px]">
        <Sidebar />

        <div className="min-w-0">
          <div className="brand-panel px-6 py-6">
            <div className="mx-auto max-w-3xl">
              <header className="border-b border-slate-200 pb-6">
                <div className="mb-5 h-1 w-24 rounded-full bg-gradient-to-r from-orange-500 via-amber-400 to-orange-200" />
                <p className="brand-label">{breadcrumb}</p>
                <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight text-brand-ink sm:text-5xl">
                  {note.title}
                </h1>
                <p className="mt-4 text-lg leading-8 text-brand-muted">
                  Read the same concept through multiple layers so the explanation matches where you are right now.
                </p>
              </header>

              <div className="pt-6">
                <NoteContent version={content} />
              </div>
            </div>
          </div>
        </div>

        <TableOfContents content={content} />
      </div>
    </div>
  )
}
