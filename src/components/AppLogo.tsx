import React from 'react'

interface AppLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl'
  className?: string
}

export const AppLogo: React.FC<AppLogoProps> = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-10 h-10 rounded-xl',
    md: 'w-14 h-14 rounded-2xl',
    lg: 'w-20 h-20 rounded-3xl shadow-lg shadow-indigo-500/25',
    xl: 'w-24 h-24 rounded-3xl shadow-xl shadow-indigo-500/30',
  }

  const iconSizes = {
    sm: 'w-5 h-5',
    md: 'w-7 h-7',
    lg: 'w-10 h-10',
    xl: 'w-12 h-12',
  }

  return (
    <div
      className={`bg-gradient-to-tr from-indigo-600 via-indigo-500 to-violet-500 flex items-center justify-center text-white shrink-0 transition-transform ${sizeClasses[size]} ${className}`}
    >
      {/* Icon representing Check-in / Presence / Fingerprint Pin */}
      <svg
        className={`${iconSizes[size]} text-white`}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M12 2a8 8 0 0 0-8 8c0 5.25 8 12 8 12s8-6.75 8-12a8 8 0 0 0-8-8z" />
        <path d="m9 10 2 2 4-4" />
      </svg>
    </div>
  )
}
