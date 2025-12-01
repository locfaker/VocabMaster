import type { Quality } from '@/types'

export interface SM2Progress {
    ease_factor: number
    interval: number
    repetitions: number
    leitner_box: number
    correct_streak: number
    wrong_count: number
}

export interface SM2Result {
    easeFactor: number
    interval: number
    repetitions: number
    nextReview: Date
    status: 'new' | 'learning' | 'review' | 'mastered'
    leitnerBox: number
    correctStreak: number
    wrongCount: number
}

// Enhanced SM-2 Algorithm with Leitner Box integration
export function calculateNextReview(
    progress: Partial<SM2Progress>,
    quality: Quality,
    _responseTime?: number,
    isHardcore: boolean = false // New param for Hell Mode
): SM2Result {
    let easeFactor = progress.ease_factor ?? 2.5
    let interval = progress.interval ?? 0
    let repetitions = progress.repetitions ?? 0
    let leitnerBox = progress.leitner_box ?? 1
    let correctStreak = progress.correct_streak ?? 0
    let wrongCount = progress.wrong_count ?? 0

    // Map quality: 1=Again(0), 2=Good(3), 3=Easy(5)
    const q = quality === 1 ? 0 : quality === 2 ? 3 : 5

    if (q < 3) {
        // === WRONG ANSWER (AGAIN) ===
        
        // Reset streak
        correctStreak = 0
        wrongCount += 1

        if (isHardcore) {
            // Hell Mode: Brutal penalty
            repetitions = 0
            interval = 1
            leitnerBox = 1
            easeFactor = Math.max(1.3, easeFactor - 0.3)
        } else {
            // Normal Mode: Soft Penalty (Smart Lapse)
            // Instead of full reset, retain some progress to avoid frustration
            // If word was mastered (interval > 21), cut interval by half instead of resetting to 1
            if (interval > 21) {
                interval = Math.ceil(interval * 0.4) // Keep 40% of interval
                leitnerBox = Math.max(2, Math.ceil(leitnerBox / 2))
            } else {
                interval = 1
                leitnerBox = 1
            }
            
            // Slight ease penalty
            easeFactor = Math.max(1.3, easeFactor - 0.15)
        }
    } else {
        // === CORRECT ANSWER (GOOD / EASY) ===
        repetitions += 1
        correctStreak += 1

        // Leitner: advance box
        if (leitnerBox < 5) leitnerBox += 1

        // Calculate Interval
        if (repetitions === 1) {
            interval = 1
        } else if (repetitions === 2) {
            interval = 6
        } else {
            // Standard SM-2 Formula
            interval = Math.round(interval * easeFactor)
        }

        // Bonues adjustments
        if (quality === 3) { // Easy
            // Bonus for confident answer: extend interval more
            interval = Math.round(interval * 1.3)
            easeFactor += 0.15 // Reward easy words with higher growth rate
        }

        // Hardcore Mode dampener
        if (isHardcore) {
            interval = Math.max(1, Math.round(interval * 0.6))
        }
    }

    // Update ease factor (standard SM-2)
    // EF':= EF + (0.1 - (5-q) * (0.08 + (5-q)*0.02))
    if (quality !== 1) { // Only adjust normally on success, fail logic is handled above
        easeFactor = Math.max(1.3, easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)))
    }

    // Calculate next review date
    const nextReview = new Date()
    nextReview.setDate(nextReview.getDate() + interval)

    // Determine status
    let status: SM2Result['status']
    if (repetitions === 0) {
        status = 'learning'
    } else if (leitnerBox >= 5 && interval >= 21) {
        status = 'mastered'
    } else if (interval >= 7) {
        status = 'review'
    } else {
        status = 'learning'
    }

    return {
        easeFactor,
        interval,
        repetitions,
        nextReview,
        status,
        leitnerBox,
        correctStreak,
        wrongCount
    }
}

// XP calculation with bonuses
export function getXPForQuality(quality: Quality, streak: number = 0, isQuiz: boolean = false): number {
    const baseXP = quality === 1 ? 5 : quality === 2 ? 10 : 15

    // Streak bonus (up to 50% extra)
    const streakBonus = Math.min(streak * 0.05, 0.5)

    // Quiz bonus (20% extra)
    const quizBonus = isQuiz ? 0.2 : 0

    return Math.round(baseXP * (1 + streakBonus + quizBonus))
}

// Calculate level from XP
export function calculateLevel(totalXP: number): { level: number; title: string; progress: number; nextLevelXP: number } {
    const levels = [
        { xp: 0, title: 'Beginner' },
        { xp: 100, title: 'Learner' },
        { xp: 300, title: 'Student' },
        { xp: 600, title: 'Intermediate' },
        { xp: 1000, title: 'Advanced' },
        { xp: 1500, title: 'Expert' },
        { xp: 2500, title: 'Master' },
        { xp: 4000, title: 'Grandmaster' },
        { xp: 6000, title: 'Legend' },
        { xp: 10000, title: 'Vocabulary God' }
    ]

    let currentLevel = 1
    let currentTitle = 'Beginner'
    let nextLevelXP = 100

    for (let i = levels.length - 1; i >= 0; i--) {
        if (totalXP >= levels[i].xp) {
            currentLevel = i + 1
            currentTitle = levels[i].title
            nextLevelXP = levels[i + 1]?.xp || levels[i].xp
            break
        }
    }

    const prevLevelXP = levels[currentLevel - 1]?.xp || 0
    const progress = nextLevelXP > prevLevelXP
        ? ((totalXP - prevLevelXP) / (nextLevelXP - prevLevelXP)) * 100
        : 100

    return { level: currentLevel, title: currentTitle, progress: Math.min(progress, 100), nextLevelXP }
}

// Predict mastery date
export function predictMasteryDate(progress: Partial<SM2Progress>): Date | null {
    const leitnerBox = progress.leitner_box ?? 1

    if (leitnerBox >= 5) return new Date() // Already mastered

    // Estimate days needed based on current progress
    const avgDaysPerBox = [1, 3, 5, 10, 14]

    let totalDays = 0
    for (let i = leitnerBox - 1; i < 5; i++) {
        totalDays += avgDaysPerBox[i]
    }

    const masteryDate = new Date()
    masteryDate.setDate(masteryDate.getDate() + totalDays)
    return masteryDate
}

// Smart review priority scoring
export function calculateReviewPriority(word: {
    ease_factor?: number | null
    wrong_count?: number | null
    correct_streak?: number | null
    interval?: number | null
    next_review?: string | null
}): number {
    let priority = 50 // Base priority

    // Higher priority for difficult words (low ease factor)
    const easeFactor = word.ease_factor ?? 2.5
    priority += (2.5 - easeFactor) * 20

    // Higher priority for frequently wrong words
    const wrongCount = word.wrong_count ?? 0
    priority += wrongCount * 5

    // Lower priority for words with good streak
    const correctStreak = word.correct_streak ?? 0
    priority -= correctStreak * 3

    // Overdue words get higher priority
    if (word.next_review) {
        const daysOverdue = Math.floor((Date.now() - new Date(word.next_review).getTime()) / (1000 * 60 * 60 * 24))
        if (daysOverdue > 0) {
            priority += daysOverdue * 10
        }
    }

    return Math.max(0, Math.min(100, priority))
}
