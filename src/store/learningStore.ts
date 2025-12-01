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
        set({ sessionComplete: false, currentIndex: 0, isFlipped: false })
        
        const targetId = deckId ?? get().targetDeckId

        // SIMPLIFIED QUERY LOGIC TO DEBUG "NO WORDS" ISSUE
        // We want:
        // 1. Words that have NO progress record (New)
        // 2. Words that have progress but status is 'new' (New)
        // 3. Words that have progress and next_review <= today (Due)
        // 4. Words that are currently 'learning' (Active)
        
        let query = `
            SELECT w.id, w.term, w.definition, w.example, w.phonetic, w.image_url, w.deck_id,
                   p.ease_factor, p.interval, p.repetitions, p.next_review, p.status, p.last_reviewed,
                   w.synonyms, w.antonyms, w.word_family
            FROM words w
            LEFT JOIN progress p ON w.id = p.word_id
            WHERE 1=1 
        `
        const params: unknown[] = []

        if (targetId) {
            query += ` AND w.deck_id = ? `
            params.push(targetId)
        }

        // If NOT in Cram Mode (Standard SRS)
        // We append the SRS condition. 
        // Using 1=1 allows us to easily append AND conditions
        query += ` AND (
            p.id IS NULL -- No progress record = New Word
            OR p.status = 'new' 
            OR p.status = 'learning'
            OR p.next_review <= ?
            OR p.next_review IS NULL
        )`
        params.push(today)

        query += ` ORDER BY 
            CASE 
                WHEN p.next_review <= ? THEN 1 
                WHEN p.status = 'learning' THEN 2
                ELSE 3 
            END,
            w.id ASC
            LIMIT 50`
        
        params.push(today)

        try {
            console.log("Fetching words with query:", query)
            console.log("Params:", params)
            
            let words = await window.electronAPI.dbQuery<WordWithProgress>(query, params)
            console.log("Words found:", words.length)

            // Fallback to Cram Mode if Deck is selected but empty result
            if (words.length === 0 && targetId) {
                console.log("Fallback: Fetching ANY words from deck")
                // Just get words from this deck, ignoring SRS status
                const cramQuery = `
                    SELECT w.id, w.term, w.definition, w.example, w.phonetic, w.image_url, w.deck_id,
                           p.ease_factor, p.interval, p.repetitions, p.next_review, p.status, p.last_reviewed,
                           w.synonyms, w.antonyms, w.word_family
                    FROM words w
                    LEFT JOIN progress p ON w.id = p.word_id
                    WHERE w.deck_id = ?
                    LIMIT 20
                `
                words = await window.electronAPI.dbQuery<WordWithProgress>(cramQuery, [targetId])
                console.log("Cram words found:", words.length)
            }

            if (words.length > 0) {
                // Basic shuffle
                const reviews = words.filter(w => w.status === 'learning' || w.status === 'review' || (w.next_review && w.next_review <= today))
                const newWords = words.filter(w => !reviews.includes(w))
                
                for (let i = newWords.length - 1; i > 0; i--) {
                    const j = Math.floor(Math.random() * (i + 1));
                    [newWords[i], newWords[j]] = [newWords[j], newWords[i]];
                }
                set({ todayWords: [...reviews, ...newWords], currentIndex: 0, isFlipped: false, sessionComplete: false })
            } else {
                set({ todayWords: [] })
            }
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

        // If "AGAIN" (Quality 1), we DON'T finish the card yet (Re-learning step)
        // We push it to the back of the queue to see it again IN THIS SESSION
        if (quality === 1) {
             // Clone the word but keep its ID so we update the same DB record later
             // Note: We don't update DB stats yet for "Again" to avoid spamming logs, 
             // OR we update it to mark it as "learning" state but keep in session.
             // Let's just push to queue for immediate re-drill.
             const reLearningWord = { ...word }
             set({ todayWords: [...todayWords, reLearningWord] })
             
             // However, we DO want to penalize the DB record immediately so if they quit, it's saved as "forgotten"
        }

        const progress = {
            ease_factor: word.ease_factor ?? 2.5,
            interval: word.interval ?? 0,
            repetitions: word.repetitions ?? 0,
            leitner_box: word.leitner_box ?? 1,
            wrong_count: word.wrong_count ?? 0
        }

        const result = calculateNextReview(progress, quality, undefined, isHellMode)
        const xp = getXPForQuality(quality)
        const today = format(new Date(), 'yyyy-MM-dd')

        try {
            // Update progress
            await window.electronAPI.dbRun(`
        UPDATE progress SET 
          ease_factor = ?, interval = ?, repetitions = ?, 
          next_review = ?, status = ?, last_reviewed = CURRENT_TIMESTAMP,
          leitner_box = ?, wrong_count = ?
        WHERE word_id = ?
      `, [
            result.easeFactor, 
            result.interval, 
            result.repetitions, 
            format(result.nextReview, 'yyyy-MM-dd'), 
            result.status, 
            result.leitnerBox, 
            result.wrongCount,
            word.id
        ])

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
