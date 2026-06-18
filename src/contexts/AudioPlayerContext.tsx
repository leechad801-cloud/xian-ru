import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { tracks } from '../data/library'
import { useLocalStorage } from '../hooks/useLocalStorage'

type PlaybackMode = 'sequence' | 'loop' | 'shuffle'

type AudioPlayerContextValue = {
  currentIndex: number
  currentTime: number
  duration: number
  isPlaying: boolean
  mode: PlaybackMode
  trackCount: number
  volume: number
  playTrack: (index: number) => void
  togglePlay: () => void
  nextTrack: () => void
  previousTrack: () => void
  seekTo: (time: number) => void
  setVolume: (volume: number) => void
  cycleMode: () => void
  setCurrentIndex: (index: number) => void
}

const AudioPlayerContext = createContext<AudioPlayerContextValue | undefined>(undefined)

const STORAGE_KEY = 'xian-ru-audio-settings'

const clampIndex = (index: number) => {
  if (tracks.length === 0) return 0
  return ((index % tracks.length) + tracks.length) % tracks.length
}

export function AudioPlayerProvider({ children }: PropsWithChildren) {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [currentIndex, setCurrentIndexState] = useState(0)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [settings, setSettings] = useLocalStorage(STORAGE_KEY, {
    mode: 'sequence' as PlaybackMode,
    volume: 0.72,
  })

  useEffect(() => {
    const audio = new Audio(tracks[0]?.sourceUrl ?? '')
    audio.preload = 'metadata'
    audio.volume = settings.volume
    audioRef.current = audio

    const onTimeUpdate = () => setCurrentTime(audio.currentTime)
    const onLoadedMetadata = () => setDuration(audio.duration || 0)
    const onPlay = () => setIsPlaying(true)
    const onPause = () => setIsPlaying(false)

    audio.addEventListener('timeupdate', onTimeUpdate)
    audio.addEventListener('loadedmetadata', onLoadedMetadata)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.pause()
      audio.removeEventListener('timeupdate', onTimeUpdate)
      audio.removeEventListener('loadedmetadata', onLoadedMetadata)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
      audioRef.current = null
    }
  }, [])

  const setCurrentIndex = useCallback((index: number) => {
    setCurrentIndexState(clampIndex(index))
    setCurrentTime(0)
    setDuration(0)
  }, [])

  const nextIndex = useCallback(
    (fromIndex: number, direction: 'next' | 'previous') => {
      if (settings.mode === 'shuffle') {
        if (tracks.length <= 1) {
          return fromIndex
        }

        let randomIndex = fromIndex
        while (randomIndex === fromIndex) {
          randomIndex = Math.floor(Math.random() * tracks.length)
        }
        return randomIndex
      }

      if (direction === 'previous') {
        return settings.mode === 'loop' ? clampIndex(fromIndex - 1) : Math.max(fromIndex - 1, 0)
      }

      if (settings.mode === 'loop') {
        return clampIndex(fromIndex + 1)
      }

      return Math.min(fromIndex + 1, tracks.length - 1)
    },
    [settings.mode],
  )

  const playCurrent = useCallback(async () => {
    const audio = audioRef.current
    const track = tracks[currentIndex]
    if (!audio || !track) return

    if (audio.src !== track.sourceUrl) {
      audio.src = track.sourceUrl
      audio.load()
    }

    try {
      await audio.play()
    } catch {
      setIsPlaying(false)
    }
  }, [currentIndex])

  useEffect(() => {
    const audio = audioRef.current
    const track = tracks[currentIndex]

    if (!audio || !track) return

    audio.src = track.sourceUrl
    audio.load()
    setCurrentTime(0)

    if (isPlaying) {
      void playCurrent()
    }
  }, [currentIndex, isPlaying, playCurrent])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    audio.volume = settings.volume
  }, [settings.volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const onEnded = () => {
      if (settings.mode === 'sequence' && currentIndex === tracks.length - 1) {
        setIsPlaying(false)
        return
      }
      setCurrentIndex(nextIndex(currentIndex, 'next'))
      setIsPlaying(true)
    }

    audio.addEventListener('ended', onEnded)
    return () => audio.removeEventListener('ended', onEnded)
  }, [currentIndex, nextIndex, setCurrentIndex, settings.mode])

  const togglePlay = useCallback(() => {
    const audio = audioRef.current
    if (!audio) return

    if (audio.paused) {
      setIsPlaying(true)
      void playCurrent()
      return
    }

    audio.pause()
    setIsPlaying(false)
  }, [playCurrent])

  const playTrack = useCallback(
    (index: number) => {
      setCurrentIndex(index)
      setIsPlaying(true)
    },
    [setCurrentIndex],
  )

  const nextTrack = useCallback(() => {
    const next = nextIndex(currentIndex, 'next')
    if (next === currentIndex && settings.mode === 'sequence') {
      return
    }
    setCurrentIndex(next)
    setIsPlaying(true)
  }, [currentIndex, nextIndex, setCurrentIndex, settings.mode])

  const previousTrack = useCallback(() => {
    setCurrentIndex(nextIndex(currentIndex, 'previous'))
    setIsPlaying(true)
  }, [currentIndex, nextIndex, setCurrentIndex])

  const seekTo = useCallback((time: number) => {
    const audio = audioRef.current
    if (!audio) return
    audio.currentTime = time
    setCurrentTime(time)
  }, [])

  const setVolume = useCallback(
    (volume: number) => {
      setSettings((current) => ({ ...current, volume }))
    },
    [setSettings],
  )

  const cycleMode = useCallback(() => {
    setSettings((current) => ({
      ...current,
      mode:
        current.mode === 'sequence'
          ? 'loop'
          : current.mode === 'loop'
            ? 'shuffle'
            : 'sequence',
    }))
  }, [setSettings])

  const value = useMemo<AudioPlayerContextValue>(
    () => ({
      currentIndex,
      currentTime,
      duration,
      isPlaying,
      mode: settings.mode,
      trackCount: tracks.length,
      volume: settings.volume,
      playTrack,
      togglePlay,
      nextTrack,
      previousTrack,
      seekTo,
      setVolume,
      cycleMode,
      setCurrentIndex,
    }),
    [
      currentIndex,
      currentTime,
      duration,
      isPlaying,
      settings.mode,
      settings.volume,
      playTrack,
      togglePlay,
      nextTrack,
      previousTrack,
      seekTo,
      setVolume,
      cycleMode,
      setCurrentIndex,
    ],
  )

  return <AudioPlayerContext.Provider value={value}>{children}</AudioPlayerContext.Provider>
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext)
  if (!context) {
    throw new Error('useAudioPlayer must be used within AudioPlayerProvider')
  }
  return context
}
