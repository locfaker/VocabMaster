import { NavLink } from 'react-router-dom'
import { Home, BookOpen, FolderOpen, BarChart3, Settings, Library, Zap } from 'lucide-react'

const navItems = [
    { to: '/', icon: Home, label: 'Tổng quan' },
    { to: '/learn', icon: BookOpen, label: 'Học ngay' },
    { to: '/decks', icon: FolderOpen, label: 'Bộ từ vựng' },
    { to: '/library', icon: Library, label: 'Kho tài liệu' },
    { to: '/stats', icon: BarChart3, label: 'Thống kê' },
    { to: '/settings', icon: Settings, label: 'Cài đặt' }
]

export function Sidebar() {
    return (
        <aside className="w-64 h-full flex flex-col glass border-r-0 z-50">
            <div className="p-6 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-lg shadow-primary-500/30">
                    <Zap className="text-white" size={24} fill="currentColor" />
                </div>
                <div>
                    <h1 className="font-display font-bold text-lg tracking-tight bg-gradient-to-r from-primary-600 to-primary-400 bg-clip-text text-transparent">
                        VocabMaster
                    </h1>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">Pro Edition</p>
                </div>
            </div>

            <nav className="flex-1 px-4 py-2 space-y-1.5">
                {navItems.map(({ to, icon: Icon, label }) => (
                    <NavLink
                        key={to}
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
                                    className={`transition-transform duration-300 group-hover:scale-110 ${isActive ? 'stroke-[2.5px]' : 'stroke-[1.5px]'}`} 
                                />
                                <span className="text-[15px]">{label}</span>
                                {isActive && (
                                    <div className="absolute right-3 w-1.5 h-1.5 rounded-full bg-primary-500 shadow-[0_0_8px_rgba(99,102,241,0.6)]" />
                                )}
                            </>
                        )}
                    </NavLink>
                ))}
            </nav>

            <div className="p-4 m-4 rounded-2xl bg-gradient-to-br from-primary-500 to-primary-600 text-white shadow-lg shadow-primary-500/25 relative overflow-hidden group">
                <div className="relative z-10">
                    <h3 className="font-bold text-sm mb-1">Mẹo học tập</h3>
                    <p className="text-xs text-primary-100 leading-relaxed">
                        Ôn tập mỗi ngày 15 phút để duy trì Streak!
                    </p>
                </div>
                <div className="absolute -right-4 -bottom-4 w-20 h-20 bg-white/10 rounded-full blur-xl group-hover:scale-150 transition-transform duration-700" />
            </div>
        </aside>
    )
}
