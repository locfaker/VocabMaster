import { useEffect, useState } from 'react'
import { Flame, Target, Trophy } from 'lucide-react'
import { format, subDays } from 'date-fns'
import type { DailyStats } from '@/types'

export function Stats() {
    const [weeklyData, setWeeklyData] = useState<Array<{ date: string; day: string; words: number }>>([])
    const [totalStats, setTotalStats] = useState({ words: 0, streak: 0, xp: 0 })

    useEffect(() => {
        loadStats()
    }, [])

    const loadStats = async () => {
        try {
            const dates = Array.from({ length: 7 }, (_, i) => format(subDays(new Date(), 6 - i), 'yyyy-MM-dd'))

            const data = await Promise.all(
                dates.map(async (date) => {
                    const stat = await window.electronAPI.dbGet<DailyStats>('SELECT * FROM stats WHERE date = ?', [date])
                    return {
                        date,
                        day: format(new Date(date), 'EEE'),
                        words: stat?.words_reviewed || 0
                    }
                })
            )
            setWeeklyData(data)

            const totals = await window.electronAPI.dbGet<{ words: number; xp: number }>(
                'SELECT SUM(words_reviewed) as words, SUM(xp_earned) as xp FROM stats'
            )
            const streakResult = await window.electronAPI.dbGet<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['streak'])

            setTotalStats({
                words: totals?.words || 0,
                streak: parseInt(streakResult?.value || '0'),
                xp: totals?.xp || 0
            })
        } catch (e) {
            console.error('loadStats error:', e)
        }
    }

    const maxWords = Math.max(...weeklyData.map(d => d.words), 1)

    return (
        <div className="p-8 space-y-8">
            <h1 className="text-2xl font-bold">Thống kê</h1>

            <div className="grid grid-cols-3 gap-4">
                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-orange-100 dark:bg-orange-900/30 rounded-lg">
                            <Flame className="text-orange-500" size={20} />
                        </div>
                        <span className="text-gray-500">Streak</span>
                    </div>
                    <p className="text-3xl font-bold">{totalStats.streak}</p>
                    <p className="text-sm text-gray-400">ngày liên tục</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                            <Target className="text-blue-500" size={20} />
                        </div>
                        <span className="text-gray-500">Đã học</span>
                    </div>
                    <p className="text-3xl font-bold">{totalStats.words}</p>
                    <p className="text-sm text-gray-400">từ vựng</p>
                </div>

                <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                            <Trophy className="text-purple-500" size={20} />
                        </div>
                        <span className="text-gray-500">Tổng XP</span>
                    </div>
                    <p className="text-3xl font-bold">{totalStats.xp}</p>
                    <p className="text-sm text-gray-400">điểm kinh nghiệm</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-6">7 ngày qua</h2>
                <div className="flex items-end justify-between h-40 gap-2">
                    {weeklyData.map((day) => (
                        <div key={day.date} className="flex-1 flex flex-col items-center">
                            <div className="w-full bg-gray-100 dark:bg-gray-700 rounded-t-lg relative" style={{ height: '120px' }}>
                                <div
                                    className="absolute bottom-0 w-full bg-primary-500 rounded-t-lg transition-all"
                                    style={{ height: `${(day.words / maxWords) * 100}%`, minHeight: day.words > 0 ? '4px' : '0' }}
                                />
                            </div>
                            <p className="text-xs text-gray-500 mt-2">{day.day}</p>
                            <p className="text-xs font-medium">{day.words}</p>
                        </div>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Chi tiết</h2>
                <div className="space-y-3">
                    {weeklyData.slice().reverse().map((day) => (
                        <div key={day.date} className="flex items-center gap-4">
                            <span className="w-24 text-sm text-gray-500">{format(new Date(day.date), 'dd/MM')}</span>
                            <div className="flex-1 h-4 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                                <div className="h-full bg-primary-500 rounded-full transition-all"
                                    style={{ width: `${Math.min((day.words / 20) * 100, 100)}%` }} />
                            </div>
                            <span className="w-16 text-right text-sm font-medium">{day.words} từ</span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    )
}
