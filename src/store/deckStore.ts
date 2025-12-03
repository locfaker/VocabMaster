// ============================================
// Deck Store - Zustand State Management
// ============================================

import { create } from 'zustand'
import type { Deck, WordWithProgress } from '@/types'

// ============================================
// Types
// ============================================

interface NewWord {
    deck_id: number
    term: string
    definition: string
    example?: string
    phonetic?: string
}

interface ImportWord {
    term: string
    definition: string
    example?: string
    phonetic?: string
}

interface DeckState {
    decks: Deck[]
    currentDeck: Deck | null
    words: WordWithProgress[]
    loading: boolean
}

interface DeckActions {
    fetchDecks: () => Promise<void>
    fetchDeck: (id: number) => Promise<void>
    createDeck: (name: string, description: string, color: string, icon: string) => Promise<number>
    deleteDeck: (id: number) => Promise<void>
    fetchWords: (deckId: number) => Promise<void>
    createWord: (word: NewWord) => Promise<void>
    importWords: (deckId: number, words: ImportWord[]) => Promise<number>
    deleteWord: (wordId: number, deckId: number) => Promise<void>
}

type DeckStore = DeckState & DeckActions

// ============================================
// Initial State
// ============================================

const initialState: DeckState = {
    decks: [],
    currentDeck: null,
    words: [],
    loading: false,
}

// ============================================
// Store
// ============================================

export const useDeckStore = create<DeckStore>((set, get) => ({
    ...initialState,

    fetchDecks: async () => {
        try {
            const decks = await window.electronAPI.dbQuery<Deck>(
                'SELECT * FROM decks ORDER BY id DESC'
            )
            set({ decks })
        } catch (e) {
            console.error('fetchDecks error:', e)
            set({ decks: [] })
        }
    },

    fetchDeck: async (id: number) => {
        try {
            const deck = await window.electronAPI.dbGet<Deck>(
                'SELECT * FROM decks WHERE id = ?',
                [id]
            )
            set({ currentDeck: deck })
        } catch (e) {
            console.error('fetchDeck error:', e)
            set({ currentDeck: null })
        }
    },

    createDeck: async (name, description, color, icon) => {
        try {
            const result = await window.electronAPI.dbRun(
                'INSERT INTO decks (name, description, color, icon) VALUES (?, ?, ?, ?)',
                [name, description, color, icon]
            )
            await get().fetchDecks()
            return result.lastId
        } catch (e) {
            console.error('createDeck error:', e)
            return 0
        }
    },

    deleteDeck: async (id: number) => {
        try {
            // Delete in correct order: progress -> words -> deck
            await window.electronAPI.dbRun(
                'DELETE FROM progress WHERE word_id IN (SELECT id FROM words WHERE deck_id = ?)',
                [id]
            )
            await window.electronAPI.dbRun(
                'DELETE FROM words WHERE deck_id = ?',
                [id]
            )
            await window.electronAPI.dbRun(
                'DELETE FROM decks WHERE id = ?',
                [id]
            )

            set({ currentDeck: null, words: [] })
            await get().fetchDecks()
        } catch (e) {
            console.error('deleteDeck error:', e)
        }
    },

    fetchWords: async (deckId: number) => {
        set({ loading: true })
        try {
            const words = await window.electronAPI.dbQuery<WordWithProgress>(`
        SELECT w.*, p.ease_factor, p.interval, p.repetitions, 
               p.next_review, p.status, p.last_reviewed
        FROM words w 
        LEFT JOIN progress p ON w.id = p.word_id
        WHERE w.deck_id = ? 
        ORDER BY w.id
      `, [deckId])
            set({ words, loading: false })
        } catch (e) {
            console.error('fetchWords error:', e)
            set({ words: [], loading: false })
        }
    },

    createWord: async (word: NewWord) => {
        try {
            const result = await window.electronAPI.dbRun(
                'INSERT INTO words (deck_id, term, definition, example, phonetic) VALUES (?, ?, ?, ?, ?)',
                [word.deck_id, word.term, word.definition, word.example ?? '', word.phonetic ?? '']
            )

            if (result.lastId > 0) {
                await Promise.all([
                    window.electronAPI.dbRun(
                        'INSERT INTO progress (word_id) VALUES (?)',
                        [result.lastId]
                    ),
                    window.electronAPI.dbRun(
                        'UPDATE decks SET word_count = word_count + 1 WHERE id = ?',
                        [word.deck_id]
                    ),
                ])
            }

            await Promise.all([
                get().fetchWords(word.deck_id),
                get().fetchDecks(),
            ])
        } catch (e) {
            console.error('createWord error:', e)
        }
    },

    importWords: async (deckId: number, words: ImportWord[]) => {
        let count = 0

        try {
            for (const w of words) {
                const result = await window.electronAPI.dbRun(
                    'INSERT INTO words (deck_id, term, definition, example, phonetic) VALUES (?, ?, ?, ?, ?)',
                    [deckId, w.term, w.definition, w.example ?? '', w.phonetic ?? '']
                )

                if (result.lastId > 0) {
                    await window.electronAPI.dbRun(
                        'INSERT INTO progress (word_id) VALUES (?)',
                        [result.lastId]
                    )
                    count++
                }
            }

            // Update deck word count
            await window.electronAPI.dbRun(
                'UPDATE decks SET word_count = ? WHERE id = ?',
                [count, deckId]
            )

            await get().fetchDecks()
        } catch (e) {
            console.error('importWords error:', e)
        }

        return count
    },

    deleteWord: async (wordId: number, deckId: number) => {
        try {
            await Promise.all([
                window.electronAPI.dbRun('DELETE FROM progress WHERE word_id = ?', [wordId]),
                window.electronAPI.dbRun('DELETE FROM words WHERE id = ?', [wordId]),
                window.electronAPI.dbRun(
                    'UPDATE decks SET word_count = word_count - 1 WHERE id = ?',
                    [deckId]
                ),
            ])

            await Promise.all([
                get().fetchWords(deckId),
                get().fetchDecks(),
            ])
        } catch (e) {
            console.error('deleteWord error:', e)
        }
    },
}))
