// ============================================
// Learning Store - Zustand State Management
// ============================================

import { create } from 'zustand'
import type { WordWithProgress, Quality, DailyStats } from '@/types'
import { calculateNextReview, getXPForQuality } from '@/utils/sm2'
import { getToday, getYesterday } from '@/utils/date'
import { LEARNING, DB, TIME } from '@/constants'
import {
    checkWordAchievements,
    checkStreakAchievements,
    checkMasteredAchievements,
    checkSpecialAchievements,
} from './achievementStore'

// ============================================
// Types
// ============================================

interface LearningState {
    todayWords: WordWithProgress[]
    currentIndex: number
    isFlipped: boolean
    todayStats: DailyStats | null
    streak: number
    totalXP: number
    sessionComplete: boolean
    sessionStartTime: number | null
    currentDeckId: number | null
}

interface LearningActions {
    fetchTodayWords: (deckId?: number) => Promise<void>
    fetchTodayStats: () => Promise<void>
    fetchUserStats: () => Promise<void>
    flipCard: () => void
    answerCard: (quality: Quality) => Promise<void>
    nextCard: () => void
    resetSession: () => void
    updateStreak: () => Promise<void>
}

type LearningStore = LearningState & LearningActions

// ============================================
// Initial State
// ============================================

const initialState: LearningState = {
    todayWords: [],
    currentIndex: 0,
    isFlipped: false,
    todayStats: null,
    streak: 0,
    totalXP: 0,
    sessionComplete: false,
    sessionStartTime: null,
    currentDeckId: null,
}

// ============================================
// Store
// ============================================

