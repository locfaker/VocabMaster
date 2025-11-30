import { create } from 'zustand'
import type { Deck, WordWithProgress } from '@/types'

interface DeckStore {
    decks: Deck[]
    currentDeck: Deck | null
    words: WordWithProgress[]
    loading: boolean

    fetchDecks: () => Promise<void>
    fetchDeck: (id: number) => Promise<void>
    createDeck: (name: string, description: string, color: string, icon: string) => Promise<number>
    deleteDeck: (id: number) => Promise<void>

    fetchWords: (deckId: number) => Promise<void>
    createWord: (word: { deck_id: number; term: string; definition: string; example?: string; phonetic?: string }) => Promise<void>
    importWords: (deckId: number, words: Array<{ term: string; definition: string; example?: string; phonetic?: string }>) => Promise<number>
    deleteWord: (wordId: number, deckId: number) => Promise<void>
}

export const useDeckStore = create<DeckStore>((set, get) => ({
    decks: [],
    currentDeck: null,
    words: [],
    loading: false,

    fetchDecks: async () => {
        const decks = await window.electronAPI.dbQuery<Deck>('SELECT * FROM decks ORDER BY id DESC')
        set({ decks })
    },

    fetchDeck: async (id: number) => {
        const deck = await window.electronAPI.dbGet<Deck>('SELECT * FROM decks WHERE id = ?', [id])
        set({ currentDeck: deck })
    },

    createDeck: async (name, description, color, icon) => {
        const result = await window.electronAPI.dbRun(
            'INSERT INTO decks (name, description, color, icon) VALUES (?, ?, ?, ?)',
            [name, description, color, icon]
        )
        await get().fetchDecks()
        return result.lastId
    },

    deleteDeck: async (id) => {
        await window.electronAPI.dbRun('DELETE FROM progress WHERE word_id IN (SELECT id FROM words WHERE deck_id = ?)', [id])
        await window.electronAPI.dbRun('DELETE FROM words WHERE deck_id = ?', [id])
        await window.electronAPI.dbRun('DELETE FROM decks WHERE id = ?', [id])
        set({ currentDeck: null, words: [] })
        await get().fetchDecks()
    },

    fetchWords: async (deckId) => {
        set({ loading: true })
        const words = await window.electronAPI.dbQuery<WordWithProgress>(`
      SELECT w.*, p.ease_factor, p.interval, p.repetitions, p.next_review, p.status, p.last_reviewed
      FROM words w LEFT JOIN progress p ON w.id = p.word_id
      WHERE w.deck_id = ? ORDER BY w.id
    `, [deckId])
        set({ words, loading: false })
    },

    createWord: async (word) => {
        const r = await window.electronAPI.dbRun(
            'INSERT INTO words (deck_id, term, definition, example, phonetic) VALUES (?, ?, ?, ?, ?)',
            [word.deck_id, word.term, word.definition, word.example || '', word.phonetic || '']
        )
        if (r.lastId > 0) {
            await window.electronAPI.dbRun('INSERT INTO progress (word_id) VALUES (?)', [r.lastId])
            await window.electronAPI.dbRun('UPDATE decks SET word_count = word_count + 1 WHERE id = ?', [word.deck_id])
        }
        await get().fetchWords(word.deck_id)
        await get().fetchDecks()
    },

    importWords: async (deckId, words) => {
        let count = 0
        for (const w of words) {
            const r = await window.electronAPI.dbRun(
                'INSERT INTO words (deck_id, term, definition, example, phonetic) VALUES (?, ?, ?, ?, ?)',
                [deckId, w.term, w.definition, w.example || '', w.phonetic || '']
            )
            if (r.lastId > 0) {
                await window.electronAPI.dbRun('INSERT INTO progress (word_id) VALUES (?)', [r.lastId])
                count++
            }
        }
        await window.electronAPI.dbRun('UPDATE decks SET word_count = ? WHERE id = ?', [count, deckId])
        await get().fetchDecks()
        return count
    },

    deleteWord: async (wordId, deckId) => {
        await window.electronAPI.dbRun('DELETE FROM progress WHERE word_id = ?', [wordId])
        await window.electronAPI.dbRun('DELETE FROM words WHERE id = ?', [wordId])
        await window.electronAPI.dbRun('UPDATE decks SET word_count = word_count - 1 WHERE id = ?', [deckId])
        await get().fetchWords(deckId)
        await get().fetchDecks()
    }
}))
