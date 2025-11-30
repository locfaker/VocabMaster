import { create } from 'zustand'
import type { WordWithProgress, Quality, DailyStats } from '@/types'
import { calculateNextReview, getXPForQuality } from '@/utils/sm2'
import { format } from 'date-fns'

interface LearningStore {
    todayWords: WordWithProgress[]
    currentIndex: number
    isFlipped: boolean
    todayStats: DailyStats | null
    streak: number
    totalXP: number
    sessionComplete: boolean
    isHellMode: boolean
    targetDeckId: number | null // Add target deck state

    fetchTodayWords: (deckId?: number) => Promise<void>
    startSession: (deckId?: number) => Promise<void> // New action to start fresh session
    fetchTodayStats: () => Promise<void>
    fetchUserStats: () => Promise<void>
    flipCard: () => void
    answerCard: (quality: Quality) => Promise<void>
    nextCard: () => void
    resetSession: () => void
    setHellMode: (value: boolean) => void
}

export const useLearningStore = create<LearningStore>((set, get) => ({
    todayWords: [],
    currentIndex: 0,
    isFlipped: false,
    todayStats: null,
    streak: 0,
    totalXP: 0,
    sessionComplete: false,
    isHellMode: false,
    targetDeckId: null,

    startSession: async (deckId?: number) => {
        set({ targetDeckId: deckId ?? null, currentIndex: 0, isFlipped: false, sessionComplete: false })
        await get().fetchTodayWords(deckId)
    },

    fetchTodayWords: async (deckId?: number) => {
        const today = format(new Date(), 'yyyy-MM-dd')
        const targetId = deckId ?? get().targetDeckId

        let query = `
      SELECT w.*, p.ease_factor, p.interval, p.repetitions, p.next_review, p.status, p.last_reviewed
      FROM words w
      LEFT JOIN progress p ON w.id = p.word_id
      WHERE (p.status = 'new' OR p.status IS NULL OR p.next_review IS NULL OR p.next_review <= ?)
    `
        const params: unknown[] = [today]

        if (targetId) {
            query += ' AND w.deck_id = ?'
            params.push(targetId)
        }

        // PRIORITIZE REVIEW WORDS FIRST, THEN NEW WORDS
        // Increased LIMIT to 100 words per session
        query += ` ORDER BY 
      CASE 
        WHEN p.status = 'learning' OR p.status = 'review' THEN 1 
        WHEN p.next_review <= ? THEN 2
        ELSE 3 
      END,
      p.next_review ASC,
      w.id ASC
      LIMIT 100`
        
        // Add today parameter again for the ORDER BY clause
        params.push(today)

        try {
            const words = await window.electronAPI.dbQuery<WordWithProgress>(query, params)
            // Randomize NEW words slightly so we don't just get "A" words forever
            // But keep Review words at the top
            const reviews = words.filter(w => w.status === 'learning' || w.status === 'review')
            const newWords = words.filter(w => w.status !== 'learning' && w.status !== 'review')
            
            // Simple shuffle for new words
            for (let i = newWords.length - 1; i > 0; i--) {
                const j = Math.floor(Math.random() * (i + 1));
                [newWords[i], newWords[j]] = [newWords[j], newWords[i]];
            }

            set({ todayWords: [...reviews, ...newWords], currentIndex: 0, isFlipped: false, sessionComplete: false })
        } catch (e) {
            console.error('fetchTodayWords error:', e)
            set({ todayWords: [] })
        }
    },

    fetchTodayStats: async () => {
        const today = format(new Date(), 'yyyy-MM-dd')
        try {
            await window.electronAPI.dbRun('INSERT OR IGNORE INTO stats (date) VALUES (?)', [today])
            const stats = await window.electronAPI.dbGet<DailyStats>('SELECT * FROM stats WHERE date = ?', [today])
            set({ todayStats: stats || null })
        } catch (e) {
            console.error('fetchTodayStats error:', e)
        }
    },

    fetchUserStats: async () => {
        try {
            const streakResult = await window.electronAPI.dbGet<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['streak'])
            const xpResult = await window.electronAPI.dbGet<{ value: string }>('SELECT value FROM settings WHERE key = ?', ['total_xp'])
            set({
                streak: parseInt(streakResult?.value || '0'),
                totalXP: parseInt(xpResult?.value || '0')
            })
        } catch (e) {
            console.error('fetchUserStats error:', e)
        }
    },

    flipCard: () => set({ isFlipped: true }),

    answerCard: async (quality: Quality) => {
        const { todayWords, currentIndex, totalXP, isHellMode } = get()
        const word = todayWords[currentIndex]
        if (!word) return

        const progress = {
            ease_factor: word.ease_factor ?? 2.5,
            interval: word.interval ?? 0,
            repetitions: word.repetitions ?? 0
        }

        const result = calculateNextReview(progress, quality, undefined, isHellMode)
        const xp = getXPForQuality(quality)
        const today = format(new Date(), 'yyyy-MM-dd')

        try {
            // Update progress
            await window.electronAPI.dbRun(`
        UPDATE progress SET 
          ease_factor = ?, interval = ?, repetitions = ?, 
          next_review = ?, status = ?, last_reviewed = CURRENT_TIMESTAMP
        WHERE word_id = ?
      `, [result.easeFactor, result.interval, result.repetitions, format(result.nextReview, 'yyyy-MM-dd'), result.status, word.id])

            // Update daily stats
            await window.electronAPI.dbRun(`
        UPDATE stats SET 
          words_reviewed = words_reviewed + 1,
          correct_count = correct_count + ?,
          xp_earned = xp_earned + ?
        WHERE date = ?
      `, [quality >= 2 ? 1 : 0, xp, today])

            // Update total XP
            const newTotalXP = totalXP + xp
            await window.electronAPI.dbRun('UPDATE settings SET value = ? WHERE key = ?', [newTotalXP.toString(), 'total_xp'])

            set({ totalXP: newTotalXP })
            await get().fetchTodayStats()

            // Move to next card
            get().nextCard()
        } catch (e) {
            console.error('answerCard error:', e)
        }
    },

    nextCard: () => {
        const { currentIndex, todayWords } = get()
        if (currentIndex < todayWords.length - 1) {
            set({ currentIndex: currentIndex + 1, isFlipped: false })
        } else {
            set({ sessionComplete: true })
        }
    },

    resetSession: () => set({ currentIndex: 0, isFlipped: false, sessionComplete: false }),
    
    setHellMode: (value: boolean) => set({ isHellMode: value })
}))
