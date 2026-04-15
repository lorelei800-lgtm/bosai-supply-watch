import { CMS } from '../config'

interface AdminGuardProps {
  children: React.ReactNode
  fallback?: React.ReactNode
}

/**
 * Renders children only when the app is built with a write token (admin build).
 * In the public citizen build, the fallback (or nothing) is shown instead.
 */
export function AdminGuard({ children, fallback = null }: AdminGuardProps) {
  if (!CMS.writable) return <>{fallback}</>
  return <>{children}</>
}
