import type { WordWithProgress, QuizQuestion, TypingChallenge } from '@/types'

// Generate quiz questions with 4 options
export function generateQuizQuestions(
    words: WordWithProgress[],
    allWords: WordWithProgress[],
    count: number = 10,
    type: 'definition' | 'term' | 'mixed' = 'mixed'
): QuizQuestion[] {
    const questions: QuizQuestion[] = []
    const shuffledWords = [...words].sort(() => Math.random() - 0.5).slice(0, count)

    for (const word of shuffledWords) {
        const questionType = type === 'mixed'
            ? (Math.random() > 0.5 ? 'definition' : 'term')
            : type

        // Get wrong options from other words
        const otherWords = allWords.filter(w => w.id !== word.id)
        const wrongOptions = otherWords
            .sort(() => Math.random() - 0.5)
            .slice(0, 3)
            .map(w => questionType === 'definition' ? w.definition : w.term)

        const correctAnswer = questionType === 'definition' ? word.definition : word.term

        // Shuffle options
        const allOptions = [...wrongOptions, correctAnswer].sort(() => Math.random() - 0.5)
        const correctIndex = allOptions.indexOf(correctAnswer)

        questions.push({
            word,
            options: allOptions,
            correctIndex,
            type: questionType
        })
    }

    return questions
}

// Generate typing challenges
export function generateTypingChallenges(
    words: WordWithProgress[],
    count: number = 10
): TypingChallenge[] {
    const shuffledWords = [...words].sort(() => Math.random() - 0.5).slice(0, count)

    return shuffledWords.map(word => ({
        word,
        hint: word.definition,
        maskedWord: maskWord(word.term)
    }))
}

// Mask word for typing hint (show first and last letter)
function maskWord(word: string): string {
    if (word.length <= 2) return '_'.repeat(word.length)
    const first = word[0]
    const last = word[word.length - 1]
    const middle = '_'.repeat(word.length - 2)
    return `${first}${middle}${last}`
}

// Check typing answer with fuzzy matching
export function checkTypingAnswer(input: string, correct: string): {
    isCorrect: boolean
    similarity: number
    feedback: string
} {
    const normalizedInput = input.toLowerCase().trim()
    const normalizedCorrect = correct.toLowerCase().trim()

    if (normalizedInput === normalizedCorrect) {
        return { isCorrect: true, similarity: 100, feedback: 'Chính xác!' }
    }

    // Calculate Levenshtein distance for similarity
    const similarity = calculateSimilarity(normalizedInput, normalizedCorrect)

    if (similarity >= 90) {
        return { isCorrect: true, similarity, feedback: 'Gần đúng! (có lỗi chính tả nhỏ)' }
    } else if (similarity >= 70) {
        return { isCorrect: false, similarity, feedback: 'Gần đúng rồi, thử lại!' }
    } else {
        return { isCorrect: false, similarity, feedback: `Sai rồi. Đáp án: ${correct}` }
    }
}

// Levenshtein distance based similarity
function calculateSimilarity(str1: string, str2: string): number {
    const len1 = str1.length
    const len2 = str2.length
    const matrix: number[][] = []

    for (let i = 0; i <= len1; i++) {
        matrix[i] = [i]
    }
    for (let j = 0; j <= len2; j++) {
        matrix[0][j] = j
    }

    for (let i = 1; i <= len1; i++) {
        for (let j = 1; j <= len2; j++) {
            const cost = str1[i - 1] === str2[j - 1] ? 0 : 1
            matrix[i][j] = Math.min(
                matrix[i - 1][j] + 1,
                matrix[i][j - 1] + 1,
                matrix[i - 1][j - 1] + cost
            )
        }
    }

    const distance = matrix[len1][len2]
    const maxLen = Math.max(len1, len2)
    return Math.round((1 - distance / maxLen) * 100)
}

// Generate listening challenge
export function speakWord(text: string, rate: number = 1): void {
    if ('speechSynthesis' in window) {
        speechSynthesis.cancel()
        const utterance = new SpeechSynthesisUtterance(text)
        utterance.lang = 'en-US'
        utterance.rate = rate
        speechSynthesis.speak(utterance)
    }
}

// Shuffle array helper
export function shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array]
    for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1))
            ;[shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]]
    }
    return shuffled
}
