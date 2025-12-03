// ============================================
// Achievement Store - Zustand State Management
// ============================================

import { create } from 'zustand'
import type { Achievement } from '@/types'
import { DB } from '@/constants'

// ============================================
// Types
// ============================================

type SpecialAchievementType = 'perfect_quiz' | 'speed_demon' | 'night_owl' | 'early_bird'

interface AchievementState {
    achievements: Achievement[]
    unlockedRecently: Achievement | null
}

interface AchievementActions {
    fetchAchievements: () => Promise<void>
    checkAndUnlock: (type: string, currentValue: number) => Promise<Achievement | null>
    clearRecentUnlock: () => void
}

type AchievementStore = AchievementState & AchievementActions

// ============================================
// Initial State
// ============================================

const initialState: AchievementState = {
    achievements: [],
    unlockedRecently: null,
}

// ============================================
// Store
// ============================================

export const useAchievementStore = create<AchievementStore>((set, get) => ({
    ...initialState,

    fetchAchievements: async () => {
        try {
            const achievements = await window.electronAPI.dbQuery<Achievement>(
                'SELECT * FROM achievements ORDER BY unlocked_at DESC NULLS LAST, xp_reward DESC'
            )
            set({ achievements })
        } catch (e) {
            console.error('fetchAchievements error:', e)
            set({ achievements: [] })
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
            const newProgress = Math.min(currentValue, achievement.target)
            await window.electronAPI.dbRun(
                'UPDATE achievements SET progress = ? WHERE type = ?',
                [newProgress, type]
            )

            // Check if target reached
            if (currentValue >= achievement.target) {
                const now = new Date().toISOString()

                await window.electronAPI.dbRun(
                    'UPDATE achievements SET unlocked_at = ?, progress = ? WHERE type = ?',
                    [now, achievement.target, type]
                )

                // Award XP
                await awardAchievementXP(achievement.xp_reward)

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

    clearRecentUnlock: () => set({ unlockedRecently: null }),
}))

// ============================================
// Helper Functions
// ============================================

async function awardAchievementXP(xpReward: number): Promise<void> {
    const xpResult = await window.electronAPI.dbGet<{ value: string }>(
        'SELECT value FROM settings WHERE key = ?',
        [DB.SETTINGS_KEYS.TOTAL_XP]
    )
    const currentXP = parseInt(xpResult?.value ?? '0')

    await window.electronAPI.dbRun(
        'UPDATE settings SET value = ? WHERE key = ?',
        [(currentXP + xpReward).toString(), DB.SETTINGS_KEYS.TOTAL_XP]
    )
}

// ============================================
// Achievement Check Helpers
// ============================================

export async function checkWordAchievements(totalWords: number): Promise<void> {
    const store = useAchievementStore.getState()
    const thresholds = [
        { count: 1, type: 'first_word' },
        { count: 10, type: 'words_10' },
        { count: 50, type: 'words_50' },
        { count: 100, type: 'words_100' },
        { count: 500, type: 'words_500' },
    ]

    for (const { count, type } of thresholds) {
        if (totalWords >= count) {
            await store.checkAndUnlock(type, totalWords)
        }
    }
}

export async function checkStreakAchievements(streak: number): Promise<void> {
    const store = useAchievementStore.getState()
    const thresholds = [
        { count: 3, type: 'streak_3' },
        { count: 7, type: 'streak_7' },
        { count: 30, type: 'streak_30' },
    ]

    for (const { count, type } of thresholds) {
        if (streak >= count) {
            await store.checkAndUnlock(type, streak)
        }
    }
}

export async function checkMasteredAchievements(masteredCount: number): Promise<void> {
    const store = useAchievementStore.getState()
    const thresholds = [
        { count: 10, type: 'mastered_10' },
        { count: 50, type: 'mastered_50' },
    ]

    for (const { count, type } of thresholds) {
        if (masteredCount >= count) {
            await store.checkAndUnlock(type, masteredCount)
        }
    }
}

export async function checkSpecialAchievements(type: SpecialAchievementType): Promise<void> {
    const store = useAchievementStore.getState()
    await store.checkAndUnlock(type, 1)
}
