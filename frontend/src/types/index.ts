export interface User {
  id: number
  name: string
  email: string
  role: string
  status: string
  created_at?: string
}

export interface Note {
  id?: number
  title: string
  slug: string
  topic: string
  label?: string
  versions: Record<string, NoteVersion>
}

export interface NoteVersion {
  definition?: string
  problem_it_solves?: string
  detailed_explanation?: string
  core_concepts?: Array<{ name?: string; explanation?: string }>
  how_it_works?: string
  syntax?: string
  code_example?: string
  practical_example?: string
  real_world_example?: string
  common_mistakes?: string[]
  best_practices?: string[]
  interview_notes?: string[]
}

export interface Topic {
  id?: number
  name: string
  slug: string
  parent_id?: number | null
  level?: TopicLevel
  created_at?: string | null
  children?: Topic[]
}

export interface Technology {
  id: number
  name: string
  slug: string
}

export type TopicLevel = 'technology' | 'module' | 'topic'

export interface CurriculumNode {
  id: number
  name: string
  slug: string
  parent_id: number | null
  type?: TopicLevel
  level: TopicLevel
  created_at?: string | null
  children: CurriculumNode[]
}

export interface TopicPayload {
  name: string
  parent_id: number | null
  level: TopicLevel
}

export interface TopicNoteSummary {
  id: number
  topic_id: number
  title: string
  slug: string
}

export interface TopicNoteData {
  topic: {
    id: number
    name: string
    slug: string
    level: TopicLevel
    breadcrumb: string
  }
  note: TopicNoteSummary | null
  versions: Record<string, NoteVersion>
}

export interface NoteOption {
  id: number
  topic_id: number
  note_id?: number | null
  name: string
  title: string
  slug: string
  parent_id?: number | null
  label: string
}

export interface NoteView {
  id: number;
  note_id: number;
  user_id?: number;
  viewed_at: string;
}

export interface ApiResponse<T> {
  data?: T
  error?: {
    type: string
    message: string
    details?: any
  }
}

export interface LoginResponse {
  token: string
  user: User
}

export interface SignupResponse {
  message: string
  user: User
}

export interface NotesResponse {
  notes: NoteOption[]
}

export interface UsersResponse {
  users: User[]
}

export interface TopicsResponse {
  topics: Topic[]
}

export interface TechnologiesResponse {
  technologies: Technology[]
}

export interface NoteDetailResponse extends Note {}
