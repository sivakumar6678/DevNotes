export const popularTopics = [
  {
    name: 'HTML',
    description: 'Build semantic structure, accessible layouts, and reliable document foundations.',
    accent: 'bg-orange-500',
  },
  {
    name: 'CSS',
    description: 'Design responsive interfaces with spacing, systems thinking, and polished UI execution.',
    accent: 'bg-amber-400',
  },
  {
    name: 'JavaScript',
    description: 'Understand browser logic, runtime behavior, async flow, and interview-ready fundamentals.',
    accent: 'bg-slate-900',
  },
  {
    name: 'MySQL',
    description: 'Model relational data, write production-friendly queries, and reason about real schemas.',
    accent: 'bg-orange-300',
  },
]

export const featureHighlights = [
  {
    title: 'Layered learning paths',
    description: 'Each concept moves through basic, real-world, production, and interview framing so growth feels progressive instead of fragmented.',
  },
  {
    title: 'Notes built for re-reading',
    description: 'Content is organized like a product knowledge base, making revision faster before projects, interviews, or deep study sessions.',
  },
  {
    title: 'Readable by design',
    description: 'Clear hierarchy, strong code presentation, and focused navigation keep the experience closer to premium docs than a student notebook.',
  },
]

export const categoryGroups = [
  {
    title: 'Frontend',
    items: ['HTML', 'CSS', 'JavaScript'],
  },
  {
    title: 'Data',
    items: ['MySQL'],
  },
]

export const recentNotes = [
  {
    slug: 'closures',
    title: 'Closures',
    topic: 'JavaScript',
    summary: 'Understand persistent scope and why closures keep showing up in real applications and interviews.',
    tags: ['Basic', 'Production', 'Interview'],
  },
]

export const docsNavigation = [
  {
    title: 'JavaScript',
    items: [
      { title: 'Closures', slug: 'closures' },
    ],
  },
]

