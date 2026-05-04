import { useState } from 'react'

const ALL_SCHEMA_FIELDS: Record<string, { type: string; description: string }> = {
  definition: { type: 'string', description: 'A concise definition of the topic.' },
  problem_it_solves: { type: 'string', description: 'What problem this concept addresses.' },
  detailed_explanation: { type: 'string', description: 'In-depth multi-paragraph explanation.' },
  core_concepts: { type: 'Array<{name, explanation}>', description: 'Key sub-concepts as a list.' },
  how_it_works: { type: 'string', description: 'Step-by-step mechanism description.' },
  syntax: { type: 'string | Array<{title, language, code}>', description: 'Syntax snippets or blocks.' },
  code_example: { type: 'string | Array<{title, language, code}>', description: 'Code examples with optional language.' },
  practical_example: { type: 'Array<{title, description, code, explanation, language}>', description: 'Worked practical examples.' },
  real_world_example: { type: 'Array<{title, description}>', description: 'Real-world usage scenarios.' },
  common_mistakes: { type: 'string[]', description: 'Pitfalls and common errors.' },
  best_practices: { type: 'string[]', description: 'Recommended patterns and conventions.' },
  interview_notes: { type: 'Array<{question, answer}>', description: 'Q&A pairs for interview prep.' },
}

const VERSION_SCHEMAS: Record<string, { label: string; fields: string[] }> = {
  industry: {
    label: 'Industry',
    fields: Object.keys(ALL_SCHEMA_FIELDS)
  },
  interview: {
    label: 'Interview',
    fields: ['definition', 'interview_notes', 'common_mistakes']
  },
  theory: {
    label: 'Theory',
    fields: ['definition', 'detailed_explanation', 'core_concepts']
  },
  simple: {
    label: 'Simple',
    fields: ['definition', 'code_example']
  },
  revision: {
    label: 'Revision',
    fields: ['core_concepts', 'syntax', 'best_practices']
  },
  realtime: {
    label: 'Real-time',
    fields: ['real_world_example', 'practical_example']
  }
}

export default function SchemaGuide() {
  const [activeVersion, setActiveVersion] = useState<string>('industry')

  const activeFields = VERSION_SCHEMAS[activeVersion].fields.map(key => ({
    key,
    ...ALL_SCHEMA_FIELDS[key]
  }))

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">JSON Schema by Version</h1>
      <p className="text-slate-600 mb-6">
        Different versions require different JSON structures. Select a version below to view its specific schema requirements.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(VERSION_SCHEMAS).map(([id, config]) => (
          <button
            key={id}
            type="button"
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${
              activeVersion === id
                ? 'bg-orange-50 border-brand-orange text-brand-orange'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}
            onClick={() => setActiveVersion(id)}
          >
            {config.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Key</th>
                <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Type</th>
                <th className="py-3 px-4 font-semibold text-slate-700 text-sm">Description</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {activeFields.map((f) => (
                <tr key={f.key} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 px-4">
                    <code className="px-2 py-1 bg-orange-50 text-brand-orange rounded text-xs font-semibold">
                      {f.key}
                    </code>
                  </td>
                  <td className="py-3 px-4">
                    <code className="text-xs text-purple-600 whitespace-nowrap">
                      {f.type}
                    </code>
                  </td>
                  <td className="py-3 px-4 text-sm text-slate-600">
                    {f.description}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
