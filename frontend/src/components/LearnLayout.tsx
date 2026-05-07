import { memo } from 'react'
import { Outlet } from 'react-router-dom'
import Sidebar from './Sidebar'

/**
 * LearnLayout — persistent layout wrapper for the learning experience.
 *
 * Renders a stable Sidebar that never unmounts during topic navigation.
 * Only the <Outlet /> (NoteTopicContent) swaps when the slug changes.
 */
const LearnLayout = memo(function LearnLayout() {
  return (
    <div className="w-full max-w-full">
      <div className="gap-6 px-4 lg:px-8 grid lg:grid-cols-[260px_minmax(0,1fr)]">
        {/* Sidebar — persistent across all topic navigations */}
        <Sidebar />

        {/* Dynamic content area — only this swaps */}
        <Outlet />
      </div>
    </div>
  )
})

export default LearnLayout
