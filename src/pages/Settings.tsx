import { useEffect, useState } from 'react'
import { Moon, Sun, Monitor, Download, Trash2 } from 'lucide-react'
import { Button } from '@/components/common/Button'

type Theme = 'light' | 'dark' | 'system'

export function Settings() {
    const [theme, setTheme] = useState<Theme>('system')
    const [dailyGoal, setDailyGoal] = useState(20)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const themeResult = await window.electronAPI.dbGet<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['theme'])
            const goalResult = await window.electronAPI.dbGet<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['daily_goal'])
            if (themeResult) setTheme(themeResult.value as Theme)
            if (goalResult) setDailyGoal(parseInt(goalResult.value))
        } catch (e) {
            console.error('loadSettings error:', e)
        }
    }

    const handleThemeChange = async (newTheme: Theme) => {
        setTheme(newTheme)
        await window.electronAPI.dbRun('UPDATE settings SET value = ? WHERE key = ?', [newTheme, 'theme'])
        await window.electronAPI.setTheme(newTheme)

        if (newTheme === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (newTheme === 'light') {
            document.documentElement.classList.remove('dark')
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.classList.toggle('dark', prefersDark)
        }
    }

    const handleGoalChange = async (goal: number) => {
        setDailyGoal(goal)
        await window.electronAPI.dbRun('UPDATE settings SET value = ? WHERE key = ?', [goal.toString(), 'daily_goal'])
    }

    const handleExport = async () => {
        try {
            const decks = await window.electronAPI.dbQuery('SELECT * FROM decks')
            const words = await window.electronAPI.dbQuery('SELECT * FROM words')
            const progress = await window.electronAPI.dbQuery('SELECT * FROM progress')

            const data = JSON.stringify({ decks, words, progress }, null, 2)
            const blob = new Blob([data], { type: 'application/json' })
            const url = URL.createObjectURL(blob)

            const a = document.createElement('a')
            a.href = url
            a.download = `vocabmaster-backup-${new Date().toISOString().split('T')[0]}.json`
            a.click()
            URL.revokeObjectURL(url)
        } catch (e) {
            console.error('Export error:', e)
        }
    }

    const handleResetProgress = async () => {
        if (confirm('Xóa toàn bộ tiến độ học? Các từ vựng vẫn được giữ lại.')) {
            try {
                await window.electronAPI.dbRun("UPDATE progress SET ease_factor = 2.5, interval = 0, repetitions = 0, next_review = NULL, status = 'new', last_reviewed = NULL")
                await window.electronAPI.dbRun('DELETE FROM stats')
                await window.electronAPI.dbRun("UPDATE settings SET value = '0' WHERE key = 'streak'")
                await window.electronAPI.dbRun("UPDATE settings SET value = '0' WHERE key = 'total_xp'")
                alert('Đã reset tiến độ!')
            } catch (e) {
                console.error('Reset error:', e)
            }
        }
    }

    return (
        <div className="p-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-8">Cài đặt</h1>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                <h2 className="text-lg font-semibold mb-4">Giao diện</h2>
                <div className="flex gap-3">
                    {[
                        { value: 'light' as Theme, icon: Sun, label: 'Sáng' },
                        { value: 'dark' as Theme, icon: Moon, label: 'Tối' },
                        { value: 'system' as Theme, icon: Monitor, label: 'Hệ thống' }
                    ].map(({ value, icon: Icon, label }) => (
                        <button key={value} onClick={() => handleThemeChange(value)}
                            className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${theme === value ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}>
                            <Icon size={20} />
                            <span>{label}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                <h2 className="text-lg font-semibold mb-4">Mục tiêu hàng ngày</h2>
                <p className="text-gray-500 mb-4">Số từ muốn học mỗi ngày</p>
                <div className="flex gap-3">
                    {[10, 20, 30, 50].map((goal) => (
                        <button key={goal} onClick={() => handleGoalChange(goal)}
                            className={`flex-1 py-3 rounded-xl border-2 font-medium transition-colors ${dailyGoal === goal ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                                }`}>{goal}</button>
                    ))}
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
                <h2 className="text-lg font-semibold mb-4">Dữ liệu</h2>
                <div className="space-y-3">
                    <Button variant="secondary" className="w-full justify-start" onClick={handleExport}>
                        <Download size={18} className="mr-3" />Xuất dữ liệu (JSON)
                    </Button>
                    <Button variant="danger" className="w-full justify-start" onClick={handleResetProgress}>
                        <Trash2 size={18} className="mr-3" />Reset tiến độ học
                    </Button>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm">
                <h2 className="text-lg font-semibold mb-4">Thông tin</h2>
                <div className="space-y-2 text-gray-500">
                    <p>VocabMaster v1.0.0</p>
                    <p>Electron + React + TypeScript</p>
                    <p>Thuật toán SM-2 Spaced Repetition</p>
                </div>
            </div>
        </div>
    )
}
