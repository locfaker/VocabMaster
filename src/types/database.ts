// ============================================
// Database Types
// ============================================

import type { Deck, Word, Progress, DailyStats, Achievement, StudySession, Reminder } from './index'

// Database operation results
export interface DbRunResult {
    lastId: number
    changes: number
}

// Query result types
export interface CountResult {
    count: number
}

export interface SettingResult {
    key: string
    value: string
}

export interface TotalStatsResult {
    words: number
    xp: number
}

// Database API interface
export interface DatabaseAPI {
    dbQuery: <T = unknown>(sql: string, params?: unknown[]) => Promise<T[]>
    dbRun: (sql: string, params?: unknown[]) => Promise<DbRunResult>
    dbGet: <T = unknown>(sql: string, params?: unknown[]) => Promise<T | null>
}

// Re-export for convenience
export type {
    Deck,
    Word,
    Progress,
    DailyStats,
    Achievement,
    StudySession,
    Reminder,
}
