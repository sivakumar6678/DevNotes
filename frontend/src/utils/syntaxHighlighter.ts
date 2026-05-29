/**
 * syntaxHighlighter.ts
 *
 * Zero-dependency, regex-based syntax tokenizer for code blocks.
 * Supports JS/TS, HTML, CSS, and SQL — the four technologies VelStack covers.
 *
 * Returns an array of tokens with a `type` classification used by CSS classes
 * to apply Material Palenight-inspired coloring.
 */

export interface SyntaxToken {
  text: string
  type: 'keyword' | 'string' | 'comment' | 'function' | 'number' | 'operator' | 'tag' | 'attr' | 'property' | 'default'
}

// ─── Language detection ───────────────────────────────────────────────────────

function normalizeLanguage(lang?: string): string {
  if (!lang) return 'text'
  const l = lang.toLowerCase().trim()
  if (['js', 'javascript', 'jsx', 'ts', 'typescript', 'tsx'].includes(l)) return 'js'
  if (['html', 'xml', 'svg', 'htm'].includes(l)) return 'html'
  if (['css', 'scss', 'sass', 'less'].includes(l)) return 'css'
  if (['sql', 'mysql', 'postgresql', 'sqlite'].includes(l)) return 'sql'
  if (['json'].includes(l)) return 'json'
  return 'text'
}

// ─── JavaScript / TypeScript ──────────────────────────────────────────────────

const JS_KEYWORDS = new Set([
  'abstract', 'async', 'await', 'break', 'case', 'catch', 'class', 'const',
  'continue', 'debugger', 'default', 'delete', 'do', 'else', 'enum', 'export',
  'extends', 'false', 'finally', 'for', 'from', 'function', 'get', 'if',
  'implements', 'import', 'in', 'instanceof', 'interface', 'let', 'new', 'null',
  'of', 'package', 'private', 'protected', 'public', 'return', 'set', 'static',
  'super', 'switch', 'this', 'throw', 'true', 'try', 'type', 'typeof', 'undefined',
  'var', 'void', 'while', 'with', 'yield',
])

// Order matters: longer/more-specific patterns first.
const JS_PATTERN = /\/\/[^\n]*|\/\*[\s\S]*?\*\/|`(?:\\[\s\S]|[^`])*`|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|\b[a-zA-Z_$][\w$]*(?=\s*\()|[!=<>]=?=?|&&|\|\||[+\-*/%]=?|=>|\.\.\.|[{}()[\];,.?:]|\b[a-zA-Z_$][\w$]*\b/g

function tokenizeJS(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  let lastIndex = 0

  for (const match of code.matchAll(JS_PATTERN)) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: 'default' })
    }

    const text = match[0]
    let type: SyntaxToken['type'] = 'default'

    if (text.startsWith('//') || text.startsWith('/*')) {
      type = 'comment'
    } else if (text.startsWith('"') || text.startsWith("'") || text.startsWith('`')) {
      type = 'string'
    } else if (/^\d/.test(text)) {
      type = 'number'
    } else if (/^[!=<>+\-*/%&|.?:,;{}()[\]]/.test(text) || text === '=>' || text === '...') {
      type = 'operator'
    } else if (JS_KEYWORDS.has(text)) {
      type = 'keyword'
    } else if (/^[a-zA-Z_$][\w$]*$/.test(text)) {
      // Check if it's followed by ( — the regex already captured function-call pattern separately
      // If the match was via the function lookahead, the original regex handles it
      // But matchAll returns the FIRST matching alternative, so function patterns come through here
      const nextCharIndex = (match.index ?? 0) + text.length
      if (nextCharIndex < code.length && code[nextCharIndex] === '(') {
        type = 'function'
      }
    }

    tokens.push({ text, type })
    lastIndex = (match.index ?? 0) + text.length
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'default' })
  }

  return tokens
}

// ─── HTML ─────────────────────────────────────────────────────────────────────

const HTML_PATTERN = /<!--[\s\S]*?-->|<\/?[a-zA-Z][\w-]*|\/?>|"[^"]*"|'[^']*'|[a-zA-Z-]+(?==)/g

function tokenizeHTML(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  let lastIndex = 0

  for (const match of code.matchAll(HTML_PATTERN)) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: 'default' })
    }

    const text = match[0]
    let type: SyntaxToken['type'] = 'default'

    if (text.startsWith('<!--')) {
      type = 'comment'
    } else if (text.startsWith('<')) {
      type = 'tag'
    } else if (text === '/>' || text === '>') {
      type = 'tag'
    } else if (text.startsWith('"') || text.startsWith("'")) {
      type = 'string'
    } else if (/^[a-zA-Z-]+$/.test(text)) {
      type = 'attr'
    }

    tokens.push({ text, type })
    lastIndex = (match.index ?? 0) + text.length
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'default' })
  }

  return tokens
}

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS_KEYWORDS = new Set([
  'important', 'inherit', 'initial', 'unset', 'none', 'auto', 'solid', 'block',
  'inline', 'flex', 'grid', 'absolute', 'relative', 'fixed', 'sticky',
  'hidden', 'visible', 'scroll', 'center', 'left', 'right', 'top', 'bottom',
])

const CSS_PATTERN = /\/\*[\s\S]*?\*\/|"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|#[0-9a-fA-F]{3,8}\b|\d+(?:\.\d+)?(?:px|em|rem|%|vh|vw|s|ms|deg|fr)?|[a-zA-Z-]+(?=\s*:)|@[a-zA-Z-]+|[.#][\w-]+|[{}();:,>~+*]/g

