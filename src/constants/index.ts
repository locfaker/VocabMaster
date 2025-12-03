// ============================================
// Application Constants
// ============================================

// Colors for deck creation
export const DECK_COLORS = [
    '#6C63FF', // Primary purple
    '#FF6B6B', // Coral red
    '#4CAF50', // Green
    '#FF9800', // Orange
    '#2196F3', // Blue
    '#9C27B0', // Purple
    '#00BCD4', // Cyan
    '#E91E63', // Pink
] as const

// Icons for deck creation
export const DECK_ICONS = [
    '📚', '📕', '📗', '📘', '📙', '🎯', '💼', '🌍', '🔬', '💻',
    '🎨', '🎵', '⚽', '🍳', '✈️', '🏥', '⚖️', '🔧',
] as const

// Learning settings
export const LEARNING = {
    DEFAULT_DAILY_GOAL: 20,
    MAX_WORDS_PER_SESSION: 20,
    MIN_WORDS_FOR_QUIZ: 4,
    QUIZ_OPTIONS_COUNT: 4,
    DEFAULT_QUIZ_COUNT: 10,
    TYPING_SIMILARITY_THRESHOLD: 90,
    TYPING_CLOSE_THRESHOLD: 70,
    SPEED_ACHIEVEMENT_MS: 3000,
} as const

// SM-2 Algorithm defaults
export const SM2 = {
    DEFAULT_EASE_FACTOR: 2.5,
    MIN_EASE_FACTOR: 1.3,
    DEFAULT_INTERVAL: 0,
    DEFAULT_LEITNER_BOX: 1,
    MAX_LEITNER_BOX: 5,
    MASTERY_INTERVAL: 21,
    REVIEW_INTERVAL: 7,
} as const

// XP and Level system
export const XP = {
    AGAIN: 5,
    GOOD: 10,
    EASY: 15,
    MAX_STREAK_BONUS: 0.5,
    STREAK_BONUS_PER_DAY: 0.05,
    QUIZ_BONUS: 0.2,
} as const

export const LEVELS = [
    { xp: 0, title: 'Beginner' },
    { xp: 100, title: 'Learner' },
    { xp: 300, title: 'Student' },
    { xp: 600, title: 'Intermediate' },
    { xp: 1000, title: 'Advanced' },
    { xp: 1500, title: 'Expert' },
    { xp: 2500, title: 'Master' },
    { xp: 4000, title: 'Grandmaster' },
    { xp: 6000, title: 'Legend' },
    { xp: 10000, title: 'Vocabulary God' },
] as const

// Time constants
export const TIME = {
    NIGHT_OWL_START: 22,
    NIGHT_OWL_END: 5,
    EARLY_BIRD_START: 5,
    EARLY_BIRD_END: 7,
    MS_PER_DAY: 86400000,
    ACHIEVEMENT_POPUP_DURATION: 5000,
    REMINDER_CHECK_INTERVAL: 60000,
} as const

// Database settings
export const DB = {
    NAME: 'vocabmaster.db',
    SETTINGS_KEYS: {
        THEME: 'theme',
        DAILY_GOAL: 'daily_goal',
        STREAK: 'streak',
        TOTAL_XP: 'total_xp',
        LEVEL: 'level',
        REMINDER_ENABLED: 'reminder_enabled',
        REMINDER_TIME: 'reminder_time',
        SOUND_ENABLED: 'sound_enabled',
        MINI_MODE_OPACITY: 'mini_mode_opacity',
    },
} as const

// Status types
export const WORD_STATUS = {
    NEW: 'new',
    LEARNING: 'learning',
    REVIEW: 'review',
    MASTERED: 'mastered',
} as const

// Quality ratings
export const QUALITY = {
    AGAIN: 1,
    GOOD: 2,
    EASY: 3,
} as const

// Filter types
export const LIBRARY_FILTERS = ['ALL', 'TOEIC', 'IELTS', 'OTHER'] as const

// App info
export const APP_INFO = {
    NAME: 'VocabMaster',
    VERSION: '2.0.0',
    EDITION: 'Pro Edition',
} as const
