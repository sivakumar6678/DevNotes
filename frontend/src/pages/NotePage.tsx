import { Navigate, useParams } from 'react-router-dom'

/**
 * NotePage — legacy redirect.
 *
 * All note rendering is now handled by NoteTopicContent inside LearnLayout.
 * This component exists only for backward compatibility with any code that
 * still imports or navigates to the old NotePage directly.
 */
export default function NotePage() {
  const { slug } = useParams()

  // Redirect to the nested route handled by LearnLayout + NoteTopicContent
  if (slug) {
    return <Navigate to={`/notes/${slug}`} replace />
  }

  return <Navigate to="/technologies" replace />
}
