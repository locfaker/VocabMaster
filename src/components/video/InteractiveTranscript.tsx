import React, { useEffect, useRef, useState, useMemo, memo } from 'react'
import { TranscriptCue, translateEnToVi } from '@/services/youtubeTranscriptService'
import { BookmarkPlus, Search, Volume2, Play } from 'lucide-react'

interface InteractiveTranscriptProps {
  cues: TranscriptCue[]
  currentTime: number
  onSeek: (seconds: number) => void
  onWordClick: (word: string, contextSentence: string) => void
  onAddNote: (cue: TranscriptCue) => void
  onLoadCustomCues?: (newCues: TranscriptCue[]) => void
  onOpenExplorer?: () => void
}

type SubtitleMode = 'both' | 'en-only' | 'hover-vi'

const formatTimestamp = (seconds: number) => {
  const mins = Math.floor(seconds / 60)
  const secs = Math.floor(seconds % 60)
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
}

interface CueItemProps {
  cue: TranscriptCue
  isActive: boolean
  subMode: SubtitleMode
  onSeek: (seconds: number) => void
  onWordClick: (word: string, contextSentence: string) => void
  onAddNote: (cue: TranscriptCue) => void
}

const CueItem = memo<CueItemProps>(
  ({ cue, isActive, subMode, onSeek, onWordClick, onAddNote }) => {
    const [viTranslation, setViTranslation] = useState(cue.textVi || '')

    useEffect(() => {
      if (cue.textVi) {
        setViTranslation(cue.textVi)
      } else if (isActive && !viTranslation) {
        translateEnToVi(cue.textEn).then((translated) => {
          if (translated) {
            cue.textVi = translated
            setViTranslation(translated)
          }
        })
      }
    }, [cue.textVi, isActive, cue.textEn, viTranslation])

    const [isSpeaking, setIsSpeaking] = useState(false)

    useEffect(() => {
      return () => {
        if (isSpeaking && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          window.speechSynthesis.cancel()
        }
      }
    }, [isSpeaking])

    const handleSpeakBilingual = () => {
      if (typeof window === 'undefined' || !('speechSynthesis' in window)) return

      if (isSpeaking) {
        window.speechSynthesis.cancel()
        setIsSpeaking(false)
        return
      }

      window.speechSynthesis.cancel() // Hủy giọng đang đọc nếu có
      setIsSpeaking(true)

      const targetVi = viTranslation || cue.textVi

      // 1. Đọc tiếng Anh trước
      const enUtterance = new SpeechSynthesisUtterance(cue.textEn)
      enUtterance.lang = 'en-US'
      enUtterance.rate = 0.95

      enUtterance.onend = () => {
        // 2. Tiếng Anh kết thúc -> Tự động đọc tiếng Việt tiếp theo
        if (targetVi && typeof window !== 'undefined' && 'speechSynthesis' in window) {
          const viUtterance = new SpeechSynthesisUtterance(targetVi)
          viUtterance.lang = 'vi-VN'
          viUtterance.rate = 0.95
          viUtterance.onend = () => setIsSpeaking(false)
          viUtterance.onerror = () => setIsSpeaking(false)
          window.speechSynthesis.speak(viUtterance)
        } else {
          setIsSpeaking(false)
        }
      }

      enUtterance.onerror = () => {
        setIsSpeaking(false)
      }

      window.speechSynthesis.speak(enUtterance)
    }

    return (
      <div
        id={`cue-item-${cue.id}`}
        className={`transition-all duration-200 rounded-2xl p-3 sm:p-3.5 border ${
          isActive
            ? 'bg-gradient-to-r from-primary-50/90 to-indigo-50/60 dark:from-primary-950/70 dark:to-indigo-950/40 border-l-4 border-l-primary-500 border-primary-300 dark:border-primary-700 shadow-md ring-1 ring-primary-500/20'
            : 'bg-white dark:bg-dark-card border-gray-100 dark:border-gray-800/60 border-l-4 border-l-transparent hover:bg-gray-50/80 dark:hover:bg-gray-800/40 opacity-75 hover:opacity-100'
        }`}
      >
        {/* Header: Timestamp, Audio Pronunciation, and Add Note */}
        <div className='flex items-center justify-between mb-1.5'>
          <div className='flex items-center gap-1.5'>
            <button
              onClick={() => onSeek(cue.start)}
              className={`px-2 py-0.5 rounded-md font-mono text-[11px] sm:text-xs font-bold flex items-center gap-1 transition-all ${
                isActive
                  ? 'bg-primary-600 text-white shadow-sm shadow-primary-500/30'
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-primary-100 dark:hover:bg-primary-900/40 hover:text-primary-600'
              }`}
            >
              <Play size={10} className='fill-current' />
              <span>{formatTimestamp(cue.start)}</span>
            </button>

            <button
              onClick={handleSpeakBilingual}
              className={`flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold transition-all ${
                isSpeaking
                  ? 'bg-amber-500 text-white animate-pulse shadow-sm shadow-amber-500/30'
                  : isActive
                    ? 'bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 hover:bg-primary-200 dark:hover:bg-primary-800/60'
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-300 hover:bg-primary-50 dark:hover:bg-primary-900/30'
              }`}
              title={isSpeaking ? 'Dừng đọc' : 'Phát âm câu này (EN ➔ VI)'}
            >
              <Volume2 size={12} className={isSpeaking ? 'animate-bounce' : ''} />
              <span>{isSpeaking ? 'Đang đọc...' : isActive ? 'Đọc song ngữ' : 'Nghe'}</span>
            </button>
          </div>

          <div className='flex items-center gap-1'>
            <button
              onClick={() => onAddNote(cue)}
              className='p-1 rounded-lg text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors'
              title='Ghi chú câu này'
            >
              <BookmarkPlus size={14} />
            </button>
          </div>
        </div>

        {/* English sentence with interactive click-to-lookup words */}
        <p
          className={`leading-relaxed transition-colors ${
            isActive
              ? 'text-sm sm:text-base font-bold text-gray-950 dark:text-white'
              : 'text-xs sm:text-sm font-medium text-gray-700 dark:text-gray-300'
          }`}
        >
          {cue.words.map((word, wIdx) => (
            <span
              key={wIdx}
              onClick={() => onWordClick(word, cue.textEn)}
              className={`inline cursor-pointer rounded-sm px-0.5 transition-colors ${
                isActive
                  ? 'hover:bg-primary-200 dark:hover:bg-primary-800/80 hover:text-primary-800 dark:hover:text-primary-200 underline decoration-primary-400 decoration-1 underline-offset-2'
                  : 'hover:bg-primary-100 dark:hover:bg-primary-900/60 hover:text-primary-600 dark:hover:text-primary-400'
              }`}
              title='Nhấp để tra từ'
            >
              {word}{' '}
            </span>
          ))}
        </p>

        {/* Vietnamese translation */}
        {subMode !== 'en-only' && (
          <p
            className={`mt-1 text-xs leading-normal transition-opacity ${
              isActive
                ? 'font-semibold text-primary-700 dark:text-primary-300'
                : 'font-normal text-gray-500 dark:text-gray-400'
            } ${subMode === 'hover-vi' ? 'opacity-0 hover:opacity-100' : 'opacity-100'}`}
          >
            {viTranslation || cue.textVi || (isActive ? 'Đang dịch tiếng Việt...' : '')}
          </p>
        )}
      </div>
    )
  },
  (prev, next) => {
    return (
      prev.isActive === next.isActive &&
      prev.subMode === next.subMode &&
      prev.cue.id === next.cue.id &&
      prev.cue.textVi === next.cue.textVi
    )
  },
)
CueItem.displayName = 'CueItem'

