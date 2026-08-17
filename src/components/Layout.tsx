import { Outlet, useLocation } from 'react-router-dom'
import { StatusBar } from './StatusBar'

export default function Layout() {
  const location = useLocation()
  const isSplash = location.pathname === '/'

  return (
    <div className="min-h-screen w-full bg-slate-900/5 sm:bg-slate-900/10 flex flex-col items-center justify-center sm:p-4 md:p-6 antialiased selection:bg-indigo-100 selection:text-indigo-900">
      {/* Device Frame on Desktop */}
      <div className="w-full sm:max-w-[420px] min-h-screen sm:min-h-[844px] sm:h-[844px] bg-white sm:rounded-[40px] sm:shadow-2xl sm:shadow-indigo-950/15 sm:border sm:border-slate-200/80 flex flex-col overflow-hidden relative">
        {/* Dynamic Island / Speaker Pill decoration (Desktop only) */}
        <div className="hidden sm:flex justify-center w-full pt-2 absolute top-0 left-0 right-0 z-40 pointer-events-none">
          <div className="w-24 h-4 bg-slate-900 rounded-full flex items-center justify-end px-3">
            <div className="w-2 h-2 rounded-full bg-slate-800/80" />
          </div>
        </div>

        {/* Status Bar */}
        {!isSplash && <StatusBar />}

        {/* Screen Content */}
        <main className="flex-1 flex flex-col relative overflow-y-auto overflow-x-hidden">
          <Outlet />
        </main>

        {/* Home Indicator Bar decoration */}
        <div className="w-full py-2 flex justify-center shrink-0 safe-area-bottom pointer-events-none z-30">
          <div className="w-32 h-1 bg-slate-300/80 rounded-full" />
        </div>
      </div>
    </div>
  )
}
