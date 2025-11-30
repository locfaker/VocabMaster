export interface Deck {
    id: number
    name: string
    description: string | null
    color: string
    icon: string
    word_count: number
    created_at: string
    updated_at: string
}

export interface Word {
    id: number
    deck_id: number
    term: string
    definition: string
    example: string | null
    phonetic: string | null
    image_url: string | null
    synonyms: string | null
    antonyms: string | null
    word_family: string | null
    created_at: string
}

export interface Progress {
    ease_factor: number
    interval: number
    repetitions: number
    next_review: string | null
    status: 'new' | 'learning' | 'review' | 'mastered'
    leitner_box: number
    correct_streak: number
    wrong_count: number
    total_reviews: number
    avg_response_time: number
}

export interface WordWithProgress extends Word {
    ease_factor: number | null
    interval: number | null
    repetitions: number | null
    next_review: string | null
    status: string | null
    last_reviewed: string | null
    leitner_box: number | null
    correct_streak: number | null
    wrong_count: number | null
    total_reviews: number | null
    avg_response_time: number | null
}

export interface DailyStats {
    id: number
    date: string
    words_learned: number
    words_reviewed: number
    correct_count: number
    time_spent: number
    xp_earned: number
    quiz_score: number
    typing_score: number
    streak_maintained: number
}

export interface Achievement {
    id: number
    type: string
    name: string
    description: string
    icon: string
    xp_reward: number
    unlocked_at: string | null
    progress: number
    target: number
}

export interface StudySession {
    id: number
    started_at: string
    ended_at: string | null
    mode: 'flashcard' | 'quiz' | 'typing' | 'mixed'
    words_studied: number
    correct_count: number
    xp_earned: number
}

export interface Reminder {
    id: number
    time: string
    enabled: boolean
    days: string
}

export type Quality = 1 | 2 | 3 // 1=Again, 2=Good, 3=Easy
export type StudyMode = 'flashcard' | 'quiz' | 'typing' | 'mixed'
export type LeitnerBox = 1 | 2 | 3 | 4 | 5

// Quiz types
export interface QuizQuestion {
    word: WordWithProgress
    options: string[]
    correctIndex: number
    type: 'definition' | 'term' | 'audio'
}

// Typing challenge
export interface TypingChallenge {
    word: WordWithProgress
    hint: string
    maskedWord: string
}

declare global {
    interface Window {
        electronAPI: {
            minimize: () => Promise<void>
            maximize: () => Promise<void>
            close: () => Promise<void>
            getTheme: () => Promise<string>
            setTheme: (theme: string) => Promise<void>
            dbQuery: <T = any>(sql: string, params?: any[]) => Promise<T[]>
            dbRun: (sql: string, params?: any[]) => Promise<{ lastId: number; changes: number }>
            dbGet: <T = any>(sql: string, params?: any[]) => Promise<T | null>
            // Mini mode
            openMiniMode: () => Promise<void>
            closeMiniMode: () => Promise<void>
            // Notifications
            showNotification: (title: string, body: string) => Promise<void>
            // Reminder
            setReminder: (time: string, enabled: boolean) => Promise<void>
        }
    }
}

export { }
