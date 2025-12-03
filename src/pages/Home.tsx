// ============================================
// Home Page - Dashboard
// ============================================

import { useEffect, useState, memo, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
    Flame,
    BookOpen,
    RefreshCw,
    CheckCircle,
    ArrowRight,
    HelpCircle,
    Keyboard,
    Trophy,
    Zap,
} from 'lucide-react'
import { Button } from '@/components/common/Button'
import { useDeckStore } from '@/store/deckStore'
import { useLearningStore } from '@/store/learningStore'
import { calculateLevel } from '@/utils/sm2'
import { getGreeting } from '@/utils/date'
import { LEARNING, WORD_STATUS } from '@/constants'
import type { Deck } from '@/types'

// ============================================
// Types
// ============================================

interface WordCounts {
    new: number
    review: number
    mastered: number
}

// ============================================
// Main Component
// ============================================

export function Home() {
    const { decks, fetchDecks } = useDeckStore()
    const {
        todayStats,
        streak,
        totalXP,
        fetchTodayStats,
        fetchUserStats,
        fetchTodayWords,
        todayWords,
    } = useLearningStore()

    const [counts, setCounts] = useState<WordCounts>({ new: 0, review: 0, mastered: 0 })

    // Load data on mount
    useEffect(() => {
        fetchDecks()
        fetchTodayStats()
        fetchUserStats()
        fetchTodayWords()
        loadCounts()
    }, [])

    const loadCounts = useCallback(async () => {
        try {
            const [newCount, reviewCount, masteredCount] = await Promise.all([
                window.electronAPI.dbGet<{ count: number }>(
                    `SELECT COUNT(*) as count FROM progress WHERE status = '${WORD_STATUS.NEW}' OR status IS NULL`
                ),
                window.electronAPI.dbGet<{ count: number }>(
                    `SELECT COUNT(*) as count FROM progress WHERE status IN ('${WORD_STATUS.LEARNING}', '${WORD_STATUS.REVIEW}')`
                ),
                window.electronAPI.dbGet<{ count: number }>(
                    `SELECT COUNT(*) as count FROM progress WHERE status = '${WORD_STATUS.MASTERED}'`
                ),
            ])

            setCounts({
                new: newCount?.count ?? 0,
                review: reviewCount?.count ?? 0,
                mastered: masteredCount?.count ?? 0,
            })
        } catch (e) {
            console.error('loadCounts error:', e)
        }
    }, [])

    const dailyGoal = LEARNING.DEFAULT_DAILY_GOAL
    const progress = todayStats
        ? Math.min((todayStats.words_reviewed / dailyGoal) * 100, 100)
        : 0
    const levelInfo = calculateLevel(totalXP)

    return (
        <div className="p-8 space-y-8">
            {/* Header */}
            <HeaderSection streak={streak} level={levelInfo.level} />

            {/* Level Progress */}
            <LevelProgressCard levelInfo={levelInfo} totalXP={totalXP} />

            {/* Today's Progress */}
            <TodayProgressCard
                wordsReviewed={todayStats?.words_reviewed ?? 0}
                dailyGoal={dailyGoal}
                progress={progress}
                pendingWords={todayWords.length}
            />

            {/* Study Modes */}
            <StudyModesSection />

            {/* Stats Cards */}
            <StatsCardsSection counts={counts} />

            {/* Recent Decks */}
            <RecentDecksSection decks={decks} />

            {/* Today's Scores */}
            {todayStats && (todayStats.quiz_score > 0 || todayStats.typing_score > 0) && (
                <TodayScoresCard
                    quizScore={todayStats.quiz_score}
                    typingScore={todayStats.typing_score}
                />
            )}
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

interface HeaderSectionProps {
    streak: number
    level: number
}

const HeaderSection = memo(function HeaderSection({ streak, level }: HeaderSectionProps) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
                    {getGreeting()} 👋
                </h1>
                <p className="text-gray-500">Sẵn sàng học từ vựng mới?</p>
            </div>
            <div className="flex items-center gap-4">
                <Link
                    to="/achievements"
                    className="flex items-center gap-2 bg-purple-100 dark:bg-purple-900/30 px-4 py-2 rounded-full hover:bg-purple-200 transition-colors"
                >
                    <Trophy className="text-purple-500" size={20} />
                    <span className="font-semibold text-purple-600 dark:text-purple-400">
                        Lv.{level}
                    </span>
                </Link>
                <div className="flex items-center gap-2 bg-orange-100 dark:bg-orange-900/30 px-4 py-2 rounded-full">
                    <Flame className="text-orange-500" size={20} />
                    <span className="font-semibold text-orange-600 dark:text-orange-400">
                        {streak} ngày
                    </span>
                </div>
            </div>
        </div>
    )
})

interface LevelProgressCardProps {
    levelInfo: ReturnType<typeof calculateLevel>
    totalXP: number
}

const LevelProgressCard = memo(function LevelProgressCard({
    levelInfo,
    totalXP,
}: LevelProgressCardProps) {
    return (
        <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-xl p-4 text-white">
            <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                    <Zap size={20} />
                    <span className="font-medium">{levelInfo.title}</span>
                </div>
                <span className="text-sm">{totalXP} XP</span>
            </div>
            <div className="h-2 bg-white/30 rounded-full overflow-hidden">
                <div
                    className="h-full bg-white rounded-full transition-all"
                    style={{ width: `${levelInfo.progress}%` }}
                />
            </div>
        </div>
    )
})

interface TodayProgressCardProps {
    wordsReviewed: number
    dailyGoal: number
    progress: number
    pendingWords: number
}

