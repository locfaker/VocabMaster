// ============================================
// Settings Page
// ============================================

import { useEffect, useState, useCallback, memo } from 'react'
import { Moon, Sun, Monitor, Download, Trash2, Bell, BellOff, Volume2, VolumeX } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { DB, APP_INFO } from '@/constants'

// ============================================
// Types
// ============================================

type Theme = 'light' | 'dark' | 'system'

interface Settings {
    theme: Theme
    dailyGoal: number
    reminderEnabled: boolean
    reminderTime: string
    soundEnabled: boolean
}

const DEFAULT_SETTINGS: Settings = {
    theme: 'system',
    dailyGoal: 20,
    reminderEnabled: true,
    reminderTime: '09:00',
    soundEnabled: true,
}

// ============================================
// Main Component
// ============================================

export function Settings() {
    const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS)

    useEffect(() => {
        loadSettings()
    }, [])

    const loadSettings = async () => {
        try {
            const results = await window.electronAPI.dbQuery<{ key: string; value: string }>(
                'SELECT key, value FROM settings WHERE key IN (?, ?, ?, ?, ?)',
                [
                    DB.SETTINGS_KEYS.THEME,
                    DB.SETTINGS_KEYS.DAILY_GOAL,
                    DB.SETTINGS_KEYS.REMINDER_ENABLED,
                    DB.SETTINGS_KEYS.REMINDER_TIME,
                    DB.SETTINGS_KEYS.SOUND_ENABLED,
                ]
            )

            const newSettings = { ...DEFAULT_SETTINGS }
            results.forEach((s) => {
                switch (s.key) {
                    case DB.SETTINGS_KEYS.THEME:
                        newSettings.theme = s.value as Theme
                        break
                    case DB.SETTINGS_KEYS.DAILY_GOAL:
                        newSettings.dailyGoal = parseInt(s.value)
                        break
                    case DB.SETTINGS_KEYS.REMINDER_ENABLED:
                        newSettings.reminderEnabled = s.value === 'true'
                        break
                    case DB.SETTINGS_KEYS.REMINDER_TIME:
                        newSettings.reminderTime = s.value
                        break
                    case DB.SETTINGS_KEYS.SOUND_ENABLED:
                        newSettings.soundEnabled = s.value === 'true'
                        break
                }
            })
            setSettings(newSettings)
        } catch (e) {
            console.error('loadSettings error:', e)
        }
    }

    const updateSetting = useCallback(async (key: string, value: string) => {
        await window.electronAPI.dbRun('UPDATE settings SET value = ? WHERE key = ?', [value, key])
    }, [])

    const handleThemeChange = useCallback(async (theme: Theme) => {
        setSettings((prev) => ({ ...prev, theme }))
        await updateSetting(DB.SETTINGS_KEYS.THEME, theme)
        await window.electronAPI.setTheme(theme)

        if (theme === 'dark') {
            document.documentElement.classList.add('dark')
        } else if (theme === 'light') {
            document.documentElement.classList.remove('dark')
        } else {
            const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
            document.documentElement.classList.toggle('dark', prefersDark)
        }
    }, [updateSetting])

    const handleGoalChange = useCallback(async (goal: number) => {
        setSettings((prev) => ({ ...prev, dailyGoal: goal }))
        await updateSetting(DB.SETTINGS_KEYS.DAILY_GOAL, goal.toString())
    }, [updateSetting])

    const handleReminderToggle = useCallback(async () => {
        const newValue = !settings.reminderEnabled
        setSettings((prev) => ({ ...prev, reminderEnabled: newValue }))
        await updateSetting(DB.SETTINGS_KEYS.REMINDER_ENABLED, newValue.toString())
        await window.electronAPI.setReminder(settings.reminderTime, newValue)
    }, [settings.reminderEnabled, settings.reminderTime, updateSetting])

    const handleReminderTimeChange = useCallback(async (time: string) => {
        setSettings((prev) => ({ ...prev, reminderTime: time }))
        await updateSetting(DB.SETTINGS_KEYS.REMINDER_TIME, time)
        if (settings.reminderEnabled) {
            await window.electronAPI.setReminder(time, true)
        }
    }, [settings.reminderEnabled, updateSetting])

    const handleSoundToggle = useCallback(async () => {
        const newValue = !settings.soundEnabled
        setSettings((prev) => ({ ...prev, soundEnabled: newValue }))
        await updateSetting(DB.SETTINGS_KEYS.SOUND_ENABLED, newValue.toString())
    }, [settings.soundEnabled, updateSetting])

    return (
        <div className="p-8 max-w-2xl">
            <h1 className="text-2xl font-bold mb-8">Cài đặt</h1>

            <ThemeSection theme={settings.theme} onChange={handleThemeChange} />
            <DailyGoalSection goal={settings.dailyGoal} onChange={handleGoalChange} />
            <ReminderSection
                enabled={settings.reminderEnabled}
                time={settings.reminderTime}
                onToggle={handleReminderToggle}
                onTimeChange={handleReminderTimeChange}
            />
            <SoundSection enabled={settings.soundEnabled} onToggle={handleSoundToggle} />
            <DataSection />
            <InfoSection />
        </div>
    )
}

