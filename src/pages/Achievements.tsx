// ============================================
// Achievements Page
// ============================================

import { useEffect, memo } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react'
import { useAchievementStore } from '@/store/achievementStore'
import { useLearningStore } from '@/store/learningStore'
import { calculateLevel } from '@/utils/sm2'
import type { Achievement } from '@/types'

// ============================================
// Main Component
// ============================================

export function Achievements() {
    const { achievements, fetchAchievements } = useAchievementStore()
    const { totalXP, fetchUserStats } = useLearningStore()

    useEffect(() => {
        fetchAchievements()
        fetchUserStats()
    }, [fetchAchievements, fetchUserStats])

    const levelInfo = calculateLevel(totalXP)
    const unlockedCount = achievements.filter((a) => a.unlocked_at).length
    const totalXPFromAchievements = achievements
        .filter((a) => a.unlocked_at)
        .reduce((sum, a) => sum + a.xp_reward, 0)

    return (
        <div className="p-8">
            <Header unlockedCount={unlockedCount} totalCount={achievements.length} />
            <LevelCard levelInfo={levelInfo} totalXP={totalXP} />
            <StatsCards
                unlockedCount={unlockedCount}
                totalXPFromAchievements={totalXPFromAchievements}
                level={levelInfo.level}
            />
            <AchievementsGrid achievements={achievements} />
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

interface HeaderProps {
    unlockedCount: number
    totalCount: number
}

const Header = memo(function Header({ unlockedCount, totalCount }: HeaderProps) {
    return (
        <div className="flex items-center gap-4 mb-8">
            <Link to="/" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                <ArrowLeft size={20} />
            </Link>
            <div>
                <h1 className="text-2xl font-bold">Thành tích</h1>
                <p className="text-gray-500">{unlockedCount}/{totalCount} đã mở khóa</p>
            </div>
        </div>
    )
})

interface LevelCardProps {
    levelInfo: ReturnType<typeof calculateLevel>
    totalXP: number
}

const LevelCard = memo(function LevelCard({ levelInfo, totalXP }: LevelCardProps) {
    return (
        <div className="bg-gradient-to-r from-primary-500 to-purple-500 rounded-2xl p-6 text-white mb-8">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <p className="text-white/80 text-sm">Cấp độ hiện tại</p>
                    <h2 className="text-3xl font-bold">Level {levelInfo.level}</h2>
                    <p className="text-white/90">{levelInfo.title}</p>
                </div>
                <div className="text-right">
                    <p className="text-4xl font-bold">{totalXP}</p>
                    <p className="text-white/80 text-sm">Tổng XP</p>
                </div>
            </div>
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span>Tiến độ lên level tiếp theo</span>
                    <span>{Math.round(levelInfo.progress)}%</span>
                </div>
                <div className="h-3 bg-white/30 rounded-full overflow-hidden">
                    <div
                        className="h-full bg-white rounded-full transition-all"
                        style={{ width: `${levelInfo.progress}%` }}
                    />
                </div>
                <p className="text-sm text-white/70 text-right">
                    {totalXP} / {levelInfo.nextLevelXP} XP
                </p>
            </div>
        </div>
    )
})

interface StatsCardsProps {
    unlockedCount: number
    totalXPFromAchievements: number
    level: number
}

const StatsCards = memo(function StatsCards({
    unlockedCount,
    totalXPFromAchievements,
    level,
}: StatsCardsProps) {
    return (
        <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-primary-500">{unlockedCount}</p>
                <p className="text-sm text-gray-500">Huy hiệu</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-green-500">{totalXPFromAchievements}</p>
                <p className="text-sm text-gray-500">XP từ thành tích</p>
            </div>
            <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center">
                <p className="text-3xl font-bold text-purple-500">{level}</p>
                <p className="text-sm text-gray-500">Level</p>
            </div>
        </div>
    )
})

interface AchievementsGridProps {
    achievements: Achievement[]
}

const AchievementsGrid = memo(function AchievementsGrid({ achievements }: AchievementsGridProps) {
    return (
        <div className="grid grid-cols-2 gap-4">
            {achievements.map((achievement) => (
                <AchievementCard key={achievement.id} achievement={achievement} />
            ))}
        </div>
    )
})

interface AchievementCardProps {
    achievement: Achievement
}

const AchievementCard = memo(function AchievementCard({ achievement }: AchievementCardProps) {
    const isUnlocked = !!achievement.unlocked_at
    const progressPercent = (achievement.progress / achievement.target) * 100

    return (
        <div
            className={`relative rounded-xl p-5 transition-all ${isUnlocked
                    ? 'bg-white dark:bg-gray-800 shadow-md'
                    : 'bg-gray-100 dark:bg-gray-800/50 opacity-75'
                }`}
        >
            <div className="flex items-start gap-4">
                <div
                    className={`w-14 h-14 rounded-xl flex items-center justify-center text-3xl ${isUnlocked
                            ? 'bg-primary-100 dark:bg-primary-900/30'
                            : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                >
                    {isUnlocked ? achievement.icon : <Lock size={24} className="text-gray-400" />}
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h3 className={`font-semibold truncate ${!isUnlocked && 'text-gray-500'}`}>
                            {achievement.name}
                        </h3>
                        {isUnlocked && <CheckCircle size={16} className="text-green-500 flex-shrink-0" />}
                    </div>
                    <p className="text-sm text-gray-500 truncate">{achievement.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                        <span className="text-xs font-medium text-primary-500">
                            +{achievement.xp_reward} XP
                        </span>
                        {!isUnlocked && (
                            <span className="text-xs text-gray-400">
                                {achievement.progress}/{achievement.target}
                            </span>
                        )}
                    </div>
                </div>
            </div>

            {!isUnlocked && (
                <div className="mt-3">
                    <div className="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                            className="h-full bg-primary-500 rounded-full transition-all"
                            style={{ width: `${progressPercent}%` }}
                        />
                    </div>
                </div>
            )}

            {isUnlocked && achievement.unlocked_at && (
                <div className="absolute top-2 right-2">
                    <span className="text-xs text-gray-400">
                        {new Date(achievement.unlocked_at).toLocaleDateString('vi-VN')}
                    </span>
                </div>
            )}
        </div>
    )
})
