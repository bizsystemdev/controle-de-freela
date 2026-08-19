import { useCallback, useEffect, useRef, useState } from 'react'
import { MapPin, Trash2, X, Bug } from 'lucide-react'
import { getLogs, clearLogs, type LogEntry } from '@/lib/logger'

// ---------------------------------------------------------------------------
// DebugPanel
// ---------------------------------------------------------------------------
// A floating, always-mounted debug drawer that is invisible until a developer
// taps 5 times (quickly) in the top-left corner of the screen. Once open it
// occupies the bottom half of the viewport with a dark, semi-transparent
// background and shows the live in-memory log stream plus the last known
// device coordinates (extracted from the most recent `geo` log carrying
// lat/lng data).
// ---------------------------------------------------------------------------

const TAP_ZONE_SIZE = 56 // px — invisible trigger in the top-left corner
const TAP_REQUIRED = 5 // taps to toggle
const TAP_WINDOW_MS = 2500 // all taps must land within this window

const LEVEL_COLOR: Record<LogEntry['level'], string> = {
  debug: 'text-slate-400',
  info: 'text-sky-300',
  warn: 'text-amber-300',
  error: 'text-rose-400',
}

// Per-tag accent color so different subsystems are visually distinct.
const TAG_COLOR: Record<string, string> = {
  geo: 'text-emerald-300',
  auth: 'text-indigo-300',
  api: 'text-sky-300',
  webauthn: 'text-fuchsia-300',
}

function tagColor(tag: string): string {
  return TAG_COLOR[tag] ?? 'text-slate-300'
}

function shortTime(iso: string): string {
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '??:??:??'
  return d.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  })
}

/** Scan the log stream for the most recent geo entry carrying coordinates. */
function findLastKnownLocation(
  logs: LogEntry[],
): { lat: number; lng: number; accuracy?: number } | null {
  for (let i = logs.length - 1; i >= 0; i -= 1) {
    const entry = logs[i]
    if (entry.tag !== 'geo' || !entry.data) continue
    const { latitude, longitude, accuracy } = entry.data
    if (
      typeof latitude === 'number' &&
      typeof longitude === 'number' &&
      !Number.isNaN(latitude) &&
      !Number.isNaN(longitude)
    ) {
      return {
        lat: latitude,
        lng: longitude,
        accuracy: typeof accuracy === 'number' ? accuracy : undefined,
      }
    }
  }
  return null
}

export const DebugPanel: React.FC = () => {
  const [open, setOpen] = useState(false)
  const [logs, setLogs] = useState<LogEntry[]>([])
  const [lastLocation, setLastLocation] = useState<{
    lat: number
    lng: number
    accuracy?: number
  } | null>(null)

  const tapTimesRef = useRef<number[]>([])
  const scrollRef = useRef<HTMLDivElement | null>(null)

  // Easter-egg trigger: 5 quick taps in the top-left corner.
  const handleTriggerTap = useCallback(() => {
    const now = Date.now()
    const recent = tapTimesRef.current.filter((t) => now - t < TAP_WINDOW_MS)
    recent.push(now)
    tapTimesRef.current = recent
    if (recent.length >= TAP_REQUIRED) {
      tapTimesRef.current = []
      setOpen((prev) => !prev)
    }
  }, [])

  // Live log polling (500ms) while the panel is open.
  useEffect(() => {
    if (!open) return
    const tick = () => {
      const next = getLogs()
      setLogs(next)
      setLastLocation(findLastKnownLocation(next))
    }
    tick()
    const id = setInterval(tick, 500)
    return () => clearInterval(id)
  }, [open])

  // Auto-scroll to the bottom whenever the log list changes.
  useEffect(() => {
    if (!open) return
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [logs, open])

  const handleClear = useCallback(() => {
    clearLogs()
    setLogs([])
    setLastLocation(null)
  }, [])

  return (
    <>
      {/* Invisible activation zone — top-left corner, above everything. */}
      <button
        type="button"
        aria-label="Ativar painel de debug"
        onClick={handleTriggerTap}
        style={{ width: TAP_ZONE_SIZE, height: TAP_ZONE_SIZE, top: 0, left: 0 }}
        className="fixed z-[70] cursor-default"
        tabIndex={-1}
      />

      {open && (
        <div className="fixed inset-0 z-[60] flex flex-col justify-end pointer-events-none">
          <div className="h-1/2 w-full bg-slate-950/90 backdrop-blur-md border-t border-slate-700/60 rounded-t-2xl flex flex-col pointer-events-auto shadow-2xl">
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2.5 border-b border-slate-700/60">
              <div className="flex items-center gap-2 text-slate-200">
                <Bug className="w-4 h-4 text-emerald-400" />
                <span className="text-sm font-bold tracking-wide">DEBUG</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleClear}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-300 bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Limpar logs
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-200 bg-slate-700/60 hover:bg-slate-700 px-2.5 py-1.5 rounded-lg transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                  Fechar
                </button>
              </div>
            </div>

            {/* Last known location indicator */}
            <div className="px-4 py-2 border-b border-slate-700/60 text-xs">
              <div className="flex items-center gap-2">
                <MapPin className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                <span className="text-slate-400 font-medium">Última localização:</span>
                {lastLocation ? (
                  <span className="text-emerald-300 font-mono tabular-nums truncate">
                    {lastLocation.lat.toFixed(6)}, {lastLocation.lng.toFixed(6)}
                    {typeof lastLocation.accuracy === 'number' && (
                      <span className="text-slate-500 ml-2">
                        ±{Math.round(lastLocation.accuracy)}m
                      </span>
                    )}
                  </span>
                ) : (
                  <span className="text-slate-500 italic">indisponível</span>
                )}
              </div>
            </div>

            {/* Log stream */}
            <div
              ref={scrollRef}
              className="flex-1 overflow-y-auto px-3 py-2 font-mono text-[11px] leading-relaxed"
            >
              {logs.length === 0 ? (
                <div className="text-slate-500 italic text-center py-6">Nenhum log registrado.</div>
              ) : (
                logs.map((entry, idx) => (
                  <div
                    key={`${entry.timestamp}-${idx}`}
                    className="flex gap-2 py-0.5 hover:bg-slate-800/40 rounded px-1"
                  >
                    <span className="text-slate-500 tabular-nums shrink-0">
                      {shortTime(entry.timestamp)}
                    </span>
                    <span className={`shrink-0 font-bold ${tagColor(entry.tag)}`}>
                      [{entry.tag}]
                    </span>
                    <span className={`flex-1 break-words ${LEVEL_COLOR[entry.level]}`}>
                      {entry.message}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}

export default DebugPanel