// ============================================
// Sub-components
// ============================================

interface ThemeSectionProps {
    theme: Theme
    onChange: (theme: Theme) => void
}

const ThemeSection = memo(function ThemeSection({ theme, onChange }: ThemeSectionProps) {
    const options = [
        { value: 'light' as Theme, icon: Sun, label: 'Sáng' },
        { value: 'dark' as Theme, icon: Moon, label: 'Tối' },
        { value: 'system' as Theme, icon: Monitor, label: 'Hệ thống' },
    ]

    return (
        <SettingsCard title="Giao diện">
            <div className="flex gap-3">
                {options.map(({ value, icon: Icon, label }) => (
                    <button
                        key={value}
                        onClick={() => onChange(value)}
                        className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-xl border-2 transition-colors ${theme === value
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        <Icon size={20} />
                        <span>{label}</span>
                    </button>
                ))}
            </div>
        </SettingsCard>
    )
})

interface DailyGoalSectionProps {
    goal: number
    onChange: (goal: number) => void
}

const DailyGoalSection = memo(function DailyGoalSection({ goal, onChange }: DailyGoalSectionProps) {
    const goals = [10, 20, 30, 50]

    return (
        <SettingsCard title="Mục tiêu hàng ngày" description="Số từ muốn học mỗi ngày">
            <div className="flex gap-3">
                {goals.map((g) => (
                    <button
                        key={g}
                        onClick={() => onChange(g)}
                        className={`flex-1 py-3 rounded-xl border-2 font-medium transition-colors ${goal === g
                                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20 text-primary-600'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300'
                            }`}
                    >
                        {g}
                    </button>
                ))}
            </div>
        </SettingsCard>
    )
})

interface ReminderSectionProps {
    enabled: boolean
    time: string
    onToggle: () => void
    onTimeChange: (time: string) => void
}

const ReminderSection = memo(function ReminderSection({
    enabled,
    time,
    onToggle,
    onTimeChange,
}: ReminderSectionProps) {
    const testNotification = () => {
        window.electronAPI.showNotification('📚 Test Notification', 'Đây là thông báo nhắc học thử nghiệm!')
    }

    return (
        <SettingsCard
            title="Nhắc nhở học tập"
            action={
                <button
                    onClick={onToggle}
                    className={`p-2 rounded-lg transition-colors ${enabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                        }`}
                >
                    {enabled ? <Bell size={20} /> : <BellOff size={20} />}
                </button>
            }
        >
            {enabled && (
                <div className="space-y-4">
                    <div>
                        <label className="block text-sm text-gray-500 mb-2">Thời gian nhắc</label>
                        <input
                            type="time"
                            value={time}
                            onChange={(e) => onTimeChange(e.target.value)}
                            className="px-4 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                        />
                    </div>
                    <Button variant="secondary" size="sm" onClick={testNotification}>
                        🔔 Test thông báo
                    </Button>
                </div>
            )}
        </SettingsCard>
    )
})

interface SoundSectionProps {
    enabled: boolean
    onToggle: () => void
}

const SoundSection = memo(function SoundSection({ enabled, onToggle }: SoundSectionProps) {
    return (
        <SettingsCard
            title="Âm thanh"
            description="Phát âm thanh khi trả lời"
            action={
                <button
                    onClick={onToggle}
                    className={`p-2 rounded-lg transition-colors ${enabled ? 'bg-primary-100 text-primary-600' : 'bg-gray-100 text-gray-400'
                        }`}
                >
                    {enabled ? <Volume2 size={20} /> : <VolumeX size={20} />}
                </button>
            }
        />
    )
})

const DataSection = memo(function DataSection() {
    const handleExport = async () => {
        try {
            const [decks, words, progress] = await Promise.all([
                window.electronAPI.dbQuery('SELECT * FROM decks'),
                window.electronAPI.dbQuery('SELECT * FROM words'),
                window.electronAPI.dbQuery('SELECT * FROM progress'),
            ])

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
        if (!confirm('Xóa toàn bộ tiến độ học? Các từ vựng vẫn được giữ lại.')) return

        try {
            await Promise.all([
                window.electronAPI.dbRun(`
          UPDATE progress SET 
            ease_factor = 2.5, interval = 0, repetitions = 0, 
            next_review = NULL, status = 'new', last_reviewed = NULL,
            leitner_box = 1, correct_streak = 0, wrong_count = 0, total_reviews = 0
        `),
                window.electronAPI.dbRun('DELETE FROM stats'),
                window.electronAPI.dbRun("UPDATE settings SET value = '0' WHERE key = 'streak'"),
                window.electronAPI.dbRun("UPDATE settings SET value = '0' WHERE key = 'total_xp'"),
                window.electronAPI.dbRun('UPDATE achievements SET unlocked_at = NULL, progress = 0'),
            ])
            alert('Đã reset tiến độ!')
        } catch (e) {
            console.error('Reset error:', e)
        }
    }

    return (
        <SettingsCard title="Dữ liệu">
            <div className="space-y-3">
                <Button variant="secondary" className="w-full justify-start" onClick={handleExport}>
                    <Download size={18} className="mr-3" />
                    Xuất dữ liệu (JSON)
                </Button>
                <Button variant="danger" className="w-full justify-start" onClick={handleResetProgress}>
                    <Trash2 size={18} className="mr-3" />
                    Reset tiến độ học
                </Button>
            </div>
        </SettingsCard>
    )
})

const InfoSection = memo(function InfoSection() {
    return (
        <SettingsCard title="Thông tin">
            <div className="space-y-2 text-gray-500">
                <p>{APP_INFO.NAME} v{APP_INFO.VERSION}</p>
                <p>Electron + React + TypeScript</p>
                <p>Thuật toán SM-2 + Leitner Box</p>
                <p className="text-xs mt-4">© 2024 {APP_INFO.NAME}. All rights reserved.</p>
            </div>
        </SettingsCard>
    )
})

// ============================================
// Shared Components
// ============================================

interface SettingsCardProps {
    title: string
    description?: string
    action?: React.ReactNode
    children?: React.ReactNode
}

const SettingsCard = memo(function SettingsCard({
    title,
    description,
    action,
    children,
}: SettingsCardProps) {
    return (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm mb-6">
            <div className="flex items-center justify-between mb-4">
                <div>
                    <h2 className="text-lg font-semibold">{title}</h2>
                    {description && <p className="text-sm text-gray-500">{description}</p>}
                </div>
                {action}
            </div>
            {children}
        </div>
    )
})
