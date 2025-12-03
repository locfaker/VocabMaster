// ============================================
// Learning & Quiz Types
// ============================================

import type { WordWithProgress } from './index'

// Quality rating for SM-2 algorithm
export type Quality = 1 | 2 | 3 // 1=Again, 2=Good, 3=Easy

// Study modes
export type StudyMode = 'flashcard' | 'quiz' | 'typing' | 'mixed'

// Leitner box levels
export type LeitnerBox = 1 | 2 | 3 | 4 | 5

// Word status
export type WordStatus = 'new' | 'learning' | 'review' | 'mastered'

// Quiz question types
export type QuizQuestionType = 'definition' | 'term' | 'audio'

// Quiz question
export interface QuizQuestion {
    word: WordWithProgress
    options: string[]
    correctIndex: number
    type: QuizQuestionType
}

// Typing challenge
export interface TypingChallenge {
    word: WordWithProgress
    hint: string
    maskedWord: string
}

// Typing answer result
export interface TypingResult {
    isCorrect: boolean
    similarity: number
    feedback: string
}

// Quiz score
export interface QuizScore {
    correct: number
    total: number
}

// SM-2 Progress input
export interface SM2Progress {
    ease_factor: number
    interval: number
    repetitions: number
    leitner_box: number
    correct_streak: number
    wrong_count: number
}

// SM-2 Calculation result
export interface SM2Result {
    easeFactor: number
    interval: number
    repetitions: number
    nextReview: Date
    status: WordStatus
    leitnerBox: number
    correctStreak: number
    wrongCount: number
}

// Level info
export interface LevelInfo {
    level: number
    title: string
    progress: number
    nextLevelXP: number
}

// Session state
export interface LearningSession {
    words: WordWithProgress[]
    currentIndex: number
    isFlipped: boolean
    isComplete: boolean
    startTime: number | null
    deckId: number | null
}
