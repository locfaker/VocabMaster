// ============================================
// Sidebar Navigation Component
// ============================================

import { memo, useCallback } from 'react'
import { NavLink } from 'react-router-dom'
import {
    Home,
    BookOpen,
    FolderOpen,
    BarChart3,
    Settings,
    Library,
    Zap,
    HelpCircle,
    Keyboard,
    Trophy,
    Minimize2,
    LucideIcon,
} from 'lucide-react'
import { APP_INFO } from '@/constants'

// ============================================
// Navigation Items
// ============================================

interface NavItem {
    to: string
    icon: LucideIcon
    label: string
}

const NAV_ITEMS: NavItem[] = [
    { to: '/', icon: Home, label: 'Tổng quan' },
    { to: '/learn', icon: BookOpen, label: 'Flashcard' },
    { to: '/quiz', icon: HelpCircle, label: 'Quiz' },
    { to: '/typing', icon: Keyboard, label: 'Luyện gõ' },
    { to: '/decks', icon: FolderOpen, label: 'Bộ từ vựng' },
    { to: '/library', icon: Library, label: 'Kho tài liệu' },
    { to: '/stats', icon: BarChart3, label: 'Thống kê' },
    { to: '/achievements', icon: Trophy, label: 'Thành tích' },
    { to: '/settings', icon: Settings, label: 'Cài đặt' },
]

// ============================================
// Component
// ============================================

export const Sidebar = memo(function Sidebar() {
    const handleMiniMode = useCallback(() => {
        window.electronAPI.openMiniMode()
    }, [])

    return (
        <aside className="w-64 h-full flex flex-col glass border-r-0 z-50">
            {/* Logo */}
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <Zap className="text-white" size={24} fill="currentColor" />
                </div>
                <div>
                    <h1 className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        {APP_INFO.NAME}
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {APP_INFO.EDITION}
                    </p>
                </div>
            </div>

            {/* Navigation */}
            <nav className="flex-1 px-4 py-2 space-y-1.5">
                {NAV_ITEMS.map((item) => (
                    <NavItem key={item.to} {...item} />
                ))}
            </nav>

            {/* Mini Mode Button */}
            <button
                onClick={handleMiniMode}
                className="mx-4 mb-2 flex items-center gap-2 px-4 py-3 rounded-xl bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors text-gray-600 dark:text-gray-400"
            >
                <Minimize2 size={18} />
                <span className="text-sm">Mini Mode</span>
            </button>

            {/* Tip Card */}
            <TipCard />
        </aside>
    )
})

// ============================================
// Sub-components
// ============================================

const NavItem = memo(function NavItem({ to, icon: Icon, label }: NavItem) {
    return (
        <NavLink
            to={to}
            className={({ isActive }) =>
                `relative flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-300 group ${isActive
                    ? 'bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 font-semibold shadow-sm'
                    : 'text-gray-600 dark:text-gray-400 hover:bg-white/50 dark:hover:bg-white/5 hover:text-primary-600 dark:hover:text-primary-300'
                }`
            }
        >
            {({ isActive }) => (
                <>
                    <Icon
                        size={22}
                        className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'
                            }`}
                    />
                    <span className="text-[15px]">{label}</span>
                    {isActive && (
                        <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                    )}
                </>
            )}
        </NavLink>
    )
})

const TipCard = memo(function TipCard() {
    return (
        <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 relative overflow-hidden group">
            <div className="relative z-10">
                <h3 className="font-bold text-sm mb-1">Mẹo học tập</h3>
                <p className="text-xs text-primary-100 leading-relaxed">
                    Ôn tập mỗi ngày 15 phút để duy trì Streak!
                </p>
            </div>
            <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
        </div>
    )
})
