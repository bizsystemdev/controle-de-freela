import React from 'react'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
  showText?: boolean
  variant?: 'red' | 'indigo' | 'dark' | 'white'
}

export const AppLogo: React.FC<AppLogoProps> = ({
  size = 'md',
  className = '',
  showText = false,
  variant = 'indigo',
}) => {
  const sizeClasses = {
    sm: 'w-9 h-9 rounded-xl',
    md: 'w-12 h-12 rounded-2xl',
    lg: 'w-16 h-16 rounded-3xl shadow-lg shadow-indigo-600/20',
    xl: 'w-24 h-24 rounded-3xl shadow-xl shadow-indigo-600/30',
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-6 h-6',
    lg: 'w-8 h-8',
    xl: 'w-12 h-12',
  }

  const bgClasses: Record<string, string> = {
    indigo: 'bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white',
    red: 'bg-gradient-to-tr from-indigo-700 via-indigo-600 to-violet-600 text-white',
    dark: 'bg-slate-900 text-white',
    white: 'bg-white text-indigo-600 border border-slate-200 shadow-sm',
  }

  const actualVariantBg = bgClasses[variant] || bgClasses.indigo

  return (
    <div className={`inline-flex items-center gap-3 ${className}`}>
      <div
        className={`${actualVariantBg} flex items-center justify-center shrink-0 transition-transform ${sizeClasses[size]}`}
      >
        {/* Modern Stylized Check / Pin Icon */}
        <svg
          className={`${iconSizes[size]} ${variant === 'white' ? 'text-indigo-600' : 'text-white'}`}
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
          <path d="m9 10 2 2 4-4" />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className="text-xl font-extrabold tracking-tight text-slate-900 leading-none">
            Freela <span className="text-indigo-600">Check</span>
          </span>
          <span className="text-[10px] text-slate-400 font-medium tracking-wider uppercase mt-0.5">
            Controle de Presença
          </span>
        </div>
      )}
    </div>
  )
}
