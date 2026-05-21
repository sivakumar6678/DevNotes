import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const PROMPTS: Record<string, { label: string; prompt: string }> = {
  industry: {
    label: 'Industry',
    prompt: `Convert the following developer learning note into structured JSON for the VelStack learning platform.

IMPORTANT:
The platform already uses a section-based schema.
Preserve compatibility with the existing structure.
Do NOT redesign the schema.

---

# JSON Schema

{
"definition": "",
"problem_it_solves": "",
"detailed_explanation": "",
"core_concepts": [],
"how_it_works": "",
"syntax": [],
"code_example": [],
"practical_example": [],
"real_world_example": [],
"common_mistakes": [],
"best_practices": [],
"interview_notes": []
}

---

# Section Rules

## definition

* Short and clear explanation
* Beginner-friendly

---

## problem_it_solves

Can be:

* simple string
  OR
* rich structured content if needed

If content contains:

* multiline points
* flow structures
* arrows
* nested explanations
* diagrams

then use:

{
"type": "rich",
"blocks": []
}

Supported block types:

* paragraph
* bullets
* numbered_list
* diagram
* callout

---

## detailed_explanation

Can be:

* plain string
  OR
* rich structured content

Use rich structure when content includes:

* diagrams
* nested lists
* multiline formatting
* architecture flows
* ASCII structures
* step-by-step flows

---

## core_concepts

Format:

{
"name": "",
"explanation": ""
}

If explanation contains complex formatting:

* nested lists
* diagrams
* multiline flows

then explanation can become:

{
"type": "rich",
"blocks": []
}

---

## syntax

Format:

{
"title": "",
"language": "",
"code": ""
}

Rules:

* ONLY code inside code field
* No explanation mixed with code

---

## code_example

Format:

{
"title": "",
"language": "",
"code": ""
}

---

## practical_example

Format:

{
"title": "",
"description": "",
"code": "",
"explanation": ""
}

If explanation contains structured content:

* diagrams
* nested bullets
* multiline formatting

allow rich structure.

---

## real_world_example

Format:

{
"title": "",
"description": ""
}

---

## common_mistakes

Array of strings.

---

## best_practices

Array of strings.

---

## interview_notes

Format:

{
"question": "",
"answer": ""
}

Answer may use rich structure if needed.

---

# Rich Block Structure

Use ONLY when necessary.

Example:

{
"type": "rich",
"blocks": [
{
"type": "paragraph",
"content": "The browser parses HTML."
},
{
"type": "diagram",
"content": "HTML\n  ↓\nParser\n  ↓\nDOM Tree"
},
{
"type": "bullets",
"items": [
{
"text": "Browser receives HTML",
"depth": 0
},
{
"text": "Parser creates DOM",
"depth": 1
}
]
}
]
}

---

# Supported Rich Block Types

## paragraph

{
"type": "paragraph",
"content": ""
}

---

## bullets

{
"type": "bullets",
"items": [
{
"text": "",
"depth": 0
}
]
}

Depth:

* 0 = main point
* 1 = nested point
* 2 = deep nested point

---

## numbered_list

{
"type": "numbered_list",
"items": []
}

---

## diagram

Use for:

* ASCII diagrams
* arrow flows
* architecture structures
* indentation-based visual flows

Examples:

* →
* ↓
* |
* ├
* └
* +---
* step chains

Format:

{
"type": "diagram",
"content": ""
}

IMPORTANT:
Preserve ALL whitespace, indentation, arrows, and line breaks exactly.

Never flatten diagram content.

---

## callout

{
"type": "callout",
"variant": "tip",
"content": ""
}

Variants:

* tip
* warning
* info

---

# Global Rules

* Preserve all whitespace and indentation for diagrams
* Preserve nested list hierarchy
* Preserve multiline formatting
* Do NOT flatten structured content into one paragraph
* Do NOT merge separate blocks together
* Do NOT remove arrows or flow symbols
* Keep code separate from explanations
* Use arrays wherever multiple items exist
* Maintain readability and clean structure
* Output ONLY valid JSON
* Do NOT use markdown backticks
* Do NOT add explanations outside JSON

---

# Backward Compatibility Rule

IMPORTANT:

If content is simple:

* keep existing plain string structure

Use rich blocks ONLY when content genuinely requires structured formatting.

Do NOT overuse rich blocks unnecessarily.

---

Now convert the provided content into this exact structured format.
`
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
            className={`px-4 py-2 text-sm font-medium rounded-lg border transition-colors ${activeVersion === id
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