const TodayProgressCard = memo(function TodayProgressCard({
    wordsReviewed,
    dailyGoal,
    progress,
    pendingWords,
}: TodayProgressCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Tiến độ hôm nay</h2>
            <div className="mb-4">
                <div className="flex justify-between text-sm mb-2">
                    <span className="text-gray-500">
                        {wordsReviewed} / {dailyGoal} từ
                    </span>
                    <span className="text-primary-500 font-medium">
                        {Math.round(progress)}%
                    </span>
                </div>
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary-500 rounded-full transition-all"
                        style={{ width: `${progress}%` }}
                    />
                </div>
            </div>
            <Link to="/learn">
                <Button className="w-full" size="lg">
                    🎯 Bắt đầu học ({pendingWords} từ chờ ôn)
                    <ArrowRight size={18} className="ml-2" />
                </Button>
            </Link>
        </div>
    )
})

const StudyModesSection = memo(function StudyModesSection() {
    const modes = [
        { to: '/learn', icon: BookOpen, label: 'Flashcard', desc: 'Lật thẻ học từ', color: 'blue' },
        { to: '/quiz', icon: HelpCircle, label: 'Quiz', desc: 'Trắc nghiệm 4 đáp án', color: 'green' },
        { to: '/typing', icon: Keyboard, label: 'Luyện gõ', desc: 'Kiểm tra spelling', color: 'purple' },
    ]

    return (
        <div>
            <h2 className="text-lg font-semibold mb-4">Chế độ học</h2>
            <div className="grid grid-cols-3 gap-4">
                {modes.map(({ to, icon: Icon, label, desc, color }) => (
                    <Link
                        key={to}
                        to={to}
                        className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all group"
                    >
                        <div
                            className={`w-12 h-12 rounded-xl bg-${color}-100 dark:bg-${color}-900/30 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform`}
                        >
                            <Icon className={`text-${color}-500`} size={24} />
                        </div>
                        <h3 className="font-semibold mb-1">{label}</h3>
                        <p className="text-sm text-gray-500">{desc}</p>
                    </Link>
                ))}
            </div>
        </div>
    )
})

interface StatsCardsSectionProps {
    counts: WordCounts
}

const StatsCardsSection = memo(function StatsCardsSection({ counts }: StatsCardsSectionProps) {
    const stats = [
        { icon: BookOpen, value: counts.new, label: 'Mới', color: 'blue' },
        { icon: RefreshCw, value: counts.review, label: 'Đang học', color: 'yellow' },
        { icon: CheckCircle, value: counts.mastered, label: 'Thuộc', color: 'green' },
    ]

    return (
        <div className="grid grid-cols-3 gap-4">
            {stats.map(({ icon: Icon, value, label, color }) => (
                <div key={label} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
                    <div className="flex items-center gap-3">
                        <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                            <Icon className={`text-${color}-500`} size={20} />
                        </div>
                        <div>
                            <p className="text-2xl font-bold">{value}</p>
                            <p className="text-sm text-gray-500">{label}</p>
                        </div>
                    </div>
                </div>
            ))}
        </div>
    )
})

interface RecentDecksSectionProps {
    decks: Deck[]
}

const RecentDecksSection = memo(function RecentDecksSection({ decks }: RecentDecksSectionProps) {
    return (
        <div>
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">Bộ từ của bạn</h2>
                <Link to="/decks" className="text-primary-500 text-sm hover:underline">
                    Xem tất cả
                </Link>
            </div>
            {decks.length === 0 ? (
                <div className="bg-white dark:bg-gray-800 rounded-xl p-8 text-center">
                    <p className="text-gray-500 mb-4">Chưa có bộ từ nào</p>
                    <Link to="/library">
                        <Button>📚 Khám phá Kho Từ Vựng</Button>
                    </Link>
                </div>
            ) : (
                <div className="grid grid-cols-3 gap-4">
                    {decks.slice(0, 3).map((deck) => (
                        <DeckCard key={deck.id} deck={deck} />
                    ))}
                </div>
            )}
        </div>
    )
})

interface DeckCardProps {
    deck: Deck
}

const DeckCard = memo(function DeckCard({ deck }: DeckCardProps) {
    return (
        <Link
            to={`/decks/${deck.id}`}
            className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm hover:shadow-md transition-shadow"
        >
            <div
                className="w-10 h-10 rounded-lg flex items-center justify-center text-xl mb-3"
                style={{ backgroundColor: deck.color + '20' }}
            >
                {deck.icon}
            </div>
            <h3 className="font-semibold truncate">{deck.name}</h3>
            <p className="text-sm text-gray-500">{deck.word_count} từ</p>
        </Link>
    )
})

interface TodayScoresCardProps {
    quizScore: number
    typingScore: number
}

const TodayScoresCard = memo(function TodayScoresCard({
    quizScore,
    typingScore,
}: TodayScoresCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm">
            <h3 className="font-semibold mb-3">Điểm hôm nay</h3>
            <div className="flex gap-6">
                {quizScore > 0 && (
                    <div className="flex items-center gap-2">
                        <HelpCircle size={18} className="text-green-500" />
                        <span className="text-sm">
                            Quiz: <strong>{quizScore}</strong> điểm
                        </span>
                    </div>
                )}
                {typingScore > 0 && (
                    <div className="flex items-center gap-2">
                        <Keyboard size={18} className="text-purple-500" />
                        <span className="text-sm">
                            Typing: <strong>{typingScore}</strong> điểm
                        </span>
                    </div>
                )}
            </div>
        </div>
    )
})