export const useLearningStore = create<LearningStore>((set, get) => ({
    ...initialState,

    fetchTodayWords: async (deckId?: number) => {
        const today = getToday()

        try {
            // Ensure all words have progress records
            await ensureProgressRecords()

            const words = deckId
                ? await fetchDeckWords(deckId)
                : await fetchReviewWords(today)

            console.log('Fetched words for learning:', words.length, 'deckId:', deckId)

            set({
                todayWords: words,
                currentIndex: 0,
                isFlipped: false,
                sessionComplete: false,
                sessionStartTime: Date.now(),
                currentDeckId: deckId ?? null,
            })
        } catch (e) {
            console.error('fetchTodayWords error:', e)
            set({ todayWords: [] })
        }
    },

    fetchTodayStats: async () => {
        const today = getToday()
        try {
            await window.electronAPI.dbRun(
                'INSERT OR IGNORE INTO stats (date) VALUES (?)',
                [today]
            )
            const stats = await window.electronAPI.dbGet<DailyStats>(
                'SELECT * FROM stats WHERE date = ?',
                [today]
            )
            set({ todayStats: stats ?? null })
        } catch (e) {
            console.error('fetchTodayStats error:', e)
        }
    },

    fetchUserStats: async () => {
        try {
            const [streakResult, xpResult] = await Promise.all([
                window.electronAPI.dbGet<{ value: string }>(
                    'SELECT value FROM settings WHERE key = ?',
                    [DB.SETTINGS_KEYS.STREAK]
                ),
                window.electronAPI.dbGet<{ value: string }>(
                    'SELECT value FROM settings WHERE key = ?',
                    [DB.SETTINGS_KEYS.TOTAL_XP]
                ),
            ])

            set({
                streak: parseInt(streakResult?.value ?? '0'),
                totalXP: parseInt(xpResult?.value ?? '0'),
            })
        } catch (e) {
            console.error('fetchUserStats error:', e)
        }
    },

    flipCard: () => set({ isFlipped: true }),

    answerCard: async (quality: Quality) => {
        const { todayWords, currentIndex, totalXP, streak, sessionStartTime } = get()
        const word = todayWords[currentIndex]
        if (!word) return

        const responseTime = sessionStartTime ? Date.now() - sessionStartTime : 5000

        try {
            // Calculate new progress
            const progress = {
                ease_factor: word.ease_factor ?? 2.5,
                interval: word.interval ?? 0,
                repetitions: word.repetitions ?? 0,
                leitner_box: word.leitner_box ?? 1,
                correct_streak: word.correct_streak ?? 0,
                wrong_count: word.wrong_count ?? 0,
            }

            const result = calculateNextReview(progress, quality, responseTime)
            const xp = getXPForQuality(quality, streak)
            const today = getToday()

            // Update database
            await updateWordProgress(word.id, result, today)
            await updateDailyStats(today, quality, xp)
            await updateTotalXP(totalXP + xp)

            set({ totalXP: totalXP + xp })

            // Check achievements
            await checkAchievements(responseTime, quality)

            await get().fetchTodayStats()
            get().nextCard()
        } catch (e) {
            console.error('answerCard error:', e)
        }
    },

    nextCard: () => {
        const { currentIndex, todayWords } = get()
        if (currentIndex < todayWords.length - 1) {
            set({
                currentIndex: currentIndex + 1,
                isFlipped: false,
                sessionStartTime: Date.now(),
            })
        } else {
            set({ sessionComplete: true })
            get().updateStreak()
        }
    },

    resetSession: () => set({
        currentIndex: 0,
        isFlipped: false,
        sessionComplete: false,
        sessionStartTime: Date.now(),
    }),

    updateStreak: async () => {
        const today = getToday()
        const yesterday = getYesterday()

        try {
            const [yesterdayStats, currentStreak, todayStats] = await Promise.all([
                window.electronAPI.dbGet<DailyStats>(
                    'SELECT * FROM stats WHERE date = ? AND words_reviewed > 0',
                    [yesterday]
                ),
                window.electronAPI.dbGet<{ value: string }>(
                    'SELECT value FROM settings WHERE key = ?',
                    [DB.SETTINGS_KEYS.STREAK]
                ),
                window.electronAPI.dbGet<DailyStats>(
                    'SELECT * FROM stats WHERE date = ? AND streak_maintained = 1',
                    [today]
                ),
            ])

            // Already updated today
            if (todayStats) return

            let newStreak = parseInt(currentStreak?.value ?? '0')
            newStreak = yesterdayStats || newStreak === 0 ? newStreak + 1 : 1

            await Promise.all([
                window.electronAPI.dbRun(
                    'UPDATE settings SET value = ? WHERE key = ?',
                    [newStreak.toString(), DB.SETTINGS_KEYS.STREAK]
                ),
                window.electronAPI.dbRun(
                    'UPDATE stats SET streak_maintained = 1 WHERE date = ?',
                    [today]
                ),
            ])

            set({ streak: newStreak })
            await checkStreakAchievements(newStreak)
        } catch (e) {
            console.error('updateStreak error:', e)
        }
    },
}))

// ============================================
// Helper Functions
// ============================================

async function ensureProgressRecords(): Promise<void> {
    const wordsWithoutProgress = await window.electronAPI.dbQuery<{ id: number }>(
        'SELECT w.id FROM words w LEFT JOIN progress p ON w.id = p.word_id WHERE p.id IS NULL'
    )

    for (const w of wordsWithoutProgress) {
        await window.electronAPI.dbRun(
            "INSERT INTO progress (word_id, status) VALUES (?, 'new')",
            [w.id]
        )
    }

    if (wordsWithoutProgress.length > 0) {
        console.log('Created progress for', wordsWithoutProgress.length, 'words')
    }
}

async function fetchDeckWords(deckId: number): Promise<WordWithProgress[]> {
    return window.electronAPI.dbQuery<WordWithProgress>(`
    SELECT w.*, p.ease_factor, p.interval, p.repetitions, p.next_review, p.status, 
           p.last_reviewed, p.leitner_box, p.correct_streak, p.wrong_count, p.total_reviews
    FROM words w
    LEFT JOIN progress p ON w.id = p.word_id
    WHERE w.deck_id = ?
    ORDER BY 
      CASE 
        WHEN p.status IS NULL OR p.status = 'new' THEN 0 
        WHEN p.status = 'learning' THEN 1
        WHEN p.status = 'review' THEN 2
        ELSE 3 
      END,
      w.id ASC
    LIMIT ?
  `, [deckId, LEARNING.MAX_WORDS_PER_SESSION])
}

