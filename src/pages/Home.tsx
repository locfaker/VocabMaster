import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Flame, BookOpen, RefreshCw, CheckCircle, ArrowRight, Activity, Trophy } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useDeckStore } from '@/store/deckStore'
import { useLearningStore } from '@/store/learningStore'

export function Home() {
    const { decks, fetchDecks } = useDeckStore()
    const { todayStats, streak, totalXP, fetchTodayStats, fetchUserStats, fetchTodayWords, todayWords } = useLearningStore()
    const [counts, setCounts] = useState({ new: 0, review: 0, mastered: 0 })

    useEffect(() => {
        fetchDecks()
        fetchTodayStats()
        fetchUserStats()
        fetchTodayWords()
        loadCounts()
    }, [])

    const loadCounts = async () => {
        try {
            const newCount = await window.electronAPI.dbGet<{ count: number }>("SELECT COUNT(*) as count FROM progress WHERE status = 'new' OR status IS NULL")
            const reviewCount = await window.electronAPI.dbGet<{ count: number }>("SELECT COUNT(*) as count FROM progress WHERE status IN ('learning', 'review')")
            const masteredCount = await window.electronAPI.dbGet<{ count: number }>("SELECT COUNT(*) as count FROM progress WHERE status = 'mastered'")
            setCounts({
                new: newCount?.count || 0,
                review: reviewCount?.count || 0,
                mastered: masteredCount?.count || 0
            })
        } catch (e) {
            console.error('loadCounts error:', e)
        }
    }

    const dailyGoal = 20
    const progress = todayStats ? Math.min((todayStats.words_reviewed / dailyGoal) * 100, 100) : 0

    return (
        <div className="p-8 max-w-6xl mx-auto space-y-8">
            {/* Welcome Header */}
            <div className="flex items-center justify-between animate-float">
                <div>
                    <h1 className="text-4xl font-display font-bold text-gray-900 dark:text-white mb-2">
                        Chào buổi sáng! 👋
                    </h1>
                    <p className="text-gray-500 dark:text-gray-400 text-lg">
                        Hôm nay bạn muốn chinh phục bao nhiêu từ vựng?
                    </p>
                </div>
                <div className="flex items-center gap-4">
                    <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg text-orange-500">
                            <Flame size={24} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Streak</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{streak} ngày</p>
                        </div>
                    </div>
                    <div className="glass px-6 py-3 rounded-2xl flex items-center gap-3">
                        <div className="p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg text-yellow-600">
                            <Trophy size={24} fill="currentColor" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">Total XP</p>
                            <p className="text-xl font-bold text-gray-900 dark:text-white">{totalXP}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Progress Card */}
            <div className="glass rounded-3xl p-8 relative overflow-hidden group">
                <div className="absolute top-0 right-0 w-64 h-64 bg-primary-500/10 rounded-full blur-3xl group-hover:bg-primary-500/20 transition-colors duration-500" />
                
                <div className="relative z-10 flex items-end justify-between">
                    <div className="max-w-lg">
                        <div className="flex items-center gap-2 text-primary-600 dark:text-primary-400 mb-4">
                            <Activity size={20} />
                            <span className="font-semibold">Mục tiêu hàng ngày</span>
                        </div>
                        <h2 className="text-3xl font-bold mb-6 text-gray-900 dark:text-white">
                            Bạn đã học <span className="text-primary-600">{todayStats?.words_reviewed || 0}</span> / {dailyGoal} từ
                        </h2>
                        
                        <div className="space-y-2 mb-8">
                            <div className="flex justify-between text-sm font-medium">
                                <span className="text-gray-600 dark:text-gray-300">Tiến độ</span>
                                <span className="text-primary-600">{Math.round(progress)}%</span>
                            </div>
                            <div className="h-4 bg-gray-100 dark:bg-gray-700/50 rounded-full overflow-hidden p-1">
                                <div 
                                    className="h-full bg-gradient-to-r from-primary-500 to-primary-600 rounded-full transition-all duration-1000 ease-out shadow-lg shadow-primary-500/20" 
                                    style={{ width: `${progress}%` }} 
                                />
                            </div>
                        </div>

                        <Link to="/learn" onClick={() => useLearningStore.getState().startSession()}>
                            <button className="btn-primary px-8 py-4 rounded-xl font-bold text-lg flex items-center gap-3 transition-transform hover:scale-105 active:scale-95">
                                🎯 Bắt đầu phiên học
                                <span className="bg-white/20 px-2 py-0.5 rounded text-sm">
                                    {todayWords.length} từ
                                </span>
                                <ArrowRight size={20} />
                            </button>
                        </Link>
                    </div>
                    
                    {/* Illustration/Graphic placeholder */}
                    <div className="hidden md:block text-[10rem] leading-none opacity-20 select-none filter blur-[1px]">
                        🎓
                    </div>
                </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-3 gap-6">
                {[
                    { label: 'Từ mới', count: counts.new, icon: BookOpen, color: 'blue' },
                    { label: 'Cần ôn tập', count: counts.review, icon: RefreshCw, color: 'yellow' },
                    { label: 'Đã thuộc', count: counts.mastered, icon: CheckCircle, color: 'green' }
                ].map((item) => (
                    <div key={item.label} className="glass p-6 rounded-2xl card-hover flex items-center gap-5">
                        <div className={`p-4 rounded-2xl bg-${item.color}-100 dark:bg-${item.color}-900/20 text-${item.color}-600 shadow-sm`}>
                            <item.icon size={28} />
                        </div>
                        <div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{item.count}</p>
                            <p className="text-gray-500 font-medium">{item.label}</p>
                        </div>
                    </div>
                ))}
            </div>

            {/* Recent Decks */}
            <div>
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                        <span className="w-1 h-6 bg-primary-500 rounded-full" />
                        Bộ từ của bạn
                    </h2>
                    <Link to="/decks" className="text-primary-600 font-medium hover:text-primary-700 transition-colors">
                        Xem tất cả
                    </Link>
                </div>
                
                {decks.length === 0 ? (
                    <div className="glass rounded-2xl p-12 text-center border-dashed border-2 border-gray-300 dark:border-gray-700">
                        <p className="text-gray-500 text-lg mb-6">Chưa có bộ từ nào được tạo</p>
                        <Link to="/library">
                            <Button variant="outline" className="border-primary-500 text-primary-600 hover:bg-primary-50">
                                📚 Khám phá Kho Từ Vựng
                            </Button>
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-3 gap-6">
                        {decks.slice(0, 3).map((deck) => (
                            <Link key={deck.id} to={`/decks/${deck.id}`}
                                className="glass p-6 rounded-2xl card-hover group relative overflow-hidden">
                                <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-transparent to-gray-100 dark:to-white/5 rounded-bl-[100px] -mr-4 -mt-4 transition-transform group-hover:scale-110" />
                                
                                <div className="relative z-10">
                                    <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl mb-4 shadow-sm"
                                        style={{ backgroundColor: deck.color + '20' }}>
                                        {deck.icon}
                                    </div>
                                    <h3 className="font-bold text-lg mb-1 text-gray-900 dark:text-white truncate">
                                        {deck.name}
                                    </h3>
                                    <p className="text-gray-500 text-sm font-medium">
                                        {deck.word_count} từ vựng
                                    </p>
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
