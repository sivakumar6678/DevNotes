/**
 * CurriculumContext.tsx
 *
 * Provides global, persistent state for curriculum data so that
 * navigating away from and back to CurriculumPage does not trigger
 * redundant API calls.  Works in tandem with curriculumCache (module-
 * level TTL cache) to prevent stale data from being served indefinitely.
 */

import {
  createContext,
  useCallback,
  useContext,
  useState,
  type ReactNode,
} from 'react'
import { curriculumCache } from '../utils/curriculumCache'
import {
  fetchCurriculum,
  fetchCurriculumAdmin,
  fetchTechnologies,
} from '../api/curriculum'
import type { CurriculumNode, Technology } from '../types'

// ─── Types ────────────────────────────────────────────────────────────────────

interface CurriculumContextValue {
  // Technologies
  technologies: Technology[]
  techsLoading: boolean
  /**
   * Load technologies from cache or network.
   * @param forceRefetch  If true, bypass the cache and hit the API.
   */
  loadTechnologies: (forceRefetch?: boolean) => Promise<void>
  /** Invalidate the technologies cache entry (e.g. after create/rename/delete). */
  invalidateTechnologies: () => void

  // Curriculum tree (active technology) — admin
  tree: CurriculumNode[]
  treeLoading: boolean
  activeTechId: number | null
  setActiveTechId: (id: number | null) => void
  /**
   * Load the curriculum tree for a given tech from cache or network.
   * @param techId        Technology to load.
   * @param forceRefetch  If true, bypass the cache and hit the API.
   */
  loadTree: (techId: number, forceRefetch?: boolean) => Promise<void>
  /** Invalidate a specific tree cache entry (e.g. after topic CRUD). */
  invalidateTree: (techId: number) => void

  // Public curriculum tree (published-only, used by Sidebar)
  publicTree: CurriculumNode[]
  publicTreeLoading: boolean
  /**
   * Load the public (published-only) curriculum tree for a given tech.
   * @param techId        Technology to load.
   * @param forceRefetch  If true, bypass the cache and hit the API.
   */
  loadPublicTree: (techId: number, forceRefetch?: boolean) => Promise<void>
  /** Invalidate a specific public tree cache entry. */
  invalidatePublicTree: (techId: number) => void

  /**
   * Find the technology ID that a given topic slug belongs to.
   * Searches through all loaded public tree caches.
   */
  findTechIdBySlug: (slug: string) => number | null

