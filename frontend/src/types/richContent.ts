export type RichBlockType = "paragraph" | "bullets" | "numbered_list" | "diagram" | "callout"

export type ParagraphBlock = { type: "paragraph"; content: string }
export type DiagramBlock = { type: "diagram"; content: string }
export type BulletsBlock = { type: "bullets"; items: { text: string; depth: 0 | 1 | 2 }[] }
export type NumberedListBlock = { type: "numbered_list"; items: string[] }
export type CalloutBlock = { type: "callout"; variant: "tip" | "warning" | "info"; content: string }

export type RichBlock = ParagraphBlock | DiagramBlock | BulletsBlock | NumberedListBlock | CalloutBlock

export type RichContent = { type: "rich"; blocks: RichBlock[] }
export type FieldContent = string | RichContent
