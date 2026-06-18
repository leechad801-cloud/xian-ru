import { tracks } from '../data/library'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'

const modeLabel: Record<'sequence' | 'loop' | 'shuffle', string> = {
  sequence: '顺序',
  loop: '循环',
  shuffle: '随机',
}

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds <= 0) return '0:00'
  const minutes = Math.floor(seconds / 60)
  const remainingSeconds = Math.floor(seconds % 60)
  return `${minutes}:${String(remainingSeconds).padStart(2, '0')}`
}

export function AudioPlayerBar() {
  const {
    currentIndex,
    currentTime,
    duration,
    isPlaying,
    mode,
    nextTrack,
    playTrack,
    previousTrack,
    seekTo,
    setCurrentIndex,
    setVolume,
    togglePlay,
    trackCount,
    volume,
    cycleMode,
  } = useAudioPlayer()

  const currentTrack = tracks[currentIndex]

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-black/90 px-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] pt-4 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl flex-col gap-3 rounded-[1.75rem] border border-white/10 bg-white/[0.04] p-4 shadow-2xl shadow-black/50">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-[11px] uppercase tracking-[0.3em] text-white/35">Now playing</p>
            <h2 className="truncate text-sm font-medium text-white">{currentTrack?.title}</h2>
            <p className="text-xs text-white/45">{currentTrack?.artist} · {trackCount} 首</p>
          </div>

          <button
            type="button"
            onClick={cycleMode}
            className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/75 transition hover:border-white/30 hover:text-white"
          >
            {modeLabel[mode]}
          </button>
        </div>

        <input
          type="range"
          min={0}
          max={duration || 0}
          step={1}
          value={Math.min(currentTime, duration || 0)}
          onChange={(event) => seekTo(Number(event.target.value))}
          className="w-full"
        />

        <div className="flex items-center justify-between text-[11px] text-white/45">
          <span>{formatTime(currentTime)}</span>
          <span>{formatTime(duration)}</span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={previousTrack}
            className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/75 transition hover:border-white/30 hover:text-white"
          >
            上一首
          </button>
          <button
            type="button"
            onClick={togglePlay}
            className="flex-1 rounded-full bg-white px-4 py-2 text-sm font-medium text-black transition hover:bg-white/85"
          >
            {isPlaying ? '暂停' : '播放'}
          </button>
          <button
            type="button"
            onClick={nextTrack}
            className="rounded-full border border-white/10 px-3 py-2 text-sm text-white/75 transition hover:border-white/30 hover:text-white"
          >
            下一首
          </button>
        </div>

        <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-center">
          <label className="flex items-center gap-3 text-xs text-white/60">
            音量
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={volume}
              onChange={(event) => setVolume(Number(event.target.value))}
              className="w-full"
            />
          </label>

          <select
            value={currentIndex}
            onChange={(event) => {
              const index = Number(event.target.value)
              setCurrentIndex(index)
              playTrack(index)
            }}
            className="rounded-full border border-white/10 bg-white/5 px-3 py-2 text-xs text-white outline-none"
          >
            {tracks.map((track, index) => (
              <option key={track.id} value={index} className="bg-black text-white">
                {track.title}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  )
}