  // Convenience
  techError: string
  setTechError: (msg: string) => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CurriculumContext = createContext<CurriculumContextValue | undefined>(undefined)

// ─── Helpers ──────────────────────────────────────────────────────────────────

function findSlugInTree(nodes: CurriculumNode[], slug: string): boolean {
  for (const node of nodes) {
    if (node.slug === slug) return true
    if (node.children?.length && findSlugInTree(node.children, slug)) return true
  }
  return false
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CurriculumProvider({ children }: { children: ReactNode }) {
  const [technologies, setTechnologies] = useState<Technology[]>([])
  const [techsLoading, setTechsLoading] = useState(false)

  const [tree, setTree] = useState<CurriculumNode[]>([])
  const [treeLoading, setTreeLoading] = useState(false)
  const [activeTechId, setActiveTechIdState] = useState<number | null>(null)

  const [publicTree, setPublicTree] = useState<CurriculumNode[]>([])
  const [publicTreeLoading, setPublicTreeLoading] = useState(false)

  const [techError, setTechError] = useState('')

  // ── Technologies ────────────────────────────────────────────────────────────

  const loadTechnologies = useCallback(async (forceRefetch = false) => {
    // 1. Try the cache first (unless a forced refresh was requested)
    if (!forceRefetch) {
      const cached = curriculumCache.getTechnologies()
      if (cached) {
        setTechnologies(cached)
        return
      }
    }

    // 2. Fetch from the network
    setTechsLoading(true)
    try {
      const data = await fetchTechnologies()
      curriculumCache.setTechnologies(data)
      setTechnologies(data)
    } catch {
      setTechError('Could not load technologies.')
    } finally {
      setTechsLoading(false)
    }
  }, [])

  const invalidateTechnologies = useCallback(() => {
    curriculumCache.invalidateTechnologies()
  }, [])

  // ── Curriculum tree (admin) ─────────────────────────────────────────────────

  const loadTree = useCallback(async (techId: number, forceRefetch = false) => {
    // 1. Try the cache first
    if (!forceRefetch) {
      const cached = curriculumCache.getTree(techId)
      if (cached) {
        setTree(cached)
        return
      }
    }

    // 2. Fetch from the network
    setTreeLoading(true)
    try {
      const nodes = await fetchCurriculumAdmin(techId)
      curriculumCache.setTree(techId, nodes)
      setTree(nodes)
    } catch (err) {
      setTechError(err instanceof Error ? err.message : 'Could not load curriculum.')
    } finally {
      setTreeLoading(false)
    }
  }, [])

  const invalidateTree = useCallback((techId: number) => {
    curriculumCache.invalidateTree(techId)
  }, [])

  // ── Public curriculum tree (published-only, for Sidebar) ────────────────────

  const loadPublicTree = useCallback(async (techId: number, forceRefetch = false) => {
    // 1. Try the cache first
    if (!forceRefetch) {
      const cached = curriculumCache.getPublicTree(techId)
      if (cached) {
        setPublicTree(cached)
        return
      }
    }

    // 2. Fetch from the network
    setPublicTreeLoading(true)
    try {
      const nodes = await fetchCurriculum(techId)
      curriculumCache.setPublicTree(techId, nodes)
      setPublicTree(nodes)
    } catch (err) {
      setTechError(err instanceof Error ? err.message : 'Could not load curriculum.')
    } finally {
      setPublicTreeLoading(false)
    }
  }, [])

  const invalidatePublicTree = useCallback((techId: number) => {
    curriculumCache.invalidatePublicTree(techId)
  }, [])

  // ── Find tech ID by slug ────────────────────────────────────────────────────

  const findTechIdBySlug = useCallback((slug: string): number | null => {
    // Search through all cached public trees
    for (const [techId, _entry] of curriculumCache.publicTreeCache) {
      const cachedNodes = curriculumCache.getPublicTree(techId)
      if (cachedNodes && findSlugInTree(cachedNodes, slug)) {
        return techId
      }
    }
    // Also search the currently loaded public tree
    if (publicTree.length > 0 && findSlugInTree(publicTree, slug)) {
      // Find which tech it belongs to from technologies list
      for (const tech of technologies) {
        const cached = curriculumCache.getPublicTree(tech.id)
        if (cached && findSlugInTree(cached, slug)) return tech.id
      }
    }
    return null
  }, [publicTree, technologies])

  // ── activeTechId setter (also triggers tree load) ───────────────────────────

  const setActiveTechId = useCallback((id: number | null) => {
    if (id !== activeTechId) {
      setTree([])
    }
    setActiveTechIdState(id)
    if (id) {
      // Will use cached tree if available
      loadTree(id)
    }
  }, [activeTechId, loadTree])

  return (
    <CurriculumContext.Provider
      value={{
        technologies,
        techsLoading,
        loadTechnologies,
        invalidateTechnologies,

        tree,
        treeLoading,
        activeTechId,
        setActiveTechId,
        loadTree,
        invalidateTree,

        publicTree,
        publicTreeLoading,
        loadPublicTree,
        invalidatePublicTree,

        findTechIdBySlug,

        techError,
        setTechError,
      }}
    >
      {children}
    </CurriculumContext.Provider>
  )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCurriculum(): CurriculumContextValue {
  const ctx = useContext(CurriculumContext)
  if (!ctx) throw new Error('useCurriculum must be used within <CurriculumProvider>')
  return ctx
}
