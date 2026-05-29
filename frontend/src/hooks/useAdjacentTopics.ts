import { useMemo } from 'react'
import { useCurriculum } from '../context/CurriculumContext'
import type { CurriculumNode } from '../types'

export interface AdjacentTopics {
  prev: { slug: string; name: string } | null
  next: { slug: string; name: string } | null
}

/**
 * Walk the curriculum tree depth-first and collect all leaf (subtopic) nodes
 * in the order they appear visually in the sidebar.
 */
function collectLeaves(nodes: CurriculumNode[]): { slug: string; name: string }[] {
  const result: { slug: string; name: string }[] = []

  for (const node of nodes) {
    if (node.node_type === 'subtopic' && node.children.length === 0) {
      result.push({ slug: node.slug, name: node.name })
    }
    if (node.children.length > 0) {
      result.push(...collectLeaves(node.children))
    }
  }

  return result
}

/**
 * Returns the previous and next leaf topics relative to the current slug.
 * Used for sequential "Continue reading" navigation at the bottom of notes.
 */
export function useAdjacentTopics(currentSlug: string | undefined): AdjacentTopics {
  const { publicTree } = useCurriculum()

  return useMemo(() => {
    if (!currentSlug || publicTree.length === 0) {
      return { prev: null, next: null }
    }

    const leaves = collectLeaves(publicTree)
    const currentIndex = leaves.findIndex((leaf) => leaf.slug === currentSlug)

    if (currentIndex === -1) {
      return { prev: null, next: null }
    }

    return {
      prev: currentIndex > 0 ? leaves[currentIndex - 1] : null,
      next: currentIndex < leaves.length - 1 ? leaves[currentIndex + 1] : null,
    }
  }, [currentSlug, publicTree])
}
