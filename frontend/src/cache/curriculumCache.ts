/**
 * curriculumCache.ts
 *
 * Module-level in-memory cache for curriculum data.
 * Lives for the entire browser session (no localStorage) and expires
 * entries after CACHE_TTL_MS so stale data is not served indefinitely.
 */

const CACHE_TTL_MS = 5 * 60 * 1000 // 5 minutes

interface CacheEntry<T> {
  data: T
  cachedAt: number
}

function isExpired<T>(entry: CacheEntry<T>): boolean {
  return Date.now() - entry.cachedAt > CACHE_TTL_MS
}

// ─── Technologies list ────────────────────────────────────────────────────────

import type { CurriculumNode, Technology } from '../types'

let technologiesEntry: CacheEntry<Technology[]> | null = null

export const curriculumCache = {
  // ── Technologies ────────────────────────────────────────────────────────────

  getTechnologies(): Technology[] | null {
    if (!technologiesEntry || isExpired(technologiesEntry)) {
      technologiesEntry = null
      return null
    }
    return technologiesEntry.data
  },

  setTechnologies(data: Technology[]): void {
    technologiesEntry = { data, cachedAt: Date.now() }
  },

  invalidateTechnologies(): void {
    technologiesEntry = null
  },

  // ── Curriculum trees (keyed by technology id) — admin ─────────────────────────

  treeCache: new Map<number, CacheEntry<CurriculumNode[]>>(),

  getTree(techId: number): CurriculumNode[] | null {
    const entry = this.treeCache.get(techId)
    if (!entry || isExpired(entry)) {
      this.treeCache.delete(techId)
      return null
    }
    return entry.data
  },

  setTree(techId: number, data: CurriculumNode[]): void {
    this.treeCache.set(techId, { data, cachedAt: Date.now() })
  },

  invalidateTree(techId: number): void {
    this.treeCache.delete(techId)
  },

  // ── Public curriculum trees (published-only, used by Sidebar) ───────────────

  publicTreeCache: new Map<number, CacheEntry<CurriculumNode[]>>(),

  getPublicTree(techId: number): CurriculumNode[] | null {
    const entry = this.publicTreeCache.get(techId)
    if (!entry || isExpired(entry)) {
      this.publicTreeCache.delete(techId)
      return null
    }
    return entry.data
  },

  setPublicTree(techId: number, data: CurriculumNode[]): void {
    this.publicTreeCache.set(techId, { data, cachedAt: Date.now() })
  },

  invalidatePublicTree(techId: number): void {
    this.publicTreeCache.delete(techId)
  },

  invalidateAll(): void {
    technologiesEntry = null
    this.treeCache.clear()
    this.publicTreeCache.clear()
  },
}
