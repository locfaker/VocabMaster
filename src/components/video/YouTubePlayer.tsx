// ============================================
// Ultra-Resilient YouTube Player (Unified Embed Player)
// ============================================

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  Play,
  Pause,
  RotateCcw,
  SkipBack,
  SkipForward,
  Gauge,
  Sparkles,
  ExternalLink,
} from 'lucide-react'

interface YouTubePlayerProps {
  videoId: string
  onTimeUpdate: (time: number) => void
  onPrevSentence: () => void
  onNextSentence: () => void
  onRepeatSentence: () => void
  autoPause: boolean
  onToggleAutoPause: () => void
  seekToTime?: number | null
}

declare global {
  interface Window {
    YT?: {
      Player: new (
        elementId: string | HTMLElement,
        config: {
          videoId?: string
          playerVars?: Record<string, unknown>
          events?: {
            onReady?: (event: { target: unknown }) => void
            onStateChange?: (event: { data: number }) => void
          }
        },
      ) => {
        getCurrentTime: () => number
        getPlayerState: () => number
        playVideo: () => void
        pauseVideo: () => void
        seekTo: (seconds: number, allowSeekAhead?: boolean) => void
        setPlaybackRate: (rate: number) => void
        destroy: () => void
      }
    }
    onYouTubeIframeAPIReady?: () => void
  }
}