export const InteractiveTranscript: React.FC<InteractiveTranscriptProps> = ({
  cues,
  currentTime,
  onSeek,
  onWordClick,
  onAddNote,
}) => {
  const [subMode, setSubMode] = useState<SubtitleMode>('both')
  const [searchQuery, setSearchQuery] = useState('')
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const prevActiveIdRef = useRef<number | null>(null)

  // Find currently active cue
  const activeCueId = useMemo(() => {
    if (cues.length === 0) return null
    const exact = cues.find((c) => currentTime >= c.start && currentTime <= c.end + 0.25)
    if (exact) return exact.id
    // Fallback to latest passed cue
    for (let i = cues.length - 1; i >= 0; i--) {
      if (currentTime >= cues[i].start) {
        return cues[i].id
      }
    }
    return cues[0]?.id ?? null
  }, [cues, currentTime])

  // Smooth scroll ONLY inside this container (never scroll parent page / window)
  useEffect(() => {
    if (!activeCueId || activeCueId === prevActiveIdRef.current) return
    prevActiveIdRef.current = activeCueId

    const container = containerRef.current
    const el = document.getElementById(`cue-item-${activeCueId}`)
    if (container && el) {
      const containerRect = container.getBoundingClientRect()
      const elRect = el.getBoundingClientRect()
      const relativeTop = elRect.top - containerRect.top + container.scrollTop
      const targetScrollTop = relativeTop - container.clientHeight / 2 + el.offsetHeight / 2

      container.scrollTo({
        top: Math.max(0, targetScrollTop),
        behavior: 'smooth',
      })
    }
  }, [activeCueId])

  // Filter cues by search query
  const filteredCues = useMemo(() => {
    if (!searchQuery.trim()) return cues
    const q = searchQuery.toLowerCase()
    return cues.filter(
      (c) => c.textEn.toLowerCase().includes(q) || c.textVi.toLowerCase().includes(q),
    )
  }, [cues, searchQuery])

  return (
    <div className='flex flex-col h-full bg-white dark:bg-dark-card rounded-2xl shadow-md border border-gray-100 dark:border-gray-800 overflow-hidden'>
      {/* Sleek 1-line Header: Subtitle Mode Tabs + Search + Count */}
      <div className='p-2 sm:p-2.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-2 bg-gray-50/80 dark:bg-gray-800/40 shrink-0'>
        {/* Mode Switcher */}
        <div className='flex items-center gap-0.5 bg-gray-200/70 dark:bg-gray-800 p-0.5 rounded-xl text-[11px] font-bold'>
          <button
            onClick={() => setSubMode('both')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              subMode === 'both'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Song ngữ
          </button>
          <button
            onClick={() => setSubMode('en-only')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              subMode === 'en-only'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Chỉ EN
          </button>
          <button
            onClick={() => setSubMode('hover-vi')}
            className={`px-2.5 py-1 rounded-lg transition-all ${
              subMode === 'hover-vi'
                ? 'bg-white dark:bg-gray-700 text-primary-600 dark:text-primary-400 shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-700'
            }`}
          >
            Ẩn VI
          </button>
        </div>

        {/* Right side: Search button toggle & Counter */}
        <div className='flex items-center gap-1.5'>
          <button
            onClick={() => setIsSearchOpen((o) => !o)}
            className={`p-1.5 rounded-lg border text-xs transition-colors ${
              isSearchOpen || searchQuery
                ? 'bg-primary-50 border-primary-200 text-primary-600 dark:bg-primary-950/60 dark:border-primary-800 dark:text-primary-400'
                : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 text-gray-500 hover:text-gray-700'
            }`}
            title='Tìm kiếm câu thoại'
          >
            <Search size={14} />
          </button>
          <span className='text-[11px] font-mono font-bold text-gray-400 dark:text-gray-500 px-1'>
            {filteredCues.length} câu
          </span>
        </div>
      </div>

      {/* Expandable Search Bar */}
      {isSearchOpen && (
        <div className='px-3 py-1.5 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2 bg-gray-50/50 dark:bg-gray-850 shrink-0'>
          <Search size={14} className='text-gray-400 shrink-0' />
          <input
            type='text'
            autoFocus
            placeholder='Tìm từ hoặc câu thoại...'
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className='w-full text-xs bg-transparent border-none focus:outline-none text-gray-700 dark:text-gray-200 placeholder:text-gray-400'
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className='text-xs text-gray-400 hover:text-gray-600 px-1'
            >
              ✕
            </button>
          )}
        </div>
      )}

      {/* Transcript Scroll Stream */}
      <div ref={containerRef} className='flex-1 min-h-0 overflow-y-auto p-2.5 sm:p-3 space-y-2'>
        {filteredCues.length === 0 ? (
          <div className='py-12 text-center text-gray-400 text-xs sm:text-sm'>
            Không tìm thấy câu nào phù hợp với từ khóa.
          </div>
        ) : (
          filteredCues.map((cue) => (
            <CueItem
              key={cue.id}
              cue={cue}
              isActive={activeCueId === cue.id}
              subMode={subMode}
              onSeek={onSeek}
              onWordClick={onWordClick}
              onAddNote={onAddNote}
            />
          ))
        )}
      </div>
    </div>
  )
}
