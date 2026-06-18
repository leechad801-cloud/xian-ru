import { useEffect, useMemo, useRef, useState } from 'react'
import { books, tracks } from './content'

type ModuleKey = 'books' | 'music' | 'notes'
type PlayMode = 'sequence' | 'shuffle' | 'loop'

type ReadingProgress = Record<
  string,
  {
    page: number
    progress: number
    lastOpenedAt: string
  }
>

type SavedNote = {
  id: string
  text: string
  updatedAt: string
}

const storageKeys = {
  module: 'xian-ru-module',
  trackIndex: 'xian-ru-track-index',
  playMode: 'xian-ru-play-mode',
  volume: 'xian-ru-volume',
  notes: 'xian-ru-notes',
  draft: 'xian-ru-note-draft',
  progress: 'xian-ru-reading-progress',
} as const

const moduleLabels: Record<ModuleKey, string> = {
  books: '读书',
  music: '音乐',
  notes: '笔记',
}

function readStoredValue<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') {
    return fallback
  }

  const rawValue = window.localStorage.getItem(key)
  if (!rawValue) {
    return fallback
  }

  try {
    return JSON.parse(rawValue) as T
  } catch {
    return fallback
  }
}

function drivePreviewUrl(id: string) {
  return `https://drive.google.com/file/d/${id}/preview`
}

function driveAudioUrl(id: string) {
  return `https://drive.google.com/uc?export=download&id=${id}`
}