export const YouTubePlayer: React.FC<YouTubePlayerProps> = ({
  videoId,
  onTimeUpdate,
  onPrevSentence,
  onNextSentence,
  onRepeatSentence,
  autoPause,
  onToggleAutoPause,
  seekToTime,
}) => {
  const iframeRef = useRef<HTMLIFrameElement | null>(null)
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const ytPlayerRef = useRef<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1.0)
  const [isApiReady, setIsApiReady] = useState(false)

  // Helper to send command directly via postMessage to iframe
  const postIframeCommand = useCallback((func: string, args: unknown[] = []) => {
    if (iframeRef.current?.contentWindow) {
      try {
        iframeRef.current.contentWindow.postMessage(
          JSON.stringify({
            event: 'command',
            func,
            args,
          }),
          '*',
        )
      } catch (err) {
        console.warn('postIframeCommand error:', err)
      }
    }
  }, [])

  // 1. Listen to postMessage from YouTube iframe
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data) return

      try {
        let data = event.data
        if (typeof data === 'string') {
          data = JSON.parse(data)
        }

        if (data.event === 'infoDelivery' && data.info) {
          if (typeof data.info.currentTime === 'number') {
            onTimeUpdate(data.info.currentTime)
          }
          if (typeof data.info.playerState === 'number') {
            setIsPlaying(data.info.playerState === 1)
          }
          if (typeof data.info.playbackRate === 'number') {
            setPlaybackRate(data.info.playbackRate)
          }
        }

        if (data.event === 'onReady') {
          setIsApiReady(true)
          postIframeCommand('listening')
        }

        if (data.event === 'onStateChange') {
          if (data.info === 1) {
            setIsPlaying(true)
          } else if (data.info === 2 || data.info === 0) {
            setIsPlaying(false)
          }
        }
      } catch {
        // Not a JSON message from YT
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [onTimeUpdate, postIframeCommand])

  // 2. Load YouTube IFrame API script
  useEffect(() => {
    if (window.YT && window.YT.Player) {
      setIsApiReady(true)
      return
    }

    const existingScript = document.getElementById('youtube-iframe-api')
    if (!existingScript) {
      const tag = document.createElement('script')
      tag.id = 'youtube-iframe-api'
      tag.src = 'https://www.youtube.com/iframe_api'
      const firstScriptTag = document.getElementsByTagName('script')[0]
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag)
    }

    const prevOnReady = window.onYouTubeIframeAPIReady
    window.onYouTubeIframeAPIReady = () => {
      if (prevOnReady) prevOnReady()
      setIsApiReady(true)
    }

    const checkInterval = setInterval(() => {
      if (window.YT && window.YT.Player) {
        setIsApiReady(true)
        clearInterval(checkInterval)
      }
    }, 300)

    return () => clearInterval(checkInterval)
  }, [])

  // 3. Initialize / Bind YT.Player instance to existing iframe
  const playerId = 'yt-player-' + videoId
  useEffect(() => {
    if (!isApiReady || !window.YT || !iframeRef.current) return

    if (ytPlayerRef.current?.destroy) {
      try {
        ytPlayerRef.current.destroy()
      } catch {
        // ignore
      }
      ytPlayerRef.current = null
    }

    try {
      ytPlayerRef.current = new window.YT.Player(iframeRef.current, {
        events: {
          onReady: () => {
            setIsApiReady(true)
            postIframeCommand('listening')
          },
          onStateChange: (event: { data: number }) => {
            if (event.data === 1) {
              setIsPlaying(true)
            } else if (event.data === 2 || event.data === 0) {
              setIsPlaying(false)
            }
          },
        },
      })
    } catch (err) {
      console.warn('YT.Player binding note (falling back to direct postMessage):', err)
    }

    return () => {
      if (ytPlayerRef.current?.destroy) {
        try {
          ytPlayerRef.current.destroy()
        } catch {
          // ignore
        }
      }
      ytPlayerRef.current = null
    }
  }, [isApiReady, videoId, postIframeCommand])

  // 4. Time Polling loop
  useEffect(() => {
    const interval = setInterval(() => {
      if (ytPlayerRef.current && typeof ytPlayerRef.current.getCurrentTime === 'function') {
        try {
          const currentTime = ytPlayerRef.current.getCurrentTime()
          if (typeof currentTime === 'number' && !isNaN(currentTime)) {
            onTimeUpdate(currentTime)
          }
          if (typeof ytPlayerRef.current.getPlayerState === 'function') {
            const state = ytPlayerRef.current.getPlayerState()
            setIsPlaying(state === 1)
          }
        } catch {
          // Player initializing
        }
      } else {
        // Ping iframe to deliver info
        postIframeCommand('listening')
      }
    }, 150)

    return () => clearInterval(interval)
  }, [onTimeUpdate, postIframeCommand])

  // 5. Seek To Time Handler
  useEffect(() => {
    if (seekToTime !== null && seekToTime !== undefined && seekToTime >= 0) {
      if (ytPlayerRef.current?.seekTo) {
        try {
          ytPlayerRef.current.seekTo(seekToTime, true)
          ytPlayerRef.current.playVideo?.()
        } catch {
          postIframeCommand('seekTo', [seekToTime, true])
          postIframeCommand('playVideo')
        }
      } else {
        postIframeCommand('seekTo', [seekToTime, true])
        postIframeCommand('playVideo')
      }
      setIsPlaying(true)
    }
  }, [seekToTime, postIframeCommand])

  // 6. Play / Pause Toggle
  const togglePlay = useCallback(() => {
    if (isPlaying) {
      if (ytPlayerRef.current?.pauseVideo) {
        ytPlayerRef.current.pauseVideo()
      } else {
        postIframeCommand('pauseVideo')
      }
      setIsPlaying(false)
    } else {
      if (ytPlayerRef.current?.playVideo) {
        ytPlayerRef.current.playVideo()
      } else {
        postIframeCommand('playVideo')
      }
      setIsPlaying(true)
    }
  }, [isPlaying, postIframeCommand])

  // 7. Change Speed Handler
  const handleRateChange = (rate: number) => {
    setPlaybackRate(rate)
    if (ytPlayerRef.current?.setPlaybackRate) {
      try {
        ytPlayerRef.current.setPlaybackRate(rate)
      } catch {
        postIframeCommand('setPlaybackRate', [rate])
      }
    } else {
      postIframeCommand('setPlaybackRate', [rate])
    }
  }

  // 8. Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement
      if (target && ['INPUT', 'TEXTAREA', 'SELECT'].includes(target.tagName)) return

      if (e.code === 'Space') {
        e.preventDefault()
        togglePlay()
      } else if (e.code === 'KeyA' || e.key === 'ArrowLeft') {
        e.preventDefault()
        onPrevSentence()
      } else if (e.code === 'KeyD' || e.key === 'ArrowRight') {
        e.preventDefault()
        onNextSentence()
      } else if (e.code === 'KeyR') {
        e.preventDefault()
        onRepeatSentence()
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [togglePlay, onPrevSentence, onNextSentence, onRepeatSentence])

  const embedUrl = `https://www.youtube.com/embed/${videoId}?enablejsapi=1&playsinline=1&rel=0&autoplay=0&iv_load_policy=3&fs=0`

  return (
    <div className='flex flex-col shrink-0 rounded-2xl overflow-hidden bg-black shadow-xl border border-gray-800 transition-all'>
      {/* Video Container (Aspect 16:9 on all screens) */}
      <div className='relative w-full aspect-video bg-black overflow-hidden flex items-center justify-center'>
        <iframe
          ref={iframeRef}
          id={playerId}
          src={embedUrl}
          title='YouTube video player'
          className='w-full h-full border-0 bg-black'
          allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share'
          referrerPolicy='strict-origin-when-cross-origin'
          allowFullScreen={false}
        />
      </div>

      {/* Mobile-First Learning Control Toolbar (Single row, never wraps) */}
      <div className='p-2 sm:p-3 bg-gray-950/95 backdrop-blur-md border-t border-gray-800/80 flex items-center justify-between gap-1.5 sm:gap-2 text-white overflow-x-auto no-scrollbar'>
        {/* Navigation & Loop Buttons */}
        <div className='flex items-center gap-1.5 sm:gap-2'>
          <button
            onClick={onPrevSentence}
            className='p-2 sm:px-2.5 sm:py-2 rounded-xl bg-gray-800/90 active:bg-gray-700 hover:bg-gray-700 text-gray-200 transition-all flex items-center gap-1 text-xs active:scale-95 shadow-sm'
            title='Câu trước (Phím A hoặc ←)'
            aria-label='Previous Sentence'
          >
            <SkipBack size={15} />
            <span className='hidden sm:inline font-medium'>Câu trước [A]</span>
          </button>

          <button
            onClick={togglePlay}
            className='p-2.5 sm:p-3 rounded-xl bg-primary-600 active:bg-primary-700 hover:bg-primary-500 text-white shadow-lg shadow-primary-600/30 transition-all active:scale-95 flex items-center justify-center'
            title='Phát / Tạm dừng (Phím Space)'
            aria-label={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause size={17} className='fill-white' />
            ) : (
              <Play size={17} className='fill-white' />
            )}
          </button>

          <button
            onClick={onRepeatSentence}
            className='p-2 sm:px-2.5 sm:py-2 rounded-xl bg-gray-800/90 active:bg-gray-700 hover:bg-gray-700 text-gray-200 transition-all flex items-center gap-1 text-xs active:scale-95 shadow-sm'
            title='Lặp lại câu hiện tại (Phím R)'
            aria-label='Repeat Sentence'
          >
            <RotateCcw size={15} />
            <span className='hidden sm:inline font-medium'>Lặp lại [R]</span>
          </button>

          <button
            onClick={onNextSentence}
            className='p-2 sm:px-2.5 sm:py-2 rounded-xl bg-gray-800/90 active:bg-gray-700 hover:bg-gray-700 text-gray-200 transition-all flex items-center gap-1 text-xs active:scale-95 shadow-sm'
            title='Câu tiếp theo (Phím D hoặc →)'
            aria-label='Next Sentence'
          >
            <span className='hidden sm:inline font-medium'>Câu sau [D]</span>
            <SkipForward size={15} />
          </button>
        </div>

        {/* Speed Controls & Auto-Pause */}
        <div className='flex items-center gap-1.5 sm:gap-2'>
          {/* Speed Pills */}
          <div className='flex items-center bg-gray-900/90 border border-gray-800/90 rounded-xl p-0.5 shadow-inner'>
            <Gauge size={13} className='text-gray-400 ml-1.5 mr-1 hidden sm:inline' />
            {[0.75, 1.0, 1.25].map((speed) => (
              <button
                key={speed}
                onClick={() => handleRateChange(speed)}
                className={
                  'px-1.5 sm:px-2 py-1 rounded-lg text-[11px] sm:text-xs font-semibold transition-all ' +
                  (playbackRate === speed
                    ? 'bg-primary-600 text-white shadow-sm'
                    : 'text-gray-400 hover:text-gray-200')
                }
              >
                {speed}x
              </button>
            ))}
          </div>

          {/* Auto-pause Toggle */}
          <button
            onClick={onToggleAutoPause}
            className={
              'px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-semibold flex items-center gap-1 transition-all active:scale-95 shadow-sm ' +
              (autoPause
                ? 'bg-emerald-500/20 border-emerald-500/60 text-emerald-400 shadow-emerald-500/10'
                : 'bg-gray-900/90 border-gray-800/90 text-gray-400 hover:text-gray-200')
            }
            title='Tự động dừng khi hết câu để đọc và nhại lại'
          >
            <Sparkles size={13} className={autoPause ? 'text-emerald-400 animate-pulse' : ''} />
            <span className='hidden sm:inline'>Auto-pause</span>
            <span className='sm:hidden'>Auto</span>
          </button>

          {/* External YouTube Link */}
          <a
            href={'https://www.youtube.com/watch?v=' + videoId}
            target='_blank'
            rel='noopener noreferrer'
            className='p-2 rounded-xl bg-gray-900/90 border border-gray-800/90 text-gray-400 hover:text-gray-200 hover:bg-gray-800 transition-all'
            title='Mở video trên YouTube'
          >
            <ExternalLink size={14} />
          </a>
        </div>
      </div>
    </div>
  )
}