export const notes = [
  {
    id: 1,
    slug: 'closures',
    title: 'Closures',
    topic: 'JavaScript',
    summary: 'Functions that keep access to the lexical scope where they were created.',
    versions: {
      simple: {
        definition: 'A closure is a function that remembers variables from the place where it was created, even after that outer function has finished running.',
        problem_it_solves: 'Closures help us keep data private and preserve state without depending on global variables.',
        detailed_explanation: 'When one function is created inside another, the inner function can still access the outer function’s variables. If that inner function is returned or used later, JavaScript keeps the needed scope alive. That preserved scope is what we call a closure.',
        core_concepts: [
          { name: 'Lexical scope', explanation: 'A function can access variables based on where it was written in the code.' },
          { name: 'State preservation', explanation: 'A closure can keep values alive between multiple calls.' },
          { name: 'Function factory', explanation: 'Closures are useful when one function creates and returns another function.' },
        ],
        how_it_works: 'The inner function keeps a reference to variables from the outer function, so those values remain available later.',
        syntax: `function createCounter() {
  let count = 0

  return function () {
    count += 1
    return count
  }
}`,
        code_example: `const counter = createCounter()

console.log(counter()) // 1
console.log(counter()) // 2`,
        practical_example: 'Use closures for counters, reusable configuration helpers, and small stateful utilities.',
        real_world_example: 'UI event handlers often rely on closures to remember values from the moment they were created.',
        common_mistakes: ['Confusing closures with copied values instead of referenced scope.', 'Using `var` in loops and expecting separate values per iteration.'],
        best_practices: ['Keep the closed-over state small and intentional.', 'Prefer descriptive factory functions when returning closures.'],
        interview_notes: ['Explain closures through lexical scope first.', 'Use a counter example to show how state persists across calls.'],
      },
      industry: {
        definition: 'A closure is a function bundled with references to its surrounding lexical environment, enabling controlled access to preserved state.',
        problem_it_solves: 'Closures support encapsulation, factory patterns, memoization, and deferred execution without leaking internal implementation details.',
        detailed_explanation: 'In production code, closures are not just theory. They power middleware factories, event handlers, hook behavior, caching helpers, and modular APIs. A function can retain access to bindings from its parent environment, and that makes it possible to create behavior that feels stateful without exposing that state broadly.',
        core_concepts: [
          { name: 'Encapsulation', explanation: 'Closures let us hide internal variables while exposing only a focused API.' },
          { name: 'Deferred execution', explanation: 'Callbacks and async handlers still need access to context that existed earlier.' },
          { name: 'Memory awareness', explanation: 'Anything captured in a closure may stay alive longer, so accidental large captures matter.' },
        ],
        how_it_works: 'The JavaScript runtime keeps the lexical environment reachable as long as an inner function still references it.',
        syntax: `function buildLogger(level) {
  return function log(message) {
    if (level === 'debug') {
      console.debug(message)
    }
  }
}`,
        code_example: `function memoize(fn) {
  const cache = new Map()

  return function (input) {
    if (cache.has(input)) return cache.get(input)
    const result = fn(input)
    cache.set(input, result)
    return result
  }
}`,
        practical_example: 'Closures are great for wrapping dependencies, preserving feature flags, and generating specialized utility functions.',
        real_world_example: 'React callbacks and custom hooks depend heavily on closures, which is why stale state bugs show up in async UI flows.',
        common_mistakes: ['Capturing outdated values in async callbacks.', 'Holding onto unnecessary objects and increasing memory retention.'],
        best_practices: ['Be explicit about what the closure needs.', 'Review async code carefully to avoid stale closure behavior.'],
        interview_notes: ['Connect closures to practical patterns like memoization and private state.', 'Mention tradeoffs such as stale references and memory retention.'],
      },
      interview: {
        definition: 'Closures let a function remember variables from an outer scope after that scope has already executed.',
        problem_it_solves: 'They prove you understand scope, state persistence, and how JavaScript treats functions as first-class values.',
        detailed_explanation: 'Interviewers often use closures to test whether you truly understand lexical scope. The expected answer is usually that an inner function keeps access to outer variables because the runtime preserves the lexical environment.',
        core_concepts: [
          { name: 'Lexical environment', explanation: 'The environment created where a function is defined.' },
          { name: 'Returned function', explanation: 'A closure usually becomes obvious when the inner function is returned.' },
        ],
        how_it_works: 'The inner function still points to outer bindings, so those bindings are available during later execution.',
        syntax: `function outer() {
  const value = 42
  return function inner() {
    return value
  }
}`,
        code_example: `const fn = outer()
console.log(fn()) // 42`,
        practical_example: 'Use a simple counter or private variable example during interviews.',
        real_world_example: 'Debounced handlers, event listeners, and caching helpers all rely on closures.',
        common_mistakes: ['Defining closures without explaining lexical scope.', 'Ignoring loop-related closure pitfalls.'],
        best_practices: ['Answer with a short definition, then give one example.', 'Tie the concept to real use cases after the definition.'],
        interview_notes: ['Keep the explanation crisp and example-driven.', 'Mention why closures are useful, not just what they are.'],
      },
    },
  },
  {
    id: 2,
    slug: 'promises',
    title: 'Promises',
    topic: 'JavaScript',
    summary: 'A cleaner model for asynchronous values, chaining, and failure handling.',
    versions: {
      simple: {
        definition: 'A Promise is an object that represents a future value that may succeed or fail.',
        problem_it_solves: 'Promises organize asynchronous work so the code is easier to read than nested callbacks.',
        detailed_explanation: 'A Promise begins in a pending state and later becomes fulfilled or rejected. We attach `.then()` for success and `.catch()` for errors.',
        core_concepts: [
          { name: 'Pending', explanation: 'The async work has started but not finished yet.' },
          { name: 'Fulfilled', explanation: 'The operation succeeded and returned a value.' },
          { name: 'Rejected', explanation: 'The operation failed and returned an error.' },
        ],
        how_it_works: 'JavaScript runs the async task and updates the Promise state when the task completes.',
        syntax: `const promise = fetch('/api/data')

promise
  .then((response) => response.json())
  .catch((error) => console.error(error))`,
        code_example: `new Promise((resolve) => {
  setTimeout(() => resolve('Done'), 1000)
}).then(console.log)`,
        practical_example: 'Use Promises when calling APIs or handling delayed results.',
        real_world_example: 'Fetching data for dashboards and forms almost always involves Promises.',
        common_mistakes: ['Forgetting to return a Promise inside a `.then()` chain.'],
        best_practices: ['Handle failures with `.catch()` or `try/catch` with `async/await`.'],
        interview_notes: ['Explain the three states and how chaining works.'],
      },
    },
  },
]

export function getAllNotes() {
  return recentNotes
}
