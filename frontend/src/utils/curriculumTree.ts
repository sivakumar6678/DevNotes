import type { CurriculumNode } from '../types'

interface CurriculumStats {
  sections: number
  topics: number
  subtopics: number
}

export function insertCurriculumNode(tree: CurriculumNode[], newNode: CurriculumNode): CurriculumNode[] {
  if (newNode.parent_id === null) {
    return [...tree, newNode]
  }

  let didChange = false

  const nextTree = tree.map((node) => {
    const nextNode = insertChild(node, newNode)
    if (nextNode !== node) didChange = true
    return nextNode
  })

  return didChange ? nextTree : tree
}

function insertChild(node: CurriculumNode, newNode: CurriculumNode): CurriculumNode {
  if (node.id === newNode.parent_id) {
    return { ...node, children: [...node.children, newNode] }
  }

  let didChange = false

  const nextChildren = node.children.map((child) => {
    const nextChild = insertChild(child, newNode)
    if (nextChild !== child) didChange = true
    return nextChild
  })

  return didChange ? { ...node, children: nextChildren } : node
}

export function updateCurriculumNode(
  tree: CurriculumNode[],
  nodeId: number,
  updater: (node: CurriculumNode) => CurriculumNode,
): CurriculumNode[] {
  let didChange = false

  const nextTree = tree.map((node) => {
    const nextNode = updateNode(node, nodeId, updater)
    if (nextNode !== node) didChange = true
    return nextNode
  })

  return didChange ? nextTree : tree
}

function updateNode(
  node: CurriculumNode,
  nodeId: number,
  updater: (node: CurriculumNode) => CurriculumNode,
): CurriculumNode {
  if (node.id === nodeId) {
    return updater(node)
  }

  let didChange = false

  const nextChildren = node.children.map((child) => {
    const nextChild = updateNode(child, nodeId, updater)
    if (nextChild !== child) didChange = true
    return nextChild
  })

  return didChange ? { ...node, children: nextChildren } : node
}

export function removeCurriculumNodes(tree: CurriculumNode[], deletedIds: Iterable<number>): CurriculumNode[] {
  const deleted = new Set(deletedIds)
  return filterDeleted(tree, deleted)
}

function filterDeleted(tree: CurriculumNode[], deleted: Set<number>): CurriculumNode[] {
  let didChange = false

  const nextTree: CurriculumNode[] = []

  tree.forEach((node) => {
    if (deleted.has(node.id)) {
      didChange = true
      return
    }

    const nextChildren = filterDeleted(node.children, deleted)
    if (nextChildren !== node.children) {
      didChange = true
      nextTree.push({ ...node, children: nextChildren })
      return
    }

    nextTree.push(node)
  })

  return didChange ? nextTree : tree
}

export function countCurriculumNodes(tree: CurriculumNode[]): CurriculumStats {
  const stats: CurriculumStats = { sections: 0, topics: 0, subtopics: 0 }

  const visit = (nodes: CurriculumNode[]) => {
    nodes.forEach((node) => {
      if (node.node_type === 'section') stats.sections += 1
      else if (node.node_type === 'topic') stats.topics += 1
      else stats.subtopics += 1

      if (node.children.length > 0) {
        visit(node.children)
      }
    })
  }

  visit(tree)
  return stats
}
