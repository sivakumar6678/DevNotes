import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const PROMPTS: Record<string, { label: string; prompt: string }> = {
  industry: {
    label: 'Industry',
    prompt: `Context: I am creating an "Industry" guide for developers about [TOPIC].

Task: Convert the following raw notes into a strictly valid JSON object. Extract the core architectural usage, production considerations, and best practices.

Schema Required:
{
  "problem_it_solves": "What problem this concept addresses in production.",
  "how_it_works": "Step-by-step mechanism description.",
  "practical_example": [
    {
      "title": "Example Title",
      "description": "...",
      "code": "...",
      "explanation": "...",
      "language": "javascript"
    }
  ],
  "best_practices": ["Best practice 1", "Best practice 2"]
}

Instructions: Do not include markdown formatting. Just return the raw JSON.`
  },
  interview: {
    label: 'Interview',
    prompt: `Context: I am creating an "Interview" prep guide for developers about [TOPIC].

Task: Convert the following raw notes into a strictly valid JSON object. Extract the definition, common interview questions, and mistakes to avoid.

Schema Required:
{
  "definition": "A concise definition of the topic.",
  "interview_notes": [
    {
      "question": "Potential interview question",
      "answer": "Clear, concise answer"
    }
  ],
  "common_mistakes": ["Mistake 1", "Mistake 2"]
}

Instructions: Do not include markdown formatting. Just return the raw JSON.`
  },
  theory: {
    label: 'Theory',
    prompt: `Context: I am creating a "Theory" guide for developers about [TOPIC].

Task: Convert the following raw notes into a strictly valid JSON object. Extract the definition, a deep multi-paragraph explanation, and key sub-concepts.

Schema Required:
{
  "definition": "A concise definition of the topic.",
  "detailed_explanation": "In-depth multi-paragraph explanation.",
  "core_concepts": [
    {
      "name": "Concept name",
      "explanation": "Detailed explanation"
    }
  ]
}

Instructions: Do not include markdown formatting. Just return the raw JSON.`
  },
  simple: {
    label: 'Simple',
    prompt: `Context: I am creating a "Simple" introductory guide for developers about [TOPIC].

Task: Convert the following raw notes into a strictly valid JSON object. Keep things extremely beginner-friendly.

Schema Required:
{
  "definition": "A concise, beginner-friendly definition of the topic.",
  "code_example": [
    {
      "title": "Basic Example",
      "language": "javascript",
      "code": "// Simple code example"
    }
  ]
}

Instructions: Do not include markdown formatting. Just return the raw JSON.`
  },
  revision: {
    label: 'Revision',
    prompt: `Context: I am creating a "Revision" summary for developers about [TOPIC].

Task: Convert the following raw notes into a strictly valid JSON object. Extract just the most important facts for a quick refresher.

Schema Required:
{
  "core_concepts": [
    {
      "name": "Concept name",
      "explanation": "Brief explanation"
    }
  ],
  "syntax": [
    {
      "title": "Basic Syntax",
      "language": "javascript",
      "code": "..."
    }
  ],
  "best_practices": ["Best practice 1", "Best practice 2"]
}

Instructions: Do not include markdown formatting. Just return the raw JSON.`
  },
  realtime: {
    label: 'Real-time',
    prompt: `Context: I am creating a "Real-time" / Real-world usage guide for developers about [TOPIC].

Task: Convert the following raw notes into a strictly valid JSON object. Focus on where and how this is actually used in real projects.

Schema Required:
{
  "real_world_example": [
    {
      "title": "Use Case Title",
      "description": "How it is used in the real world"
    }
  ],
  "practical_example": [
    {
      "title": "Example Title",
      "description": "...",
      "code": "...",
      "explanation": "...",
      "language": "javascript"
    }
  ]
}

Instructions: Do not include markdown formatting. Just return the raw JSON.`
  }
}

export default function PromptGuide() {
  const [activeVersion, setActiveVersion] = useState<string>('industry')
  const [copied, setCopied] = useState(false)

  const activePrompt = PROMPTS[activeVersion].prompt

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(activePrompt)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error('Failed to copy', err)
    }
  }

  return (
    <div className="max-w-4xl mx-auto py-8 px-6">
      <h1 className="text-2xl font-bold text-slate-900 mb-2">AI Prompt by Version</h1>
      <p className="text-slate-600 mb-6 leading-relaxed">
        Select a version below to get the optimized AI prompt. Copy the template, replace the bracketed <code>[TOPIC]</code> placeholder, and paste it along with your raw content into your preferred LLM.
      </p>

      <div className="flex flex-wrap gap-2 mb-6">
        {Object.entries(PROMPTS).map(([id, config]) => (
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
        <div className="bg-slate-50 px-4 py-3 border-b border-slate-200 flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Prompt Template</span>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-md hover:bg-slate-50 hover:text-slate-900 transition-colors"
          >
            {copied ? <Check size={14} className="text-green-500" /> : <Copy size={14} />}
            {copied ? 'Copied!' : 'Copy Prompt'}
          </button>
        </div>
        <div className="p-4 bg-slate-900 overflow-x-auto text-sm">
          <pre className="text-slate-300 font-mono leading-relaxed whitespace-pre-wrap">
            <code>{activePrompt}</code>
          </pre>
        </div>
      </div>
      
      <div className="mt-6 bg-blue-50 border border-blue-100 rounded-xl p-5">
        <h3 className="text-sm font-bold text-blue-900 mb-2">Tips for success</h3>
        <ul className="list-disc list-inside text-sm text-blue-800 space-y-1">
          <li>Make sure to replace <code>[TOPIC]</code> with the actual topic name.</li>
          <li>Append your raw notes or documentation directly at the end of the prompt.</li>
          <li>If the AI adds markdown blocks (like <code>\`\`\`json</code>), just copy the content inside the block.</li>
        </ul>
      </div>
    </div>
  )
}
