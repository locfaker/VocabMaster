// ============================================
// Stats Page - Learning Statistics
// ============================================

import { useEffect, useState, memo } from 'react'
import { Flame, Target, Trophy } from 'lucide-react'
import { format } from 'date-fns'
import { getLastNDays } from '@/utils/date'
import { DB } from '@/constants'
import type { DailyStats } from '@/types'

// ============================================
// Types
// ============================================

interface DayData {
    date: string
    day: string
    words: number
}

interface TotalStats {
    words: number
    streak: number
    xp: number
}

// ============================================
// Main Component
// ============================================

export function Stats() {
    const [weeklyData, setWeeklyData] = useState<DayData[]>([])
    const [totalStats, setTotalStats] = useState<TotalStats>({ words: 0, streak: 0, xp: 0 })

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const dates = getLastNDays(7)

            // Fetch weekly data
            const data = await Promise.all(
                dates.map(async (date) => {
                    const stat = await window.electronAPI.dbGet<DailyStats>(
                        'SELECT * FROM stats WHERE date = ?',
                        [date]
                    )
                    return {
                        date,
                        day: format(new Date(date), 'EEE'),
                        words: stat?.words_reviewed ?? 0,
                    }
                })
            )
            setWeeklyData(data)

            // Fetch totals
            const [totals, streakResult] = await Promise.all([
                window.electronAPI.dbGet<{ words: number; xp: number }>(
                    'SELECT SUM(words_reviewed) as words, SUM(xp_earned) as xp FROM stats'
                ),
                window.electronAPI.dbGet<{ value: string }>(
                    'SELECT value FROM settings WHERE key = ?',
                    [DB.SETTINGS_KEYS.STREAK]
                ),
            ])

            setTotalStats({
                words: totals?.words ?? 0,
                streak: parseInt(streakResult?.value ?? '0'),
                xp: totals?.xp ?? 0,
            })
        } catch (e) {
            console.error('loadStats error:', e)
        }
    }

    const maxWords = Math.max(...weeklyData.map((d) => d.words), 1)

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Thống kê</h1>

            <SummaryCards stats={totalStats} />
            <WeeklyChart data={weeklyData} maxWords={maxWords} />
            <DailyDetails data={weeklyData} />
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

interface SummaryCardsProps {
    stats: TotalStats
}

const SummaryCards = memo(function SummaryCards({ stats }: SummaryCardsProps) {
    const cards = [
        { icon: Flame, value: stats.streak, label: 'ngày liên tục', title: 'Streak', color: 'orange' },
        { icon: Target, value: stats.words, label: 'từ vựng', title: 'Đã học', color: 'blue' },
        { icon: Trophy, value: stats.xp, label: 'điểm kinh nghiệm', title: 'Tổng XP', color: 'purple' },
    ]

    return (
        <div className="grid grid-cols-3 gap-4">
            {cards.map(({ icon: Icon, value, label, title, color }) => (
                <div key={title} className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className={`p-2 bg-${color}-100 dark:bg-${color}-900/30 rounded-lg`}>
                            <Icon className={`text-${color}-500`} size={20} />
                        </div>
                        <span className="text-gray-500">{title}</span>
                    </div>
                    <p className="text-3xl font-bold">{value}</p>
                    <p className="text-sm text-gray-400">{label}</p>
                </div>
            ))}
        </div>
    )
})

interface WeeklyChartProps {
    data: DayData[]
    maxWords: number
}

const WeeklyChart = memo(function WeeklyChart({ data, maxWords }: WeeklyChartProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-6">7 ngày qua</h2>
            <div className="flex items-end justify-between h-40 gap-2">
                {data.map((day) => (
                    <div key={day.date} className="flex-1 flex flex-col items-center">
                        <div
                            className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative"
                            style={{ height: '120px' }}
                        >
                            <div
                                className="absolute bottom-0 w-full bg-primary-500 rounded-t-lg transition-all"
                                style={{
                                    height: `${(day.words / maxWords) * 100}%`,
                                    minHeight: day.words > 0 ? '4px' : '0',
                                }}
                            />
                        </div>
                        <p className="text-xs text-gray-500 mt-2">{day.day}</p>
                        <p className="text-xs font-medium">{day.words}</p>
                    </div>
                ))}
            </div>
        </div>
    )
})

interface DailyDetailsProps {
    data: DayData[]
}

const DailyDetails = memo(function DailyDetails({ data }: DailyDetailsProps) {
    const DAILY_GOAL = 20

    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
            <h2 className="text-lg font-semibold mb-4">Chi tiết</h2>
            <div className="space-y-3">
                {[...data].reverse().map((day) => (
                    <div key={day.date} className="flex items-center gap-4">
                        <span className="w-24 text-sm text-gray-500">
                            {format(new Date(day.date), 'dd/MM')}
                        </span>
                        <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                                className="h-full bg-primary-500 rounded-full transition-all"
                                style={{ width: `${Math.min((day.words / DAILY_GOAL) * 100, 100)}%` }}
                            />
                        </div>
                        <span className="w-16 text-right text-sm font-medium">{day.words} từ</span>
                    </div>
                ))}
            </div>
        </div>
    )
})