function tokenizeCSS(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  let lastIndex = 0

  for (const match of code.matchAll(CSS_PATTERN)) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: 'default' })
    }

    const text = match[0]
    let type: SyntaxToken['type'] = 'default'

    if (text.startsWith('/*')) {
      type = 'comment'
    } else if (text.startsWith('"') || text.startsWith("'")) {
      type = 'string'
    } else if (text.startsWith('#') && /^#[0-9a-fA-F]/.test(text)) {
      type = 'number'
    } else if (/^\d/.test(text)) {
      type = 'number'
    } else if (text.startsWith('@')) {
      type = 'keyword'
    } else if (text.startsWith('.') || text.startsWith('#')) {
      type = 'function' // selectors
    } else if (/^[a-zA-Z-]+$/.test(text)) {
      // Property name (matched by lookahead for :)
      type = 'property'
    } else if (/^[{}();:,>~+*]$/.test(text)) {
      type = 'operator'
    }

    tokens.push({ text, type })
    lastIndex = (match.index ?? 0) + text.length
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'default' })
  }

  return tokens
}

// ─── SQL ──────────────────────────────────────────────────────────────────────

const SQL_KEYWORDS = new Set([
  'select', 'from', 'where', 'and', 'or', 'not', 'in', 'is', 'null', 'as',
  'on', 'join', 'inner', 'outer', 'left', 'right', 'cross', 'full',
  'insert', 'into', 'values', 'update', 'set', 'delete',
  'create', 'alter', 'drop', 'table', 'index', 'view', 'database',
  'primary', 'key', 'foreign', 'references', 'constraint', 'unique',
  'order', 'by', 'group', 'having', 'limit', 'offset', 'asc', 'desc',
  'count', 'sum', 'avg', 'min', 'max', 'distinct', 'between', 'like',
  'exists', 'case', 'when', 'then', 'else', 'end', 'if', 'begin', 'commit',
  'rollback', 'grant', 'revoke', 'int', 'varchar', 'text', 'boolean',
  'date', 'timestamp', 'float', 'decimal', 'char', 'enum', 'default',
  'auto_increment', 'not', 'null', 'true', 'false',
])

const SQL_PATTERN = /--[^\n]*|\/\*[\s\S]*?\*\/|'(?:''|[^'])*'|"(?:\\.|[^"\\])*"|\b\d+(?:\.\d+)?\b|\b[a-zA-Z_]\w*(?=\s*\()|\b[a-zA-Z_]\w*\b|[=<>!]+|[(),;.*]/g

function tokenizeSQL(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  let lastIndex = 0

  for (const match of code.matchAll(SQL_PATTERN)) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: 'default' })
    }

    const text = match[0]
    let type: SyntaxToken['type'] = 'default'

    if (text.startsWith('--') || text.startsWith('/*')) {
      type = 'comment'
    } else if (text.startsWith("'") || text.startsWith('"')) {
      type = 'string'
    } else if (/^\d/.test(text)) {
      type = 'number'
    } else if (/^[=<>!(),;.*]+$/.test(text)) {
      type = 'operator'
    } else if (SQL_KEYWORDS.has(text.toLowerCase())) {
      type = 'keyword'
    } else {
      const nextCharIndex = (match.index ?? 0) + text.length
      if (nextCharIndex < code.length && code[nextCharIndex] === '(') {
        type = 'function'
      }
    }

    tokens.push({ text, type })
    lastIndex = (match.index ?? 0) + text.length
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'default' })
  }

  return tokens
}

// ─── JSON ─────────────────────────────────────────────────────────────────────

const JSON_PATTERN = /"(?:\\.|[^"\\])*"\s*(?=:)|"(?:\\.|[^"\\])*"|\btrue\b|\bfalse\b|\bnull\b|-?\b\d+(?:\.\d+)?(?:e[+-]?\d+)?\b|[{}[\]:,]/g

function tokenizeJSON(code: string): SyntaxToken[] {
  const tokens: SyntaxToken[] = []
  let lastIndex = 0

  for (const match of code.matchAll(JSON_PATTERN)) {
    if (match.index > lastIndex) {
      tokens.push({ text: code.slice(lastIndex, match.index), type: 'default' })
    }

    const text = match[0]
    let type: SyntaxToken['type'] = 'default'

    if (text.startsWith('"') && /"\s*$/.test(text) && text.trimEnd().endsWith('"')) {
      // Could be a key (if matched with lookahead for :) or a value
      const trimmed = text.trimEnd()
      const charAfter = code[(match.index ?? 0) + text.length]
      if (charAfter === ':') {
        type = 'property'
      } else {
        type = 'string'
      }
    } else if (text === 'true' || text === 'false') {
      type = 'keyword'
    } else if (text === 'null') {
      type = 'keyword'
    } else if (/^-?\d/.test(text)) {
      type = 'number'
    } else if (/^[{}[\]:,]$/.test(text)) {
      type = 'operator'
    }

    tokens.push({ text, type })
    lastIndex = (match.index ?? 0) + text.length
  }

  if (lastIndex < code.length) {
    tokens.push({ text: code.slice(lastIndex), type: 'default' })
  }

  return tokens
}

// ─── Plain text fallback ──────────────────────────────────────────────────────

function tokenizePlain(code: string): SyntaxToken[] {
  return [{ text: code, type: 'default' }]
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function tokenize(code: string, language?: string): SyntaxToken[] {
  const lang = normalizeLanguage(language)

  switch (lang) {
    case 'js':   return tokenizeJS(code)
    case 'html': return tokenizeHTML(code)
    case 'css':  return tokenizeCSS(code)
    case 'sql':  return tokenizeSQL(code)
    case 'json': return tokenizeJSON(code)
    default:     return tokenizePlain(code)
  }
}
