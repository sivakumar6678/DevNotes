import { useState } from 'react'
import { Copy, Check } from 'lucide-react'

const PROMPTS: Record<string, { label: string; prompt: string }> = {
  industry: {
    label: 'Industry',
    prompt: `Convert the following developer learning note into structured JSON for the VelStack learning platform.

CRITICAL REQUIREMENT:
You MUST return a COMPLETE, valid JSON object.
NEVER truncate, cut off, or leave any section unfinished.
ALL arrays and objects MUST be properly closed.
ALL strings MUST be properly terminated.
If content is long, prioritize completeness over detail — shorten explanations before cutting them off.

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

# RICH BLOCK DECISION RULE

BEFORE using a rich block, ask:
Does this content have tables, diagrams, or deeply nested structure that a plain string cannot represent?

YES → use rich block
NO  → use plain string or plain array

Rich blocks are appropriate for:
* tables (comparison tables, feature matrices, markdown tables from source)
* ASCII diagrams and execution flows
* nested bullet hierarchies (depth > 1)
* multiline architecture flows with arrows
* step-by-step structured processes

Rich blocks are NOT needed for:
* short one-paragraph explanations
* simple flat bullet lists
* one-line descriptions
* single-concept explanations
* any content that reads fine as plain text

WRONG — unnecessary rich block:
"definition": { "type": "rich", "blocks": [{ "type": "paragraph", "content": "React is a UI library." }] }

CORRECT — plain string:
"definition": "React is a UI library."

WRONG — unnecessary rich block for simple list:
"best_practices": { "type": "rich", "blocks": [{ "type": "bullets", "items": [{"text": "Use const", "depth": 0}] }] }

CORRECT — plain array:
"best_practices": ["Use const wherever possible"]

---

# Section Rules

## definition

* Plain string only
* One concise sentence — beginner-friendly
* No rich blocks

---

## problem_it_solves

Plain string OR rich object.

Use rich block ONLY IF the content has tables, diagrams, or deeply nested structure.
For normal multi-point explanations, use a plain string with line breaks.

If rich block needed:
{
"type": "rich",
"blocks": []
}

---

## detailed_explanation

Plain string OR rich object.

PARAGRAPH READABILITY RULE:
Split long explanations into multiple shorter paragraphs.
Each paragraph block should cover ONE idea.
Do NOT write 5+ sentence walls of text in a single paragraph block.
Keep paragraphs concise enough to read on a phone screen.

Use rich block when content has:
* diagrams showing execution flow
* nested lists with depth > 1
* comparison tables
* architecture flows with arrows
* step-by-step processes with visual structure

For a plain explanation, use a plain string.

---

## core_concepts

Format:
{
"name": "",
"explanation": ""
}

explanation can be a plain string OR a rich object when it contains tables/diagrams/nested structure.
Short concept explanations MUST remain plain strings.

---

## how_it_works

Plain string OR rich object.

DIAGRAM USAGE RULE:
Use a diagram block when the content describes:
* execution flow (A → B → C)
* operator precedence ordering
* short-circuit evaluation path
* browser rendering pipeline
* request → response architecture
* event loop steps

Do NOT use diagram for:
* simple inline mentions of arrows
* one-step descriptions
* any flow that reads clearly as a sentence

---

## syntax

Format:
{
"title": "",
"language": "",
"code": ""
}

ONLY code in the code field. No explanation mixed with code.

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
"explanation": "",
"language": ""
}

explanation can be a plain string OR rich object if it has tables/diagrams.

---

## real_world_example

Format:
{
"title": "",
"description": ""
}

---

## common_mistakes

Plain string array OR rich object.

Use array of strings when mistakes are simple one-line items:
["Avoid mutating state directly", "Do not block the main thread"]

Use rich block ONLY when mistakes require table comparison or deeply nested explanation:
{
"type": "rich",
"blocks": [
{
"type": "table",
"headers": ["Mistake", "Problem", "Fix"],
"rows": [
["Mutating state", "Causes unexpected re-renders", "Use setState"],
["Blocking thread", "Freezes UI", "Use async/await"]
]
}
]
}

---

## best_practices

Plain string array OR rich object.

Same rules as common_mistakes.
Prefer plain array unless a table or diagram is genuinely necessary.

---

## interview_notes

Format:
{
"question": "",
"answer": ""
}

answer can be a plain string OR rich object if it contains tables/diagrams.
Short answers MUST remain plain strings.

---

# Rich Block Structure Rules

EVERY rich block MUST follow this exact structure:
{
"type": "rich",
"blocks": []
}

NEVER:
* omit the blocks array
* set blocks to null
* use blocks: {} (object instead of array)
* leave blocks undefined

If a rich block has no content, use an empty array: "blocks": []

---

# Supported Rich Block Types

## paragraph

{
"type": "paragraph",
"content": ""
}

content MUST be a non-null string.
Split long content across multiple paragraph blocks (one idea per block).

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

Depth: 0 = main, 1 = nested, 2 = deep nested
items MUST be an array. Never null.
text MUST be a string. Never null.

---

## numbered_list

{
"type": "numbered_list",
"items": []
}

items MUST be an array of strings. Never null.

---

## diagram

{
"type": "diagram",
"content": ""
}

Use ONLY for visual flows, architecture structures, or ASCII art.
Preserve ALL whitespace, arrows (→ ↓ ├ └), and line breaks exactly.
Do NOT use diagram for simple inline references.
Do NOT use diagram for one-step descriptions.

---

## callout

{
"type": "callout",
"variant": "tip",
"content": ""
}

variant must be exactly one of: tip | warning | info

---

## table

{
"type": "table",
"headers": ["Col1", "Col2"],
"rows": [
["value1", "value2"]
]
}

TABLE STABILITY RULES — STRICTLY ENFORCED:
* headers MUST be an array of strings — never null, never a string
* rows MUST be an array of arrays — never null, never a flat array
* EVERY row MUST have EXACTLY the same number of cells as the headers array
* If a cell has no value, use an empty string "" — NEVER omit the cell
* NEVER generate a row with fewer cells than the header count
* NEVER generate null rows
* Preserve table row order exactly as in the source

CORRECT table with 3 columns:
{
"type": "table",
"headers": ["Feature", "Sync", "Async"],
"rows": [
["Return value", "Direct", "Promise"],
["Blocks thread", "Yes", "No"],
["Use case", "Simple ops", "I/O operations"]
]
}

WRONG — row missing a cell:
"rows": [["Feature", "Sync"]]

WRONG — null row:
"rows": [null]

WRONG — headers as string:
"headers": "Feature | Sync | Async"

---

# Global Output Rules

* Output ONLY valid, complete JSON — no markdown, no backticks, no explanations
* ALL arrays must be properly closed with ]
* ALL objects must be properly closed with }
* ALL strings must be properly terminated with "
* NEVER return null for any field
* NEVER omit required schema fields
* Use "" for missing strings
* Use [] for missing arrays
* Use simple strings and arrays when possible — rich blocks only when genuinely needed
* Split long explanations into multiple shorter paragraphs
* Use diagrams only for visual/flow content — never for simple inline references
* Convert all markdown tables from source into structured table blocks
* Preserve all whitespace and arrows inside diagram blocks exactly

---

# Completeness Guarantee

Before returning output, verify:
[ ] All 12 schema keys are present
[ ] All arrays are closed with ]
[ ] All objects are closed with }
[ ] All strings are closed with "
[ ] No trailing commas on final items
[ ] No section was cut off mid-way
[ ] All table rows have the correct number of cells

---

Now convert the provided content into this exact structured format.

`
  },
  interview: {
    label: 'Interview',
    prompt: `Convert the following developer notes into a structured JSON interview prep guide for VelStack.

CRITICAL: Return ONLY complete, valid JSON. No markdown. No truncation.
ALL arrays and objects MUST be properly closed.
NEVER return null for any field. Use [] for empty arrays, "" for empty strings.

Schema:
{
"definition": "Concise definition of the topic.",
"interview_notes": [
{
"question": "Interview question",
"answer": "Clear, concise answer"
}
],
"common_mistakes": ["Mistake 1", "Mistake 2"]
}

Rules:
* definition must be a plain string — no rich blocks
* interview_notes must be an array of { question, answer } objects
* answer can be a plain string or rich object with table/diagram if genuinely needed
* common_mistakes must be an array of plain strings unless a table is required
* Every string must be terminated. Every array must be closed.

Now convert the provided content.
`
  },
  theory: {
    label: 'Theory',
    prompt: `Convert the following developer notes into a structured JSON theory guide for VelStack.

CRITICAL: Return ONLY complete, valid JSON. No markdown. No truncation.
ALL arrays and objects MUST be properly closed.
NEVER return null for any field. Use [] for empty arrays, "" for empty strings.

Schema:
{
"definition": "Concise definition of the topic.",
"detailed_explanation": "",
"core_concepts": [
{
"name": "Concept name",
"explanation": "Detailed explanation"
}
]
}

Rules:
* definition must be a plain string
* detailed_explanation can be a plain string or rich object — use rich only if content has tables/diagrams/nested structure
* For long explanations, split into multiple short paragraphs inside rich blocks — one idea per paragraph block
* core_concepts must be an array of { name, explanation } objects
* explanation can be plain string or rich object if tables/diagrams are needed — keep short explanations as plain strings
* Every string must be terminated. Every array must be closed.

Now convert the provided content.
`
  },
  simple: {
    label: 'Simple',
    prompt: `Convert the following developer notes into a beginner-friendly structured JSON guide for VelStack.

CRITICAL: Return ONLY complete, valid JSON. No markdown. No truncation.
ALL arrays and objects MUST be properly closed.
NEVER return null for any field. Use [] for empty arrays, "" for empty strings.

Schema:
{
"definition": "Beginner-friendly definition.",
"code_example": [
{
"title": "Basic Example",
"language": "javascript",
"code": "// Simple code example"
}
]
}

Rules:
* definition must be a plain string — short, simple, jargon-free
* code_example must be an array of { title, language, code } objects
* code field must contain ONLY code — no explanation mixed in
* Every string must be terminated. Every array must be closed.

Now convert the provided content.
`
  },
  revision: {
    label: 'Revision',
    prompt: `Convert the following developer notes into a structured JSON revision summary for VelStack.

CRITICAL: Return ONLY complete, valid JSON. No markdown. No truncation.
ALL arrays and objects MUST be properly closed.
NEVER return null for any field. Use [] for empty arrays, "" for empty strings.

Schema:
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

Rules:
* core_concepts must be an array of { name, explanation } objects — keep explanations brief
* syntax must be an array of { title, language, code } objects — code field contains ONLY code
* best_practices must be an array of plain strings unless a comparison table is genuinely needed
* Every string must be terminated. Every array must be closed.

Now convert the provided content.
`
  },
  realtime: {
    label: 'Real-time',
    prompt: `Convert the following developer notes into a structured JSON real-world usage guide for VelStack.

CRITICAL: Return ONLY complete, valid JSON. No markdown. No truncation.
ALL arrays and objects MUST be properly closed.
NEVER return null for any field. Use [] for empty arrays, "" for empty strings.

Schema:
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

Rules:
* real_world_example must be an array of { title, description } objects
* practical_example must be an array of { title, description, code, explanation, language } objects
* code field must contain ONLY code — no explanation mixed in
* explanation can be a plain string or rich object if tables/diagrams are needed
* Every string must be terminated. Every array must be closed.

Now convert the provided content.
`
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
