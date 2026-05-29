import { useEffect } from 'react'

const BASE_TITLE = 'VelStack'

/**
 * Sets `document.title` on mount and restores the base title on unmount.
 *
 * @param title  Page-specific title segment, e.g. "JavaScript".
 *               Renders as "JavaScript — VelStack".
 *               Pass `undefined` or `""` to show just "VelStack".
 */
export function usePageTitle(title?: string): void {
  useEffect(() => {
    document.title = title ? `${title} — ${BASE_TITLE}` : BASE_TITLE

    return () => {
      document.title = BASE_TITLE
    }
  }, [title])
}
