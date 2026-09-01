import { Outlet, useLocation } from 'react-router-dom'
import { DebugPanel } from './DebugPanel'

export default function Layout() {
  const location = useLocation()
  const isAdminRoute = location.pathname.startsWith('/admin')

  if (isAdminRoute) {
    return (
      <div className="min-h-screen w-full bg-slate-50 text-slate-900 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900">
        <main className="flex-1 flex flex-col">
          <Outlet />
        </main>
        <DebugPanel />
      </div>
    )
  }

  return (
    <div className="min-h-screen w-full bg-white text-slate-900 flex flex-col antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Screen Content */}
      <main className="flex-1 flex flex-col">
        <Outlet />
      </main>

      {/* Floating debug panel — always mounted, invisible until 5 taps top-left */}
      <DebugPanel />
    </div>
  )
}
