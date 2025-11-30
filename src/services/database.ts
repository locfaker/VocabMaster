import type { Deck, Word, Progress, DailyStats } from '@/types'

const DB_NAME = 'VocabMasterDB'
const DB_VERSION = 1

let db: IDBDatabase | null = null

export async function initDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION)

        request.onerror = () => reject(request.error)
        request.onsuccess = () => {
            db = request.result
            resolve(db)
        }

        request.onupgradeneeded = (event) => {
            const database = (event.target as IDBOpenDBRequest).result

            // Decks store
            if (!database.objectStoreNames.contains('decks')) {
                const deckStore = database.createObjectStore('decks', { keyPath: 'id', autoIncrement: true })
                deckStore.createIndex('name', 'name', { unique: false })
            }

            // Words store
            if (!database.objectStoreNames.contains('words')) {
                const wordStore = database.createObjectStore('words', { keyPath: 'id', autoIncrement: true })
                wordStore.createIndex('deck_id', 'deck_id', { unique: false })
            }

            // Progress store
            if (!database.objectStoreNames.contains('progress')) {
                const progressStore = database.createObjectStore('progress', { keyPath: 'word_id' })
                progressStore.createIndex('status', 'status', { unique: false })
                progressStore.createIndex('next_review', 'next_review', { unique: false })
            }

            // Stats store
            if (!database.objectStoreNames.contains('stats')) {
                database.createObjectStore('stats', { keyPath: 'date' })
            }

            // Settings store
            if (!database.objectStoreNames.contains('settings')) {
                database.createObjectStore('settings', { keyPath: 'key' })
            }
        }
    })
}

export function getDB(): IDBDatabase {
    if (!db) throw new Error('Database not initialized')
    return db
}

// Generic helpers
function promisifyRequest<T>(request: IDBRequest<T>): Promise<T> {
    return new Promise((resolve, reject) => {
        request.onsuccess = () => resolve(request.result)
        request.onerror = () => reject(request.error)
    })
}

// Decks
export async function getAllDecks(): Promise<Deck[]> {
    const tx = getDB().transaction('decks', 'readonly')
    const store = tx.objectStore('decks')
    return promisifyRequest(store.getAll())
}

export async function getDeck(id: number): Promise<Deck | undefined> {
    const tx = getDB().transaction('decks', 'readonly')
    const store = tx.objectStore('decks')
    return promisifyRequest(store.get(id))
}

export async function createDeck(deck: Omit<Deck, 'id'>): Promise<number> {
    const tx = getDB().transaction('decks', 'readwrite')
    const store = tx.objectStore('decks')
    const newDeck = {
        ...deck,
        word_count: 0,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
    }
    return promisifyRequest(store.add(newDeck)) as Promise<number>
}

export async function updateDeck(id: number, updates: Partial<Deck>): Promise<void> {
    const tx = getDB().transaction('decks', 'readwrite')
    const store = tx.objectStore('decks')
    const deck = await promisifyRequest(store.get(id))
    if (deck) {
        const updated = { ...deck, ...updates, updated_at: new Date().toISOString() }
        await promisifyRequest(store.put(updated))
    }
}

export async function deleteDeck(id: number): Promise<void> {
    const tx = getDB().transaction(['decks', 'words', 'progress'], 'readwrite')

    // Delete deck
    tx.objectStore('decks').delete(id)

    // Delete words in deck
    const wordStore = tx.objectStore('words')
    const wordIndex = wordStore.index('deck_id')
    const words = await promisifyRequest(wordIndex.getAll(id))
    for (const word of words) {
        wordStore.delete(word.id)
        tx.objectStore('progress').delete(word.id)
    }
}

// Words
export async function getWordsByDeck(deckId: number): Promise<Word[]> {
    const tx = getDB().transaction('words', 'readonly')
    const store = tx.objectStore('words')
    const index = store.index('deck_id')
    return promisifyRequest(index.getAll(deckId))
}

export async function createWord(word: Omit<Word, 'id' | 'created_at'>): Promise<number> {
    const tx = getDB().transaction(['words', 'progress', 'decks'], 'readwrite')
    const wordStore = tx.objectStore('words')
    const progressStore = tx.objectStore('progress')
    const deckStore = tx.objectStore('decks')

    const newWord = {
        ...word,
        created_at: new Date().toISOString()
    }
    const wordId = await promisifyRequest(wordStore.add(newWord)) as number

    // Create progress entry
    await promisifyRequest(progressStore.add({
        word_id: wordId,
        ease_factor: 2.5,
        interval: 0,
        repetitions: 0,
        next_review: null,
        status: 'new',
        last_reviewed: null
    }))

    // Update deck word count
    const deck = await promisifyRequest(deckStore.get(word.deck_id))
    if (deck) {
        deck.word_count = (deck.word_count || 0) + 1
        await promisifyRequest(deckStore.put(deck))
    }

    return wordId
}

