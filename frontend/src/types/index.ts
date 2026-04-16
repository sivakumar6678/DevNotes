export interface User {
  id: number;
  name: string;
  email: string;
  role: string;
  created_at?: string;
}

export interface Note {
  id?: number;
  title: string;
  slug: string;
  topic: string;
  versions: Record<string, NoteVersion>;
}

export interface NoteVersion {
  definition?: string;
  problem_it_solves?: string;
  detailed_explanation?: string;
  core_concepts?: Array<{ name?: string; explanation?: string }>;
  how_it_works?: string;
  syntax?: string;
  code_example?: string;
  practical_example?: string;
  real_world_example?: string;
  common_mistakes?: string[];
  best_practices?: string[];
  interview_notes?: string[];
}

export interface Topic {
  name: string;
  slug: string;
  children?: Topic[];
}

export interface Technology {
  name: string;
  slug: string;
}

export interface NoteView {
  id: number;
  note_id: number;
  user_id?: number;
  viewed_at: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: {
    type: string;
    message: string;
    details?: any;
  };
}

export interface LoginResponse {
  token: string;
  user: User;
}

export interface SignupResponse {
  token: string;
  user: User;
}

export interface NotesResponse {
  notes: Note[];
}

export interface NoteDetailResponse extends Note {}

export interface TopicsResponse {
  topics: Topic[];
}

export interface TechnologiesResponse {
  technologies: Technology[];
}