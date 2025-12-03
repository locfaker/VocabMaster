// ============================================
// Sound Effects for Gamification
// ============================================

import { DB } from '@/constants'

// Audio context singleton
let audioContext: AudioContext | null = null

function getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null

    if (!audioContext) {
        audioContext = new (window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext)()
    }
    return audioContext
}

/**
 * Play a tone with specified parameters
 */
function playTone(
    frequency: number,
    duration: number,
    type: OscillatorType = 'sine',
    volume = 0.3
): void {
    const ctx = getAudioContext()
    if (!ctx) return

    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()

    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)

    oscillator.frequency.value = frequency
    oscillator.type = type

    gainNode.gain.setValueAtTime(volume, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration)

    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + duration)
}

/**
 * Play correct answer sound (ascending tone)
 */
export function playCorrectSound(): void {
    if (!getAudioContext()) return

    playTone(523.25, 0.1, 'sine', 0.2) // C5
    setTimeout(() => playTone(659.25, 0.1, 'sine', 0.2), 100) // E5
    setTimeout(() => playTone(783.99, 0.15, 'sine', 0.2), 200) // G5
}

/**
 * Play wrong answer sound (descending tone)
 */
export function playWrongSound(): void {
    if (!getAudioContext()) return

    playTone(311.13, 0.15, 'triangle', 0.2) // Eb4
    setTimeout(() => playTone(261.63, 0.2, 'triangle', 0.2), 150) // C4
}

/**
 * Play card flip sound
 */
export function playFlipSound(): void {
    if (!getAudioContext()) return
    playTone(800, 0.05, 'sine', 0.1)
}

/**
 * Play achievement unlock sound (fanfare)
 */
export function playAchievementSound(): void {
    if (!getAudioContext()) return

    const notes = [523.25, 659.25, 783.99, 1046.50] // C5, E5, G5, C6
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.2, 'sine', 0.15), i * 100)
    })
}

/**
 * Play level up sound (ascending arpeggio)
 */
export function playLevelUpSound(): void {
    if (!getAudioContext()) return

    const notes = [261.63, 329.63, 392.00, 523.25, 659.25, 783.99]
    notes.forEach((freq, i) => {
        setTimeout(() => playTone(freq, 0.15, 'sine', 0.12), i * 80)
    })
}

/**
 * Play click sound
 */
export function playClickSound(): void {
    if (!getAudioContext()) return
    playTone(1000, 0.03, 'sine', 0.08)
}

/**
 * Check if sound is enabled in settings
 */
export async function isSoundEnabled(): Promise<boolean> {
    try {
        const result = await window.electronAPI.dbGet<{ value: string }>(
            'SELECT value FROM settings WHERE key = ?',
            [DB.SETTINGS_KEYS.SOUND_ENABLED]
        )
        return result?.value !== 'false'
    } catch {
        return true
    }
}

/**
 * Play sound only if enabled in settings
 */
export async function playSoundIfEnabled(soundFn: () => void): Promise<void> {
    const enabled = await isSoundEnabled()
    if (enabled) {
        soundFn()
    }
}
