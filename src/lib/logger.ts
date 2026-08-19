// ---------------------------------------------------------------------------
// In-memory debug logger
// ---------------------------------------------------------------------------
// A small, dependency-free logger that keeps the most recent logs in a circular
// buffer (so it never grows unbounded) AND mirrors them to the browser console
// so they are visible during normal dev / DevTools usage.
//
// The buffer is a module-level singleton: any module that imports these
// helpers reads/writes the SAME log history. This makes it trivial for the
// DebugPanel to render a live view of everything the app has logged.
// ---------------------------------------------------------------------------

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogEntry {
  /** ISO 8601 timestamp, e.g. `2024-01-31T12:34:56.789Z`. */
  timestamp: string
  level: LogLevel
  /** Short source tag, e.g. `geo`, `auth`, `api`. */
  tag: string
  message: string
  /** Optional structured payload relevant to the log. */
  data?: Record<string, unknown>
}

/** Maximum number of entries kept in memory. Older entries are dropped. */
export const MAX_LOG_ENTRIES = 200

const logBuffer: LogEntry[] = []

function consolePrint(
  level: LogLevel,
  tag: string,
  message: string,
  data?: Record<string, unknown>,
) {
  const prefix = `[${tag}] ${message}`
  switch (level) {
    case 'debug':
      // eslint-disable-next-line no-console
      console.debug(prefix, data ?? '')
      break
    case 'info':
      // eslint-disable-next-line no-console
      console.log(prefix, data ?? '')
      break
    case 'warn':
      // eslint-disable-next-line no-console
      console.warn(prefix, data ?? '')
      break
    case 'error':
      // eslint-disable-next-line no-console
      console.error(prefix, data ?? '')
      break
  }
}

function pushEntry(level: LogLevel, tag: string, message: string, data?: Record<string, unknown>) {
  const entry: LogEntry = { timestamp: new Date().toISOString(), level, tag, message }
  if (data !== undefined) entry.data = data

  logBuffer.push(entry)
  // Circular buffer: trim from the front when over capacity.
  if (logBuffer.length > MAX_LOG_ENTRIES) {
    logBuffer.splice(0, logBuffer.length - MAX_LOG_ENTRIES)
  }

  // Mirror to the browser console so it also appears in DevTools.
  consolePrint(level, tag, message, data)
}

export function logDebug(tag: string, message: string, data?: Record<string, unknown>): void {
  pushEntry('debug', tag, message, data)
}

export function logInfo(tag: string, message: string, data?: Record<string, unknown>): void {
  pushEntry('info', tag, message, data)
}

export function logWarn(tag: string, message: string, data?: Record<string, unknown>): void {
  pushEntry('warn', tag, message, data)
}

export function logError(tag: string, message: string, data?: Record<string, unknown>): void {
  pushEntry('error', tag, message, data)
}

/** Returns a shallow copy of the current log buffer (oldest -> newest). */
export function getLogs(): LogEntry[] {
  return [...logBuffer]
}

/** Clears all stored logs. */
export function clearLogs(): void {
  logBuffer.length = 0
}