async function fetchReviewWords(today: string): Promise<WordWithProgress[]> {
    return window.electronAPI.dbQuery<WordWithProgress>(`
    SELECT w.*, p.ease_factor, p.interval, p.repetitions, p.next_review, p.status, 
           p.last_reviewed, p.leitner_box, p.correct_streak, p.wrong_count, p.total_reviews
    FROM words w
    LEFT JOIN progress p ON w.id = p.word_id
    WHERE (
      p.status IS NULL 
      OR p.status = 'new' 
      OR p.status = 'learning'
      OR p.next_review IS NULL 
      OR p.next_review <= ?
    )
    ORDER BY 
      CASE 
        WHEN p.status IS NULL OR p.status = 'new' THEN 0 
        WHEN p.status = 'learning' THEN 1
        ELSE 2 
      END,
      w.id ASC
    LIMIT ?
  `, [today, LEARNING.MAX_WORDS_PER_SESSION])
}

async function updateWordProgress(
    wordId: number,
    result: ReturnType<typeof calculateNextReview>,
    today: string
): Promise<void> {
    await window.electronAPI.dbRun(
        'INSERT OR IGNORE INTO progress (word_id, status) VALUES (?, ?)',
        [wordId, 'new']
    )

    await window.electronAPI.dbRun(`
    UPDATE progress SET 
      ease_factor = ?, interval = ?, repetitions = ?, 
      next_review = ?, status = ?, last_reviewed = CURRENT_TIMESTAMP,
      leitner_box = ?, correct_streak = ?, wrong_count = ?,
      total_reviews = COALESCE(total_reviews, 0) + 1
    WHERE word_id = ?
  `, [
        result.easeFactor,
        result.interval,
        result.repetitions,
        today,
        result.status,
        result.leitnerBox,
        result.correctStreak,
        result.wrongCount,
        wordId,
    ])
}

async function updateDailyStats(
    today: string,
    quality: Quality,
    xp: number
): Promise<void> {
    await window.electronAPI.dbRun(`
    UPDATE stats SET 
      words_reviewed = words_reviewed + 1,
      correct_count = correct_count + ?,
      xp_earned = xp_earned + ?
    WHERE date = ?
  `, [quality >= 2 ? 1 : 0, xp, today])
}

async function updateTotalXP(newTotalXP: number): Promise<void> {
    await window.electronAPI.dbRun(
        'UPDATE settings SET value = ? WHERE key = ?',
        [newTotalXP.toString(), DB.SETTINGS_KEYS.TOTAL_XP]
    )
}

async function checkAchievements(
    responseTime: number,
    quality: Quality
): Promise<void> {
    const [totalReviewed, masteredCount] = await Promise.all([
        window.electronAPI.dbGet<{ count: number }>(
            'SELECT COUNT(*) as count FROM progress WHERE total_reviews > 0'
        ),
        window.electronAPI.dbGet<{ count: number }>(
            "SELECT COUNT(*) as count FROM progress WHERE status = 'mastered'"
        ),
    ])

    await checkWordAchievements(totalReviewed?.count ?? 0)
    await checkMasteredAchievements(masteredCount?.count ?? 0)

    // Speed achievement
    if (responseTime < LEARNING.SPEED_ACHIEVEMENT_MS && quality >= 2) {
        await checkSpecialAchievements('speed_demon')
    }

    // Time-based achievements
    const hour = new Date().getHours()
    if (hour >= TIME.NIGHT_OWL_START || hour < TIME.NIGHT_OWL_END) {
        await checkSpecialAchievements('night_owl')
    }
    if (hour >= TIME.EARLY_BIRD_START && hour < TIME.EARLY_BIRD_END) {
        await checkSpecialAchievements('early_bird')
    }
}
