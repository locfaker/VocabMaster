import { OXFORD_A1_A2 } from './real-data/oxford-3000'
import { IELTS_ACADEMIC, TOEIC_BUSINESS } from './real-data/ielts-specialized'
import { TOEIC_ROADMAP_DECKS } from './real-data/toeic-roadmap'
import { EXTRA_DECKS } from './vocabulary-packs'

export interface VocabWord {
    term: string
    definition: string
    example: string
    phonetic: string
}

export interface VocabDeck {
    name: string
    words: VocabWord[]
    color: string
    icon: string
    description: string
}

// Main Decks
const DECKS: VocabDeck[] = [
    // TOEIC Roadmap (Priority)
    ...TOEIC_ROADMAP_DECKS,
    
    // Specialized Packs
    {
        name: 'Oxford 3000™ (A1-B2)',
        words: OXFORD_A1_A2,
        color: '#4F46E5',
        icon: '📘',
        description: '3000 từ vựng cốt lõi quan trọng nhất trong tiếng Anh.'
    },
    {
        name: 'IELTS Academic Vocab',
        words: IELTS_ACADEMIC,
        color: '#DC2626',
        icon: '🎓',
        description: 'Từ vựng học thuật chuyên sâu cho bài thi IELTS (Band 7.0+).'
    },
    {
        name: 'TOEIC Business & Office',
        words: TOEIC_BUSINESS,
        color: '#059669',
        icon: '💼',
        description: 'Từ vựng tiếng Anh thương mại và môi trường công sở.'
    },
    ...EXTRA_DECKS
]

export function getAllVocabularyDecks(): VocabDeck[] {
    return DECKS
}

export function getTotalWordCount(): number {
    return DECKS.reduce((sum, deck) => sum + deck.words.length, 0)
}

export function getDeckByName(name: string): VocabDeck | undefined {
    return DECKS.find(d => d.name === name)
}