function formatTimestamp(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function App() {
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const notePanelRef = useRef<HTMLTextAreaElement | null>(null)

  const [activeModule, setActiveModule] = useState<ModuleKey>(() =>
    readStoredValue<ModuleKey>(storageKeys.module, 'books'),
  )
  const [selectedBookId, setSelectedBookId] = useState<string>(books[0]?.id ?? '')
  const [readingProgress, setReadingProgress] = useState<ReadingProgress>(() =>
    readStoredValue<ReadingProgress>(storageKeys.progress, {}),
  )
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(() =>
    readStoredValue<number>(storageKeys.trackIndex, 0),
  )
  const [playMode, setPlayMode] = useState<PlayMode>(() =>
    readStoredValue<PlayMode>(storageKeys.playMode, 'sequence'),
  )
  const [volume, setVolume] = useState<number>(() => readStoredValue<number>(storageKeys.volume, 0.72))
  const [isPlaying, setIsPlaying] = useState(false)
  const [notes, setNotes] = useState<SavedNote[]>(() => readStoredValue<SavedNote[]>(storageKeys.notes, []))
  const [noteDraft, setNoteDraft] = useState<string>(() => readStoredValue<string>(storageKeys.draft, ''))
  const [notesOpen, setNotesOpen] = useState(false)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? books[0],
    [selectedBookId],
  )
  const currentTrack = tracks[currentTrackIndex] ?? tracks[0]
  const selectedProgress =
    (selectedBook ? readingProgress[selectedBook.id] : undefined) ?? {
      page: 1,
      progress: 0,
      lastOpenedAt: new Date().toISOString(),
    }

  useEffect(() => {
    window.localStorage.setItem(storageKeys.module, JSON.stringify(activeModule))
  }, [activeModule])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.progress, JSON.stringify(readingProgress))
  }, [readingProgress])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.trackIndex, JSON.stringify(currentTrackIndex))
  }, [currentTrackIndex])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.playMode, JSON.stringify(playMode))
  }, [playMode])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.volume, JSON.stringify(volume))
  }, [volume])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.notes, JSON.stringify(notes))
  }, [notes])

  useEffect(() => {
    window.localStorage.setItem(storageKeys.draft, JSON.stringify(noteDraft))
  }, [noteDraft])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) {
      return
    }

    audio.src = driveAudioUrl(currentTrack.id)
    audio.volume = volume

    if (isPlaying) {
      audio
        .play()
        .then(() => {
          setIsPlaying(true)
        })
        .catch(() => {
          setIsPlaying(false)
        })
    }
  }, [currentTrack, isPlaying, volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.volume = volume
  }, [volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const handleTimeUpdate = () => setCurrentTime(audio.currentTime)
    const handleLoadedMetadata = () => setDuration(audio.duration || 0)
    const handlePause = () => setIsPlaying(false)
    const handlePlay = () => setIsPlaying(true)
    const handleEnded = () => {
      if (playMode === 'loop') {
        audio.currentTime = 0
        void audio.play()
        return
      }

      if (playMode === 'shuffle') {
        setCurrentTrackIndex((index) => {
          if (tracks.length <= 1) {
            return index
          }

          let nextIndex = index
          while (nextIndex === index) {
            nextIndex = Math.floor(Math.random() * tracks.length)
          }
          return nextIndex
        })
        setIsPlaying(true)
        return
      }

      setCurrentTrackIndex((index) => {
        const nextIndex = index + 1
        if (nextIndex >= tracks.length) {
          setIsPlaying(false)
          return index
        }
        return nextIndex
      })
      setIsPlaying((wasPlaying) => {
        const hasNext = currentTrackIndex + 1 < tracks.length
        return wasPlaying && hasNext
      })
    }

    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('pause', handlePause)
    audio.addEventListener('play', handlePlay)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('pause', handlePause)
      audio.removeEventListener('play', handlePlay)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [currentTrackIndex, playMode])

  const cyclePlayMode = () => {
    setPlayMode((mode) => {
      if (mode === 'sequence') {
        return 'shuffle'
      }
      if (mode === 'shuffle') {
        return 'loop'
      }
      return 'sequence'
    })
  }

  const togglePlayback = async () => {
    const audio = audioRef.current
    if (!audio || !currentTrack) {
      return
    }

    if (audio.paused) {
      try {
        await audio.play()
        setIsPlaying(true)
      } catch {
        setIsPlaying(false)
      }
      return
    }

    audio.pause()
    setIsPlaying(false)
  }

  const jumpTrack = async (direction: 1 | -1) => {
    setCurrentTrackIndex((index) => {
      const nextIndex = (index + direction + tracks.length) % tracks.length
      return nextIndex
    })
    setIsPlaying(true)
  }

  const playTrack = async (index: number) => {
    setCurrentTrackIndex(index)
    setIsPlaying(true)
  }

  const updateReadingProgress = (bookId: string, patch: Partial<ReadingProgress[string]>) => {
    setReadingProgress((current) => ({
      ...current,
      [bookId]: {
        page: patch.page ?? current[bookId]?.page ?? 1,
        progress: patch.progress ?? current[bookId]?.progress ?? 0,
        lastOpenedAt: patch.lastOpenedAt ?? new Date().toISOString(),
      },
    }))
  }

  const openBook = (bookId: string) => {
    setSelectedBookId(bookId)
    setActiveModule('books')
    updateReadingProgress(bookId, { lastOpenedAt: new Date().toISOString() })
  }

  const saveCurrentNote = () => {
    const trimmed = noteDraft.trim()
    if (!trimmed) {
      return
    }

    const now = new Date().toISOString()
    setNotes((current) => [{ id: crypto.randomUUID(), text: trimmed, updatedAt: now }, ...current])
    setNoteDraft('')
    setNotesOpen(false)
  }

  const updateExistingNote = (noteId: string) => {
    const trimmed = noteDraft.trim()
    if (!trimmed) {
      return
    }

    const now = new Date().toISOString()
    setNotes((current) =>
      current.map((note) =>
        note.id === noteId
          ? {
              ...note,
              text: trimmed,
              updatedAt: now,
            }
          : note,
      ),
    )
    setNoteDraft('')
    setNotesOpen(false)
  }

  const seekAudio = (nextTime: number) => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.currentTime = nextTime
    setCurrentTime(nextTime)
  }

  const recentNotes = notes.slice(0, 3)

  useEffect(() => {
    if (notesOpen) {
      notePanelRef.current?.focus()
    }
  }, [notesOpen])

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100">
      <audio ref={audioRef} preload="none" />

      <div className="mx-auto flex min-h-screen w-full max-w-7xl flex-col border-x border-white/10 bg-black/80">
        <header className="border-b border-white/10 px-4 py-5 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
            <div className="max-w-2xl space-y-3">
              <p className="text-xs uppercase tracking-[0.45em] text-zinc-500">Xian-ru</p>
              <div className="space-y-2">
                <h1 className="text-3xl font-medium tracking-tight text-white sm:text-5xl">
                  个人阅读、音乐与笔记空间
                </h1>
                <p className="max-w-xl text-sm leading-6 text-zinc-400 sm:text-base">
                  黑色极简界面，三个独立模块清晰切换；底部播放器持续工作，让阅读与写作都不断流。
                </p>
              </div>
            </div>
            <button
              type="button"
              className="inline-flex items-center justify-center rounded-full border border-white/15 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
              onClick={() => setNotesOpen(true)}
            >
              随手记一笔
            </button>
          </div>

          <nav className="mt-6 flex gap-2 overflow-x-auto pb-1">
            {(Object.keys(moduleLabels) as ModuleKey[]).map((moduleKey) => {
              const isActive = activeModule === moduleKey
              return (
                <button
                  key={moduleKey}
                  type="button"
                  className={`rounded-full px-4 py-2 text-sm transition ${
                    isActive
                      ? 'bg-white text-black'
                      : 'border border-white/10 bg-white/5 text-zinc-300 hover:border-white/30 hover:bg-white/10'
                  }`}
                  onClick={() => setActiveModule(moduleKey)}
                >
                  {moduleLabels[moduleKey]}
                </button>
              )
            })}
          </nav>
        </header>

        <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:pb-36">
          {activeModule === 'books' && selectedBook && (
            <section className="grid gap-4 xl:grid-cols-[320px_minmax(0,1fr)]">
              <aside className="space-y-3 rounded-[2rem] border border-white/10 bg-zinc-950/80 p-4">
                <div className="space-y-1">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Book shelf</p>
                  <h2 className="text-xl font-medium text-white">6 本在线书籍</h2>
                </div>
                <div className="space-y-3">
                  {books.map((book, index) => {
                    const bookProgress = readingProgress[book.id]
                    const progressValue = Math.round(bookProgress?.progress ?? 0)
                    return (
                      <button
                        key={book.id}
                        type="button"
                        className={`w-full rounded-[1.5rem] border p-4 text-left transition ${
                          selectedBook.id === book.id
                            ? 'border-white/40 bg-white/10'
                            : 'border-white/10 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                        }`}
                        onClick={() => openBook(book.id)}
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                              Book {String(index + 1).padStart(2, '0')}
                            </p>
                            <h3 className="mt-1 text-lg text-white">{book.title}</h3>
                          </div>
                          <span className="rounded-full border border-white/10 px-2 py-1 text-xs text-zinc-300">
                            {progressValue}%
                          </span>
                        </div>
                        <p className="mt-3 text-sm leading-6 text-zinc-400">{book.description}</p>
                        <div className="mt-4 h-1.5 overflow-hidden rounded-full bg-white/10">
                          <div className="h-full rounded-full bg-white" style={{ width: `${progressValue}%` }} />
                        </div>
                        <p className="mt-3 text-xs text-zinc-500">
                          {bookProgress
                            ? `上次阅读：第 ${bookProgress.page} 页 · ${formatTimestamp(bookProgress.lastOpenedAt)}`
                            : '尚未开始，点击进入阅读'}
                        </p>
                      </button>
                    )
                  })}
                </div>
              </aside>

              <div className="space-y-4">
                <div className="rounded-[2rem] border border-white/10 bg-zinc-950/70 p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div className="space-y-2">
                      <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Now reading</p>
                      <h2 className="text-2xl font-medium text-white">{selectedBook.title}</h2>
                      <p className="max-w-2xl text-sm leading-6 text-zinc-400">
                        {selectedBook.description} 当前已记录到第 {selectedProgress.page} 页，完成 {Math.round(selectedProgress.progress)}%。
                      </p>
                    </div>
                    <a
                      className="inline-flex items-center justify-center rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                      href={`https://drive.google.com/file/d/${selectedBook.id}/view`}
                      target="_blank"
                      rel="noreferrer"
                    >
                      新标签页打开
                    </a>
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-zinc-950/50 p-4 sm:p-5">
                  <div className="mb-4 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                    <label className="space-y-2 text-sm text-zinc-400">
                      当前页码
                      <input
                        type="number"
                        min={1}
                        value={selectedProgress.page}
                        onChange={(event) =>
                          updateReadingProgress(selectedBook.id, {
                            page: Math.max(1, Number(event.target.value) || 1),
                            lastOpenedAt: new Date().toISOString(),
                          })
                        }
                        className="w-full rounded-2xl border border-white/10 bg-black px-4 py-3 text-white outline-none transition focus:border-white/30"
                      />
                    </label>
                    <div className="space-y-2 text-sm text-zinc-400">
                      阅读进度
                      <div className="rounded-2xl border border-white/10 bg-black px-4 py-3 text-white">
                        {Math.round(selectedProgress.progress)}%
                      </div>
                    </div>
                    <div className="space-y-2 text-sm text-zinc-400 md:col-span-2 xl:col-span-2">
                      继续位置
                      <input
                        type="range"
                        min={0}
                        max={100}
                        value={selectedProgress.progress}
                        onChange={(event) =>
                          updateReadingProgress(selectedBook.id, {
                            progress: Number(event.target.value),
                            lastOpenedAt: new Date().toISOString(),
                          })
                        }
                        className="xian-slider h-12 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                      />
                    </div>
                  </div>

                  <iframe
                    key={selectedBook.id}
                    title={selectedBook.title}
                    src={drivePreviewUrl(selectedBook.id)}
                    className="min-h-[65svh] w-full rounded-[1.5rem] border border-white/10 bg-black"
                    allow="autoplay"
                  />
                </div>
              </div>
            </section>
          )}

          {activeModule === 'music' && (
            <section className="space-y-4">
              <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
                <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Live player</p>
                  <h2 className="mt-2 text-3xl font-medium text-white">{currentTrack.title}</h2>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                    共 {tracks.length} 首公开曲目，播放器固定在底部，在阅读或写笔记时都会持续播放。
                  </p>
                  <div className="mt-8 flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                      onClick={() => void togglePlayback()}
                    >
                      {isPlaying ? '暂停播放' : '开始播放'}
                    </button>
                    <button
                      type="button"
                      className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                      onClick={cyclePlayMode}
                    >
                      模式：{playMode === 'sequence' ? '顺序' : playMode === 'shuffle' ? '随机' : '单曲循环'}
                    </button>
                  </div>
                </div>
                <div className="rounded-[2rem] border border-white/10 bg-zinc-950/50 p-5">
                  <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Quick note</p>
                  <h3 className="mt-2 text-xl font-medium text-white">听歌时随手记录</h3>
                  <p className="mt-3 text-sm leading-6 text-zinc-400">
                    打开侧边笔记面板，或直接切到笔记模块继续整理。音乐不会中断。
                  </p>
                  <button
                    type="button"
                    className="mt-6 rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                    onClick={() => setNotesOpen(true)}
                  >
                    打开笔记面板
                  </button>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-zinc-950/60 p-3 sm:p-4">
                <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-3">
                  {tracks.map((track, index) => {
                    const isCurrent = index === currentTrackIndex
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => void playTrack(index)}
                        className={`flex items-center justify-between rounded-[1.25rem] border px-4 py-3 text-left transition ${
                          isCurrent
                            ? 'border-white/35 bg-white/10'
                            : 'border-white/8 bg-white/[0.03] hover:border-white/25 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div>
                          <p className="text-xs uppercase tracking-[0.3em] text-zinc-500">
                            Track {String(index + 1).padStart(2, '0')}
                          </p>
                          <p className="mt-1 text-sm text-white">{track.title}</p>
                        </div>
                        <span className="text-xs text-zinc-400">{isCurrent && isPlaying ? 'Playing' : 'Play'}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {activeModule === 'notes' && (
            <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
              <div className="rounded-[2rem] border border-white/10 bg-zinc-950/80 p-5">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Notebook</p>
                <h2 className="mt-2 text-3xl font-medium text-white">随时写下你的想法</h2>
                <p className="mt-3 max-w-2xl text-sm leading-6 text-zinc-400">
                  草稿与已保存笔记都会保存在 LocalStorage，刷新后仍然保留。你也可以从任何模块打开同一个笔记面板。
                </p>

                <div className="mt-6 space-y-3">
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="写下灵感、摘录、待办或歌单想法……"
                    className="min-h-[280px] w-full rounded-[1.5rem] border border-white/10 bg-black px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30"
                  />
                  <div className="flex flex-wrap gap-3">
                    <button
                      type="button"
                      className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                      onClick={saveCurrentNote}
                    >
                      保存新笔记
                    </button>
                    {notes[0] && (
                      <button
                        type="button"
                        className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                        onClick={() => updateExistingNote(notes[0].id)}
                      >
                        覆盖最近一条
                      </button>
                    )}
                    <button
                      type="button"
                      className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                      onClick={() => setNoteDraft('')}
                    >
                      清空草稿
                    </button>
                  </div>
                </div>
              </div>

              <aside className="rounded-[2rem] border border-white/10 bg-zinc-950/50 p-5">
                <div className="flex items-end justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Archive</p>
                    <h3 className="mt-2 text-xl font-medium text-white">已保存笔记</h3>
                  </div>
                  <span className="text-sm text-zinc-500">{notes.length} 条</span>
                </div>
                <div className="mt-5 space-y-3">
                  {notes.length === 0 && (
                    <div className="rounded-[1.5rem] border border-dashed border-white/10 p-5 text-sm leading-6 text-zinc-500">
                      还没有保存内容。随手写下第一条笔记吧。
                    </div>
                  )}
                  {notes.map((note) => (
                    <article key={note.id} className="rounded-[1.5rem] border border-white/10 bg-black/60 p-4">
                      <div className="flex items-center justify-between gap-4 text-xs text-zinc-500">
                        <span>{formatTimestamp(note.updatedAt)}</span>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            className="rounded-full border border-white/10 px-3 py-1 text-zinc-300 transition hover:border-white/30"
                            onClick={() => setNoteDraft(note.text)}
                          >
                            载入
                          </button>
                          <button
                            type="button"
                            className="rounded-full border border-white/10 px-3 py-1 text-zinc-300 transition hover:border-white/30"
                            onClick={() => setNotes((current) => current.filter((item) => item.id !== note.id))}
                          >
                            删除
                          </button>
                        </div>
                      </div>
                      <p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-zinc-300">{note.text}</p>
                    </article>
                  ))}
                </div>
              </aside>
            </section>
          )}
        </main>

        <div className="pointer-events-none fixed inset-x-0 bottom-0 z-30 px-3 pb-3 sm:px-4">
          <section className="pointer-events-auto mx-auto w-full max-w-6xl rounded-[1.75rem] border border-white/10 bg-black/90 p-4 shadow-[0_-20px_60px_rgba(0,0,0,0.45)] backdrop-blur">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
              <div className="min-w-0 lg:max-w-xs">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Persistent player</p>
                <h3 className="mt-1 truncate text-lg text-white">{currentTrack?.title ?? '暂无曲目'}</h3>
              </div>

              <div className="flex flex-1 flex-col gap-3">
                <div className="flex items-center justify-center gap-3 sm:gap-4">
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                    onClick={() => void jumpTrack(-1)}
                  >
                    上一首
                  </button>
                  <button
                    type="button"
                    className="rounded-full bg-white px-5 py-2 text-sm font-medium text-black transition hover:bg-zinc-200"
                    onClick={() => void togglePlayback()}
                  >
                    {isPlaying ? '暂停' : '播放'}
                  </button>
                  <button
                    type="button"
                    className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                    onClick={() => void jumpTrack(1)}
                  >
                    下一首
                  </button>
                </div>
                <div className="space-y-2">
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={1}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={(event) => seekAudio(Number(event.target.value))}
                    className="xian-slider h-6 w-full cursor-pointer appearance-none rounded-full bg-transparent"
                  />
                  <div className="flex items-center justify-between text-xs text-zinc-500">
                    <span>{Math.floor(currentTime / 60)}:{String(Math.floor(currentTime % 60)).padStart(2, '0')}</span>
                    <span>{playMode === 'sequence' ? '顺序' : playMode === 'shuffle' ? '随机' : '循环'}</span>
                    <span>{Math.floor(duration / 60)}:{String(Math.floor(duration % 60)).padStart(2, '0')}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-3 lg:w-56 lg:justify-end">
                <button
                  type="button"
                  className="rounded-full border border-white/10 px-3 py-2 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                  onClick={cyclePlayMode}
                >
                  {playMode === 'sequence' ? '顺序' : playMode === 'shuffle' ? '随机' : '循环'}
                </button>
                <label className="flex flex-1 items-center gap-2 text-xs text-zinc-500">
                  音量
                  <input
                    type="range"
                    min={0}
                    max={1}
                    step={0.01}
                    value={volume}
                    onChange={(event) => setVolume(Number(event.target.value))}
                    className="xian-slider h-6 flex-1 cursor-pointer appearance-none rounded-full bg-transparent"
                  />
                </label>
              </div>
            </div>
          </section>
        </div>
      </div>

      {notesOpen && (
        <div className="fixed inset-0 z-40 bg-black/70 p-4 backdrop-blur-sm" role="dialog" aria-modal="true">
          <div className="ml-auto flex h-full w-full max-w-xl flex-col rounded-[2rem] border border-white/10 bg-zinc-950 p-5 shadow-2xl">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Quick note</p>
                <h2 className="mt-2 text-2xl font-medium text-white">随时记下灵感</h2>
              </div>
              <button
                type="button"
                className="rounded-full border border-white/10 px-4 py-2 text-sm text-zinc-300 transition hover:border-white/30 hover:bg-white/5"
                onClick={() => setNotesOpen(false)}
              >
                关闭
              </button>
            </div>

            <textarea
              ref={notePanelRef}
              value={noteDraft}
              onChange={(event) => setNoteDraft(event.target.value)}
              placeholder="任何时刻都可以记录一条想法。"
              className="mt-5 min-h-[220px] flex-1 rounded-[1.5rem] border border-white/10 bg-black px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-zinc-600 focus:border-white/30"
            />

            <div className="mt-4 flex flex-wrap gap-3">
              <button
                type="button"
                className="rounded-full bg-white px-5 py-3 text-sm font-medium text-black transition hover:bg-zinc-200"
                onClick={saveCurrentNote}
              >
                保存笔记
              </button>
              <button
                type="button"
                className="rounded-full border border-white/10 px-5 py-3 text-sm text-zinc-200 transition hover:border-white/30 hover:bg-white/5"
                onClick={() => {
                  setActiveModule('notes')
                  setNotesOpen(false)
                }}
              >
                去完整笔记页
              </button>
            </div>

            {recentNotes.length > 0 && (
              <div className="mt-6 space-y-3">
                <p className="text-xs uppercase tracking-[0.35em] text-zinc-500">Recent notes</p>
                {recentNotes.map((note) => (
                  <button
                    key={note.id}
                    type="button"
                    className="w-full rounded-[1.25rem] border border-white/10 bg-black/60 p-4 text-left transition hover:border-white/25"
                    onClick={() => setNoteDraft(note.text)}
                  >
                    <p className="text-xs text-zinc-500">{formatTimestamp(note.updatedAt)}</p>
                    <p className="mt-2 line-clamp-3 whitespace-pre-wrap text-sm leading-6 text-zinc-300">
                      {note.text}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default App