export async function deleteWord(id: number, deckId: number): Promise<void> {
    const tx = getDB().transaction(['words', 'progress', 'decks'], 'readwrite')
    tx.objectStore('words').delete(id)
    tx.objectStore('progress').delete(id)

    // Update deck word count
    const deckStore = tx.objectStore('decks')
    const deck = await promisifyRequest(deckStore.get(deckId))
    if (deck) {
        deck.word_count = Math.max(0, (deck.word_count || 0) - 1)
        await promisifyRequest(deckStore.put(deck))
    }
}

// Progress
export async function getProgress(wordId: number): Promise<Progress | undefined> {
    const tx = getDB().transaction('progress', 'readonly')
    const store = tx.objectStore('progress')
    return promisifyRequest(store.get(wordId))
}

export async function updateProgress(wordId: number, updates: Partial<Progress>): Promise<void> {
    const tx = getDB().transaction('progress', 'readwrite')
    const store = tx.objectStore('progress')
    const progress = await promisifyRequest(store.get(wordId))
    if (progress) {
        const updated = { ...progress, ...updates }
        await promisifyRequest(store.put(updated))
    }
}

export async function getWordsForReview(): Promise<(Word & { progress: Progress })[]> {
    const today = new Date().toISOString().split('T')[0]
    const tx = getDB().transaction(['words', 'progress'], 'readonly')
    const wordStore = tx.objectStore('words')
    const progressStore = tx.objectStore('progress')

    const allWords = await promisifyRequest(wordStore.getAll())
    const result: (Word & { progress: Progress })[] = []

    for (const word of allWords) {
        const progress = await promisifyRequest(progressStore.get(word.id))
        if (progress) {
            if (progress.status === 'new' || !progress.next_review || progress.next_review <= today) {
                result.push({ ...word, progress })
            }
        }
    }

    return result.slice(0, 50)
}

// Stats
export async function getTodayStats(): Promise<DailyStats> {
    const today = new Date().toISOString().split('T')[0]
    const tx = getDB().transaction('stats', 'readwrite')
    const store = tx.objectStore('stats')

    let stats = await promisifyRequest(store.get(today))
    if (!stats) {
        stats = {
            date: today,
            words_learned: 0,
            words_reviewed: 0,
            correct_count: 0,
            time_spent: 0,
            xp_earned: 0
        }
        await promisifyRequest(store.add(stats))
    }
    return stats
}

export async function updateTodayStats(updates: Partial<DailyStats>): Promise<void> {
    const today = new Date().toISOString().split('T')[0]
    const tx = getDB().transaction('stats', 'readwrite')
    const store = tx.objectStore('stats')

    const stats = await promisifyRequest(store.get(today)) || {
        date: today,
        words_learned: 0,
        words_reviewed: 0,
        correct_count: 0,
        time_spent: 0,
        xp_earned: 0
    }

    const updated = {
        ...stats,
        words_reviewed: stats.words_reviewed + (updates.words_reviewed || 0),
        correct_count: stats.correct_count + (updates.correct_count || 0),
        xp_earned: stats.xp_earned + (updates.xp_earned || 0)
    }
    await promisifyRequest(store.put(updated))
}

export async function getWeeklyStats(): Promise<DailyStats[]> {
    const tx = getDB().transaction('stats', 'readonly')
    const store = tx.objectStore('stats')
    const allStats = await promisifyRequest(store.getAll())

    // Get last 7 days
    const result: DailyStats[] = []
    for (let i = 6; i >= 0; i--) {
        const date = new Date()
        date.setDate(date.getDate() - i)
        const dateStr = date.toISOString().split('T')[0]
        const stat = allStats.find(s => s.date === dateStr) || {
            date: dateStr,
            words_learned: 0,
            words_reviewed: 0,
            correct_count: 0,
            time_spent: 0,
            xp_earned: 0
        }
        result.push(stat)
    }
    return result
}

// Settings
export async function getSetting(key: string): Promise<string | null> {
    const tx = getDB().transaction('settings', 'readonly')
    const store = tx.objectStore('settings')
    const result = await promisifyRequest(store.get(key))
    return result?.value || null
}

export async function setSetting(key: string, value: string): Promise<void> {
    const tx = getDB().transaction('settings', 'readwrite')
    const store = tx.objectStore('settings')
    await promisifyRequest(store.put({ key, value }))
}

// Counts
export async function getProgressCounts(): Promise<{ new: number; review: number; mastered: number }> {
    const tx = getDB().transaction('progress', 'readonly')
    const store = tx.objectStore('progress')
    const all = await promisifyRequest(store.getAll())

    return {
        new: all.filter(p => p.status === 'new').length,
        review: all.filter(p => p.status === 'learning' || p.status === 'review').length,
        mastered: all.filter(p => p.status === 'mastered').length
    }
}
