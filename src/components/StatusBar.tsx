import React, { useEffect, useState } from 'react'

export const StatusBar: React.FC = () => {
  const [time, setTime] = useState('09:41')

  useEffect(() => {
    const updateTime = () => {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('pt-BR', {
          hour: '2-digit',
          minute: '2-digit',
        }),
      )
    }
    updateTime()
    const interval = setInterval(updateTime, 10000)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="w-full h-11 px-6 flex items-center justify-between text-xs font-semibold text-slate-800 select-none z-30 shrink-0">
      <span className="tracking-tight tabular-nums font-medium text-[13px]">{time}</span>
      <div className="flex items-center gap-1.5 text-slate-700">
        {/* Signal Bars */}
        <div className="flex items-end gap-[2px] h-2.5">
          <span className="w-[3px] h-1 bg-slate-800 rounded-sm" />
          <span className="w-[3px] h-1.5 bg-slate-800 rounded-sm" />
          <span className="w-[3px] h-2 bg-slate-800 rounded-sm" />
          <span className="w-[3px] h-2.5 bg-slate-800 rounded-sm" />
        </div>
        {/* Wifi Icon */}
        <svg
          className="w-3.5 h-3.5 text-slate-800"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
          <line x1="12" y1="20" x2="12.01" y2="20" />
        </svg>
        {/* Battery Icon */}
        <div className="flex items-center">
          <div className="w-5 h-2.5 border-[1.5px] border-slate-800 rounded-[3px] p-[1px] flex items-center">
            <div className="w-3 h-1.5 bg-slate-800 rounded-[1px]" />
          </div>
          <div className="w-[1.5px] h-1 bg-slate-800 rounded-r-[1px] -ml-[0.5px]" />
        </div>
      </div>
    </div>
  )
}
