// ============================================
// SM-2 Spaced Repetition Algorithm
// Enhanced with Leitner Box System
// ============================================

import type { Quality } from '@/types'
import type { SM2Progress, SM2Result, LevelInfo, WordStatus } from '@/types/learning'
import { SM2, XP, LEVELS } from '@/constants'

/**
 * Calculate next review date using enhanced SM-2 algorithm
 * Combines SM-2 with Leitner Box for optimal retention
 */
export function calculateNextReview(
    progress: Partial<SM2Progress>,
    quality: Quality,
    _responseTime?: number,
    isHardcore = false
): SM2Result {
    // Initialize with defaults
    let easeFactor = progress.ease_factor ?? SM2.DEFAULT_EASE_FACTOR
    let interval = progress.interval ?? SM2.DEFAULT_INTERVAL
    let repetitions = progress.repetitions ?? 0
    let leitnerBox = progress.leitner_box ?? SM2.DEFAULT_LEITNER_BOX
    let correctStreak = progress.correct_streak ?? 0
    let wrongCount = progress.wrong_count ?? 0

    // Map quality: 1=Again(0), 2=Good(3), 3=Easy(5)
    const q = quality === 1 ? 0 : quality === 2 ? 3 : 5

    if (q < 3) {
        // === WRONG ANSWER ===
        correctStreak = 0
        wrongCount += 1

        if (isHardcore) {
            // Hell Mode: Brutal penalty
            repetitions = 0
            interval = 1
            leitnerBox = 1
            easeFactor = Math.max(SM2.MIN_EASE_FACTOR, easeFactor - 0.3)
        } else {
            // Normal Mode: Smart Lapse - retain some progress
            if (interval > SM2.MASTERY_INTERVAL) {
                interval = Math.ceil(interval * 0.4)
                leitnerBox = Math.max(2, Math.ceil(leitnerBox / 2))
            } else {
                interval = 1
                leitnerBox = 1
            }
            easeFactor = Math.max(SM2.MIN_EASE_FACTOR, easeFactor - 0.15)
        }
    } else {
        // === CORRECT ANSWER ===
        repetitions += 1
        correctStreak += 1

        // Advance Leitner box
        if (leitnerBox < SM2.MAX_LEITNER_BOX) {
            leitnerBox += 1
        }

        // Calculate interval
        if (repetitions === 1) {
            interval = 1
        } else if (repetitions === 2) {
            interval = 6
        } else {
            interval = Math.round(interval * easeFactor)
        }

        // Easy bonus
        if (quality === 3) {
            interval = Math.round(interval * 1.3)
            easeFactor += 0.15
        }

        // Hardcore dampener
        if (isHardcore) {
            interval = Math.max(1, Math.round(interval * 0.6))
        }
    }

    // Update ease factor (standard SM-2 formula)
    if (quality !== 1) {
        easeFactor = Math.max(
            SM2.MIN_EASE_FACTOR,
            easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
        )
    }

    // Calculate next review date
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)

    // Determine status
    const status = determineStatus(repetitions, leitnerBox, interval)

    return {
        easeFactor,
        interval,
        repetitions,
        nextReview,
        status,
        leitnerBox,
        correctStreak,
        wrongCount,
    }
}

/**
 * Determine word status based on progress
 */
function determineStatus(
    repetitions: number,
    leitnerBox: number,
    interval: number
): WordStatus {
    if (repetitions === 0) return 'learning'
    if (leitnerBox >= SM2.MAX_LEITNER_BOX && interval >= SM2.MASTERY_INTERVAL) return 'mastered'
    if (interval >= SM2.REVIEW_INTERVAL) return 'review'
    return 'learning'
}

/**
 * Calculate XP earned for an answer
 */
export function getXPForQuality(
    quality: Quality,
    streak = 0,
    isQuiz = false
): number {
    const baseXP = quality === 1 ? XP.AGAIN : quality === 2 ? XP.GOOD : XP.EASY
    const streakBonus = Math.min(streak * XP.STREAK_BONUS_PER_DAY, XP.MAX_STREAK_BONUS)
    const quizBonus = isQuiz ? XP.QUIZ_BONUS : 0

    return Math.round(baseXP * (1 + streakBonus + quizBonus))
}

/**
 * Calculate level info from total XP
 */
export function calculateLevel(totalXP: number): LevelInfo {
    let currentLevel = 1
    let currentTitle: string = LEVELS[0].title
    let nextLevelXP: number = LEVELS[1]?.xp ?? LEVELS[0].xp

    for (let i = LEVELS.length - 1; i >= 0; i--) {
        if (totalXP >= LEVELS[i].xp) {
            currentLevel = i + 1
            currentTitle = LEVELS[i].title
            nextLevelXP = LEVELS[i + 1]?.xp ?? LEVELS[i].xp
            break
        }
    }

    const prevLevelXP = LEVELS[currentLevel - 1]?.xp ?? 0
    const progress = nextLevelXP > prevLevelXP
        ? ((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100
        : 100

    return {
        level: currentLevel,
        title: currentTitle,
        progress: Math.min(progress, 100),
        nextLevelXP,
    }
}

/**
 * Predict mastery date based on current progress
 */
export function predictMasteryDate(progress: Partial<SM2Progress>): Date | null {
    const leitnerBox = progress.leitner_box ?? 1

    if (leitnerBox >= SM2.MAX_LEITNER_BOX) return new Date()

    // Average days per box advancement
    const avgDaysPerBox = [1, 3, 5, 10, 14]
    let totalDays = 0

    for (let i = leitnerBox - 1; i < SM2.MAX_LEITNER_BOX; i++) {
        totalDays += avgDaysPerBox[i]
    }

    const masteryDate = new Date()
    masteryDate.setDate(masteryDate.getDate() + totalDays)
    return masteryDate
}

/**
 * Calculate review priority score for smart ordering
 */
export function calculateReviewPriority(word: {
    ease_factor?: number | null
    wrong_count?: number | null
    correct_streak?: number | null
    interval?: number | null
    next_review?: string | null
}): number {
    let priority = 50 // Base priority

    // Higher priority for difficult words
    const easeFactor = word.ease_factor ?? SM2.DEFAULT_EASE_FACTOR
    priority += (SM2.DEFAULT_EASE_FACTOR - easeFactor) * 20

    // Higher priority for frequently wrong words
    priority += (word.wrong_count ?? 0) * 5

    // Lower priority for words with good streak
    priority -= (word.correct_streak ?? 0) * 3

    // Overdue words get higher priority
    if (word.next_review) {
        const daysOverdue = Math.floor(
            (Date.now() - new Date(word.next_review).getTime()) / (1000 * 60 * 60 * 24)
        )
        if (daysOverdue > 0) {
            priority += daysOverdue * 10
        }
    }

    return Math.max(0, Math.min(100, priority))
}
