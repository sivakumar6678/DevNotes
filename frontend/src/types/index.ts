export interface User {
  id: number
  name: string
  email: string
  role: 'super_admin' | 'contributor' | 'public'
  status: 'pending' | 'approved' | 'suspended' | 'rejected'
  avatar_url?: string | null
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
  syntax?: string | Array<{ title?: string; language?: string; code?: string }>
  code_example?: string | Array<{ title?: string; language?: string; code?: string }>
  practical_example?: string | Array<{ title?: string; description?: string; code?: string; explanation?: string; language?: string }>
  real_world_example?: string | Array<{ title?: string; description?: string }>
  common_mistakes?: string[]
  best_practices?: string[]
  interview_notes?: string[] | Array<{ question?: string; answer?: string }>
}

export interface Topic {
  id?: number
  name: string
  slug: string
  technology_id?: number
  parent_id?: number | null
  type?: 'technology' | 'module' | 'topic'
  created_at?: string | null
  children?: Topic[]
}

export interface Technology {
  id: number
  name: string
  slug: string
  description?: string | null
  icon_url?: string | null
  color?: string | null
  is_published: boolean
  sort_order: number
  created_by?: number | null
}

export interface CurriculumNode {
  id: number
  name: string
  slug: string
  technology_id: number
  parent_id: number | null
  node_type: 'section' | 'topic' | 'subtopic'
  /** Legacy alias — same as node_type */
  type?: string
  is_published: boolean
  sort_order: number
  created_at?: string | null
  children: CurriculumNode[]
}

export interface TopicPayload {
  name: string
  slug: string
  technology_id: number
  parent_id: number | null
  node_type?: 'section' | 'topic' | 'subtopic'
  sort_order?: number
  description?: string
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
    technology_id: number
    type: 'technology' | 'module' | 'topic'
    breadcrumb: string
    is_published: boolean
    sort_order: number
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
