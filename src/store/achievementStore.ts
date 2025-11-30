import { create } from 'zustand'
import type { Achievement } from '@/types'

interface AchievementStore {
    achievements: Achievement[]
    unlockedRecently: Achievement | null

    fetchAchievements: () => Promise<void>
    checkAndUnlock: (type: string, currentValue: number) => Promise<Achievement | null>
    clearRecentUnlock: () => void
}

export const useAchievementStore = create<AchievementStore>((set, get) => ({
    achievements: [],
    unlockedRecently: null,

    fetchAchievements: async () => {
        try {
            const achievements = await window.electronAPI.dbQuery<Achievement>(
                'SELECT * FROM achievements ORDER BY unlocked_at DESC NULLS LAST, xp_reward DESC'
            )
            set({ achievements })
        } catch (e) {
            console.error('fetchAchievements error:', e)
        }
    },

    checkAndUnlock: async (type: string, currentValue: number) => {
        try {
            const achievement = await window.electronAPI.dbGet<Achievement>(
                'SELECT * FROM achievements WHERE type = ? AND unlocked_at IS NULL',
                [type]
            )

            if (!achievement) return null

            // Update progress
            await window.electronAPI.dbRun(
                'UPDATE achievements SET progress = ? WHERE type = ?',
                [Math.min(currentValue, achievement.target), type]
            )

            // Check if target reached
            if (currentValue >= achievement.target) {
                const now = new Date().toISOString()
                await window.electronAPI.dbRun(
                    'UPDATE achievements SET unlocked_at = ?, progress = ? WHERE type = ?',
                    [now, achievement.target, type]
                )

                // Award XP
                const xpResult = await window.electronAPI.dbGet<{ value: string }>(
                    'SELECT value FROM settings WHERE key = ?',
                    ['total_xp']
                )
                const currentXP = parseInt(xpResult?.value || '0')
                await window.electronAPI.dbRun(
                    'UPDATE settings SET value = ? WHERE key = ?',
                    [(currentXP + achievement.xp_reward).toString(), 'total_xp']
                )

                const unlockedAchievement = { ...achievement, unlocked_at: now }
                set({ unlockedRecently: unlockedAchievement })
                await get().fetchAchievements()

                return unlockedAchievement
            }

            return null
        } catch (e) {
            console.error('checkAndUnlock error:', e)
            return null
        }
    },

    clearRecentUnlock: () => set({ unlockedRecently: null })
}))

// Achievement check helpers
export async function checkWordAchievements(totalWords: number) {
    const store = useAchievementStore.getState()

    if (totalWords >= 1) await store.checkAndUnlock('first_word', 1)
    if (totalWords >= 10) await store.checkAndUnlock('words_10', totalWords)
    if (totalWords >= 50) await store.checkAndUnlock('words_50', totalWords)
    if (totalWords >= 100) await store.checkAndUnlock('words_100', totalWords)
    if (totalWords >= 500) await store.checkAndUnlock('words_500', totalWords)
}

export async function checkStreakAchievements(streak: number) {
    const store = useAchievementStore.getState()

    if (streak >= 3) await store.checkAndUnlock('streak_3', streak)
    if (streak >= 7) await store.checkAndUnlock('streak_7', streak)
    if (streak >= 30) await store.checkAndUnlock('streak_30', streak)
}

export async function checkMasteredAchievements(masteredCount: number) {
    const store = useAchievementStore.getState()

    if (masteredCount >= 10) await store.checkAndUnlock('mastered_10', masteredCount)
    if (masteredCount >= 50) await store.checkAndUnlock('mastered_50', masteredCount)
}

export async function checkSpecialAchievements(type: 'perfect_quiz' | 'speed_demon' | 'night_owl' | 'early_bird') {
    const store = useAchievementStore.getState()
    await store.checkAndUnlock(type, 1)
}
