// ============================================
// Video Learning Page (YouTube Bilingual)
// ============================================

import React, { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  fetchYouTubeBilingualTranscript,
  TranscriptCue,
  ALL_CURATED_LEARNING_VIDEOS,
  VideoInfo,
} from '@/services/youtubeTranscriptService'
import { lookupWord, WordLookupResult } from '@/services/dictionaryService'
import {
  YouTubePlayer,
  InteractiveTranscript,
  WordLookupPopover,
  VideoNotesDrawer,
  VideoExplorerModal,
  VideoNote,
} from '@/components/video'
import { Youtube, Sparkles, Compass } from 'lucide-react'
import { useDeckStore } from '@/store/deckStore'

interface FlowContext {
  flowTitle: string
  step: number
  totalSteps: number
}

export const VideoLearning: React.FC = () => {
  const { fetchDecks } = useDeckStore()
  const [searchParams] = useSearchParams()
  const paramVideoId = searchParams.get('v') || searchParams.get('videoId')
  const [showSearchModal, setShowSearchModal] = useState(false)
  const [activeFlow, setActiveFlow] = useState<FlowContext | null>(null)
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(paramVideoId || 'UF8uR6Z6KLc')
  const [currentVideoInfo, setCurrentVideoInfo] = useState<VideoInfo | null>(
    ALL_CURATED_LEARNING_VIDEOS[0]?.info || null,
  )
  const [cues, setCues] = useState<TranscriptCue[]>([])
  const [loading, setLoading] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const [loadStatus, setLoadStatus] = useState('Đang kết nối...')
  const [currentTime, setCurrentTime] = useState(0)
  const [seekToTime, setSeekToTime] = useState<number | null>(null)
  const [autoPause, setAutoPause] = useState(false)
  const [activeWordLookup, setActiveWordLookup] = useState<WordLookupResult | null>(null)
  const [notes, setNotes] = useState<VideoNote[]>([])

  // Ensure decks are loaded
  useEffect(() => {
    fetchDecks()
  }, [fetchDecks])

  // Load Video Transcript with explicit percentage steps
  const handleLoadVideo = async (videoId: string, info?: VideoInfo, flowCtx?: FlowContext) => {
    if (flowCtx) {
      setActiveFlow(flowCtx)
    }
    setLoading(true)
    setLoadProgress(10)
    setLoadStatus('Đang kết nối tới YouTube...')
    setCurrentVideoId(videoId)
    setCurrentTime(0)
    setSeekToTime(0)

    const foundCurated = ALL_CURATED_LEARNING_VIDEOS.find((v) => v.info.videoId === videoId)
    if (info) {
      setCurrentVideoInfo(info)
    } else if (foundCurated) {
      setCurrentVideoInfo(foundCurated.info)
    } else {
      setCurrentVideoInfo({
        videoId,
        title: 'Video YouTube Học Tiếng Anh',
        channel: 'YouTube Creator',
        thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      })
    }

    // Step 2: Extracting
    const progressTimer1 = setTimeout(() => {
      setLoadProgress(40)
      setLoadStatus('Đang trích xuất toàn bộ luồng phụ đề gốc...')
    }, 300)

    // Step 3: Translating & Tokenizing
    const progressTimer2 = setTimeout(() => {
      setLoadProgress(75)
      setLoadStatus('Đang biên dịch song ngữ AI & gán từ điển tương tác...')
    }, 700)

    try {
      const transcriptCues = await fetchYouTubeBilingualTranscript(videoId)
      setLoadProgress(95)
      setLoadStatus(`Đã xử lý ${transcriptCues.length} câu thoại song ngữ...`)
      await new Promise((r) => setTimeout(r, 300))
      setLoadProgress(100)
      setLoadStatus('Hoàn tất! Sẵn sàng bài học.')
      setCues(transcriptCues)
      await new Promise((r) => setTimeout(r, 200))
    } catch (err) {
      console.error('Failed to load transcript:', err)
    } finally {
      clearTimeout(progressTimer1)
      clearTimeout(progressTimer2)
      setLoading(false)
      setLoadProgress(0)
    }
  }

  // Initial load or when URL query parameter changes
  useEffect(() => {
    const targetVideoId = paramVideoId || currentVideoId || 'UF8uR6Z6KLc'
    handleLoadVideo(targetVideoId)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paramVideoId])

  // Navigation callbacks
  const handlePrevSentence = useCallback(() => {
    const currentIndex = cues.findIndex((c) => currentTime >= c.start && currentTime <= c.end)
    if (currentIndex > 0) {
      setSeekToTime(cues[currentIndex - 1].start)
    } else if (cues[0]) {
      setSeekToTime(cues[0].start)
    }
  }, [cues, currentTime])

  const handleNextSentence = useCallback(() => {
    const currentIndex = cues.findIndex((c) => currentTime >= c.start && currentTime <= c.end)
    if (currentIndex >= 0 && currentIndex < cues.length - 1) {
      setSeekToTime(cues[currentIndex + 1].start)
    }
  }, [cues, currentTime])

  const handleRepeatSentence = useCallback(() => {
    const currentCue = cues.find((c) => currentTime >= c.start && currentTime <= c.end)
    if (currentCue) {
      setSeekToTime(currentCue.start)
    }
  }, [cues, currentTime])

  // Word Click Handler
  const handleWordClick = async (rawWord: string, contextSentence: string) => {
    const result = await lookupWord(rawWord, contextSentence)
    setActiveWordLookup(result)
  }

  // Add Note Handler
  const handleAddNote = (newNoteData: { timestamp: number; quote: string; userNote: string }) => {
    const newNote: VideoNote = {
      id: Date.now().toString(),
      ...newNoteData,
      createdAt: new Date().toISOString(),
    }
    setNotes((prev) => [newNote, ...prev])
  }

  const handleDeleteNote = (id: string) => {
    setNotes((prev) => prev.filter((n) => n.id !== id))
  }

  const currentCue = cues.find((c) => currentTime >= c.start && currentTime <= c.end)

  return (
    <div className='p-2 sm:p-4 md:p-6 max-w-7xl mx-auto flex flex-col h-[calc(100dvh-70px)] md:h-auto overflow-hidden md:overflow-visible space-y-2 sm:space-y-4'>
      {/* Top Minimal Header */}
      <div className='flex items-center justify-between gap-2 px-1 shrink-0'>
        <div className='flex items-center gap-2 min-w-0'>
          <div className='p-1.5 sm:p-2 rounded-xl bg-red-600 text-white shadow-sm shrink-0'>
            <Youtube size={18} className='sm:w-5 sm:h-5' />
          </div>
          <div className='min-w-0'>
            <h1 className='font-display font-bold text-sm sm:text-lg text-gray-900 dark:text-white truncate'>
              {currentVideoInfo?.title || 'Video Song Ngữ'}
            </h1>
            <p className='text-[10px] sm:text-xs text-gray-500 dark:text-gray-400 truncate'>
              {currentVideoInfo?.channel || 'YouTube English'} • {cues.length} câu song ngữ
            </p>
          </div>
        </div>

        {/* Change Video & Recommendations Pill */}
        <button
          onClick={() => setShowSearchModal(true)}
          className='flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary-50 dark:bg-primary-950/50 text-primary-600 dark:text-primary-400 border border-primary-200 dark:border-primary-800/60 text-xs font-bold hover:bg-primary-100 transition-all shrink-0 active:scale-95 shadow-sm'
        >
          <Compass size={14} />
          <span className='hidden sm:inline'>Khám Phá & Lộ Trình</span>
          <span className='sm:hidden'>Lộ trình / Đổi</span>
        </button>
      </div>

      {/* Active Flow Roadmap Banner */}
      {activeFlow && (
        <div className='flex items-center justify-between px-3 py-2 rounded-2xl bg-gradient-to-r from-primary-500/10 via-indigo-500/10 to-primary-500/5 dark:from-primary-950/40 dark:via-indigo-950/40 dark:to-primary-950/20 border border-primary-200/80 dark:border-primary-800/80 text-xs shrink-0 animate-fadeIn'>
          <div className='flex items-center gap-2 min-w-0'>
            <span className='px-2 py-0.5 rounded-lg bg-primary-600 text-white text-[10px] font-extrabold shadow-xs shrink-0'>
              Lộ trình
            </span>
            <span className='font-bold text-gray-900 dark:text-white truncate'>
              {activeFlow.flowTitle}
            </span>
            <span className='text-[11px] font-medium text-primary-600 dark:text-primary-400 shrink-0'>
              • Bài {activeFlow.step}/{activeFlow.totalSteps}
            </span>
          </div>

          <button
            onClick={() => setShowSearchModal(true)}
            className='text-[11px] font-bold text-primary-600 hover:text-primary-700 dark:text-primary-400 hover:underline shrink-0 ml-2'
          >
            Đổi bài
          </button>
        </div>
      )}

      {/* Loading State */}
      {loading ? (
        <div className='flex-1 flex flex-col items-center justify-center p-6 bg-white dark:bg-dark-card rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm'>
          <div className='w-full max-w-md space-y-4 text-center'>
            <div className='w-12 h-12 rounded-2xl bg-primary-100 dark:bg-primary-950/60 text-primary-600 dark:text-primary-400 flex items-center justify-center mx-auto shadow-inner'>
              <Sparkles size={24} className='animate-pulse text-primary-500' />
            </div>
            <div>
              <h3 className='text-base font-bold font-display text-gray-900 dark:text-white'>
                Đang xử lý bài học video
              </h3>
              <p className='text-xs text-gray-500 dark:text-gray-400 mt-1'>{loadStatus}</p>
            </div>
            <div className='w-full h-2.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden p-0.5 border border-gray-200 dark:border-gray-700/60'>
              <div
                className='h-full bg-gradient-to-r from-primary-600 via-indigo-500 to-primary-400 rounded-full transition-all duration-300'
                style={{ width: `${loadProgress}%` }}
              />
            </div>
          </div>
        </div>
      ) : currentVideoId ? (
        <div className='flex-1 min-h-0 flex flex-col lg:grid lg:grid-cols-12 gap-2 sm:gap-4 items-stretch lg:items-start overflow-hidden lg:overflow-visible'>
          {/* Video Player (Pinned at top on mobile, 7 cols on desktop) */}
          <div className='shrink-0 w-full lg:col-span-7 space-y-3'>
            <YouTubePlayer
              videoId={currentVideoId}
              onTimeUpdate={setCurrentTime}
              onPrevSentence={handlePrevSentence}
              onNextSentence={handleNextSentence}
              onRepeatSentence={handleRepeatSentence}
              autoPause={autoPause}
              onToggleAutoPause={() => setAutoPause((p) => !p)}
              seekToTime={seekToTime}
            />

            {/* Desktop Notes Drawer (Hidden on Mobile) */}
            <div className='hidden lg:block h-72'>
              <VideoNotesDrawer
                notes={notes}
                currentTime={currentTime}
                currentQuote={currentCue?.textEn}
                onAddNote={handleAddNote}
                onDeleteNote={handleDeleteNote}
                onSeek={(time) => setSeekToTime(time)}
              />
            </div>
          </div>

          {/* Transcript Stream (Fills exactly remaining viewport space on mobile, 5 cols on desktop) */}
          <div className='flex-1 min-h-0 w-full lg:col-span-5 lg:h-[620px] overflow-hidden'>
            <InteractiveTranscript
              cues={cues}
              currentTime={currentTime}
              onSeek={(time) => setSeekToTime(time)}
              onWordClick={handleWordClick}
              onAddNote={(cue) => {
                handleAddNote({
                  timestamp: Math.round(cue.start),
                  quote: cue.textEn,
                  userNote: cue.textVi,
                })
              }}
            />
          </div>
        </div>
      ) : null}

      {/* Modal / Dialog for Video Search & Curated Recommendations */}
      {showSearchModal && (
        <VideoExplorerModal
          currentVideoId={currentVideoId}
          onSelectVideo={(id, info, flowCtx) => handleLoadVideo(id, info, flowCtx)}
          onClose={() => setShowSearchModal(false)}
        />
      )}

      {/* Word Lookup Modal */}
      {activeWordLookup && (
        <WordLookupPopover wordData={activeWordLookup} onClose={() => setActiveWordLookup(null)} />
      )}
    </div>
  )
}
