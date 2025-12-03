// ============================================
// Title Bar Component (Electron Window Controls)
// ============================================

import { memo, useCallback } from 'react'
import { Minus, Square, X } from 'lucide-react'
import { APP_INFO } from '@/constants'

export const TitleBar = memo(function TitleBar() {
    const handleMinimize = useCallback(() => window.electronAPI.minimize(), [])
    const handleMaximize = useCallback(() => window.electronAPI.maximize(), [])
    const handleClose = useCallback(() => window.electronAPI.close(), [])

    return (
        <div className="titlebar-drag h-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4">
            {/* App Title */}
            <div className="flex items-center gap-2">
                <span className="text-xl">📚</span>
                <span className="font-semibold text-gray-700 dark:text-gray-200">
                    {APP_INFO.NAME}
                </span>
            </div>

            {/* Window Controls */}
            <div className="titlebar-no-drag flex">
                <WindowButton onClick={handleMinimize} aria-label="Minimize">
                    <Minus size={16} />
                </WindowButton>
                <WindowButton onClick={handleMaximize} aria-label="Maximize">
                    <Square size={14} />
                </WindowButton>
                <WindowButton onClick={handleClose} isClose aria-label="Close">
                    <X size={16} />
                </WindowButton>
            </div>
        </div>
    )
})

// Window control button component
interface WindowButtonProps {
    onClick: () => void
    children: React.ReactNode
    isClose?: boolean
    'aria-label': string
}

const WindowButton = memo(function WindowButton({
    onClick,
    children,
    isClose,
    'aria-label': ariaLabel,
}: WindowButtonProps) {
    return (
        <button
            onClick={onClick}
            aria-label={ariaLabel}
            className={`w-10 h-10 flex items-center justify-center transition-colors ${isClose
                    ? 'hover:bg-red-500 hover:text-white'
                    : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
        >
            {children}
        </button>
    )
})
