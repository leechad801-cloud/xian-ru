import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type Dispatch,
  type SetStateAction,
} from 'react'
import { GlobalWorkerOptions, getDocument } from 'pdfjs-dist/legacy/build/pdf.mjs'
import pdfWorker from 'pdfjs-dist/build/pdf.worker.min.mjs?url'
import type { PDFDocumentProxy } from 'pdfjs-dist/types/src/display/api'
import { books, tracks, type Track } from './content'

GlobalWorkerOptions.workerSrc = pdfWorker

type View = 'library' | 'music' | 'notes'
type PlayerMode = 'sequential' | 'loop' | 'shuffle'
type Note = {
  id: string
  content: string
  updatedAt: string
}

type StoredPlayer = {
  trackIndex: number
  mode: PlayerMode
  volume: number
  resumeTime: number
  shouldResume: boolean
}

const DEFAULT_PLAYER: StoredPlayer = {
  trackIndex: 0,
  mode: 'sequential',
  volume: 0.72,
  resumeTime: 0,
  shouldResume: false,
}

const navigation: { id: View; label: string; caption: string }[] = [
  { id: 'library', label: '书籍', caption: '6 本馆藏，沉浸阅读' },
  { id: 'music', label: '音乐', caption: `${tracks.length} 首曲目，持续播放` },
  { id: 'notes', label: '笔记', caption: '随手记录想法与摘录' },
]

function getGoogleDriveId(url: string) {
  const match = url.match(/\/file\/d\/([^/]+)/)
  return match?.[1] ?? ''
}

function getGoogleDriveDownloadUrl(url: string) {
  const id = getGoogleDriveId(url)
  return `https://drive.google.com/uc?export=download&id=${id}`
}

function getGoogleDrivePreviewUrl(url: string) {
  const id = getGoogleDriveId(url)
  return `https://drive.google.com/file/d/${id}/preview`
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function formatTime(value: number) {
  if (!Number.isFinite(value) || value < 0) {
    return '00:00'
  }

  const minutes = Math.floor(value / 60)
  const seconds = Math.floor(value % 60)
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat('zh-CN', {
    month: 'numeric',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(new Date(value))
}

function getNextTrackIndex(mode: PlayerMode, trackIndex: number, trackList: Track[]) {
  if (trackList.length === 0) {
    return 0
  }

  if (mode === 'loop') {
    return trackIndex
  }

  if (mode === 'shuffle') {
    if (trackList.length === 1) {
      return 0
    }

    let nextIndex = trackIndex
    while (nextIndex === trackIndex) {
      nextIndex = Math.floor(Math.random() * trackList.length)
    }
    return nextIndex
  }

  return trackIndex + 1 < trackList.length ? trackIndex + 1 : 0
}

function useLocalStorageState<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') {
      return initialValue
    }

    const stored = window.localStorage.getItem(key)
    if (!stored) {
      return initialValue
    }

    try {
      return JSON.parse(stored) as T
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    window.localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue] as const
}

function updateStoredState<T>(
  setter: Dispatch<SetStateAction<T>>,
  update: SetStateAction<T>,
) {
  setter((current) => (typeof update === 'function' ? (update as (value: T) => T)(current) : update))
}

function App() {
  const [activeView, setActiveView] = useLocalStorageState<View>('xianru-active-view', 'library')
  const [selectedBookId, setSelectedBookId] = useLocalStorageState<string>(
    'xianru-selected-book',
    books[0].id,
  )
  const [readingProgress, setReadingProgress] = useLocalStorageState<Record<string, number>>(
    'xianru-reading-progress',
    {},
  )
  const [notes, setNotes] = useLocalStorageState<Note[]>('xianru-notes', [])
  const [noteDraft, setNoteDraft] = useLocalStorageState('xianru-note-draft', '')
  const [storedPlayer, setStoredPlayer] = useLocalStorageState<StoredPlayer>(
    'xianru-player',
    DEFAULT_PLAYER,
  )
  const [isPlaying, setIsPlaying] = useState(storedPlayer.shouldResume)
  const [currentTime, setCurrentTime] = useState(storedPlayer.resumeTime)
  const [duration, setDuration] = useState(0)
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null)
  const [pdfStatus, setPdfStatus] = useState<'idle' | 'loading' | 'ready' | 'error'>('loading')
  const [pdfError, setPdfError] = useState('')
  const [pageCount, setPageCount] = useState(0)
  const [readerWidth, setReaderWidth] = useState(0)

  const selectedBook = useMemo(
    () => books.find((book) => book.id === selectedBookId) ?? books[0],
    [selectedBookId],
  )
  const currentPage = clamp(readingProgress[selectedBook.id] ?? 1, 1, Math.max(pageCount, 1))
  const currentTrack = tracks[storedPlayer.trackIndex] ?? tracks[0]
  const canvasRef = useRef<HTMLCanvasElement | null>(null)
  const readerFrameRef = useRef<HTMLDivElement | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const persistedSecondRef = useRef(Math.floor(storedPlayer.resumeTime))

  useEffect(() => {
    if (!readerFrameRef.current) {
      return undefined
    }

    const frame = readerFrameRef.current
    const updateWidth = () => setReaderWidth(frame.clientWidth)
    updateWidth()

    const observer = new ResizeObserver(updateWidth)
    observer.observe(frame)

    return () => observer.disconnect()
  }, [])

  useEffect(() => {
    const loadingTask = getDocument({
      url: getGoogleDriveDownloadUrl(selectedBook.driveUrl),
      withCredentials: false,
    })

    loadingTask.promise
      .then((document) => {
        setPdfDocument(document)
        setPdfStatus('ready')
        setPageCount(document.numPages)
        updateStoredState(setReadingProgress, (progress) => ({
          ...progress,
          [selectedBook.id]: clamp(progress[selectedBook.id] ?? 1, 1, document.numPages),
        }))
      })
      .catch(() => {
        setPdfStatus('error')
        setPdfError('当前 PDF 无法直接渲染，请使用备用预览链接继续阅读。')
      })

    return () => {
      void loadingTask.destroy()
    }
  }, [selectedBook, setReadingProgress])

  useEffect(() => {
    if (!pdfDocument || !canvasRef.current || !readerWidth) {
      return undefined
    }

    let cancelled = false
    let renderTask: { cancel: () => void; promise: Promise<void> } | null = null

    const renderPage = async () => {
      const page = await pdfDocument.getPage(currentPage)
      if (cancelled || !canvasRef.current) {
        return
      }

      const baseViewport = page.getViewport({ scale: 1 })
      const scale = clamp((readerWidth - 48) / baseViewport.width, 0.9, 1.9)
      const viewport = page.getViewport({ scale })
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      if (!context) {
        return
      }

      const ratio = window.devicePixelRatio || 1
      canvas.width = Math.floor(viewport.width * ratio)
      canvas.height = Math.floor(viewport.height * ratio)
      canvas.style.width = `${viewport.width}px`
      canvas.style.height = `${viewport.height}px`
      context.setTransform(ratio, 0, 0, ratio, 0, 0)
      context.clearRect(0, 0, viewport.width, viewport.height)

      renderTask = page.render({
        canvas,
        canvasContext: context,
        viewport,
      })

      await renderTask.promise
    }

    void renderPage().catch(() => {
      if (!cancelled) {
        setPdfStatus('error')
        setPdfError('页面渲染失败，请切换到 Google Drive 预览继续阅读。')
      }
    })

    return () => {
      cancelled = true
      renderTask?.cancel()
    }
  }, [currentPage, pdfDocument, readerWidth])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio || !currentTrack) {
      return
    }

    const source = getGoogleDriveDownloadUrl(currentTrack.driveUrl)
    if (audio.src !== source) {
      audio.src = source
      audio.load()
    }
  }, [currentTrack])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    audio.volume = storedPlayer.volume
  }, [storedPlayer.volume])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    const syncMetadata = () => {
      setDuration(audio.duration || 0)
      if (storedPlayer.resumeTime > 0) {
        audio.currentTime = Math.min(storedPlayer.resumeTime, audio.duration || storedPlayer.resumeTime)
        setCurrentTime(audio.currentTime)
      }
      if (storedPlayer.shouldResume) {
        void audio.play().catch(() => setIsPlaying(false))
      }
    }

    const syncTime = () => {
      setCurrentTime(audio.currentTime)
      setDuration(audio.duration || 0)
      const second = Math.floor(audio.currentTime)
      if (second !== persistedSecondRef.current) {
        persistedSecondRef.current = second
        updateStoredState(setStoredPlayer, (player) => ({
          ...player,
          resumeTime: audio.currentTime,
        }))
      }
    }

    const handleEnded = () => {
      const nextIndex = getNextTrackIndex(storedPlayer.mode, storedPlayer.trackIndex, tracks)
      updateStoredState(setStoredPlayer, (player) => ({
        ...player,
        trackIndex: nextIndex,
        resumeTime: 0,
        shouldResume: true,
      }))
      setCurrentTime(0)
      setIsPlaying(true)
    }

    audio.addEventListener('loadedmetadata', syncMetadata)
    audio.addEventListener('timeupdate', syncTime)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', syncMetadata)
      audio.removeEventListener('timeupdate', syncTime)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [setStoredPlayer, storedPlayer.mode, storedPlayer.resumeTime, storedPlayer.shouldResume, storedPlayer.trackIndex])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) {
      return
    }

    if (isPlaying) {
      void audio.play().catch(() => setIsPlaying(false))
      updateStoredState(setStoredPlayer, (player) => ({ ...player, shouldResume: true }))
      return
    }

    audio.pause()
    updateStoredState(setStoredPlayer, (player) => ({
      ...player,
      shouldResume: false,
      resumeTime: audio.currentTime,
    }))
  }, [isPlaying, setStoredPlayer])

  const readingCompletion = pageCount ? Math.round((currentPage / pageCount) * 100) : 0

  const selectBook = (bookId: string) => {
    setSelectedBookId(bookId)
    setPdfStatus('loading')
    setPdfError('')
    setPdfDocument(null)
    setPageCount(0)
  }

  const saveNote = () => {
    const content = noteDraft.trim()
    if (!content) {
      return
    }

    const now = new Date().toISOString()
    updateStoredState(setNotes, (items) => [
      {
        id: crypto.randomUUID(),
        content,
        updatedAt: now,
      },
      ...items,
    ])
    setNoteDraft('')
    setActiveView('notes')
  }

  const changeTrack = (trackIndex: number, autoplay = true) => {
    updateStoredState(setStoredPlayer, (player) => ({
      ...player,
      trackIndex,
      resumeTime: 0,
      shouldResume: autoplay,
    }))
    setCurrentTime(0)
    setDuration(0)
    setIsPlaying(autoplay)
  }

  const goToNextTrack = () => {
    changeTrack(getNextTrackIndex(storedPlayer.mode, storedPlayer.trackIndex, tracks))
  }

  const goToPreviousTrack = () => {
    changeTrack(
      storedPlayer.trackIndex > 0 ? storedPlayer.trackIndex - 1 : tracks.length - 1,
      isPlaying,
    )
  }

  const setReadingPage = (page: number) => {
    updateStoredState(setReadingProgress, (progress) => ({
      ...progress,
      [selectedBook.id]: clamp(page, 1, Math.max(pageCount, 1)),
    }))
  }

  return (
    <div className="min-h-screen bg-[#050505] text-stone-100">
      <audio ref={audioRef} preload="metadata" className="hidden" />
      <div className="mx-auto flex min-h-screen max-w-6xl flex-col px-4 pb-40 pt-4 sm:px-6 lg:px-8">
        <header className="sticky top-0 z-20 mb-6 rounded-[2rem] border border-white/10 bg-black/70 px-4 py-4 backdrop-blur">
          <div className="flex flex-col gap-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
              <div className="space-y-2">
                <span className="inline-flex rounded-full border border-white/10 px-3 py-1 text-[11px] uppercase tracking-[0.35em] text-stone-400">
                  Xian-ru
                </span>
                <div>
                  <h1 className="text-3xl font-semibold tracking-[-0.08em] text-white sm:text-5xl">
                    音乐 · 书籍 · 笔记
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-7 text-stone-400 sm:text-base">
                    以黑色极简界面承载你的私人馆藏。顶部切换模块，底部播放器始终在线，阅读与记录之间不打断声音流动。
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3 text-left text-xs text-stone-400 sm:text-sm">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-lg font-semibold text-white">6</div>
                  <div>本 PDF 书籍</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-lg font-semibold text-white">{tracks.length}</div>
                  <div>首公开曲目</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-3">
                  <div className="text-lg font-semibold text-white">{notes.length}</div>
                  <div>条本地笔记</div>
                </div>
              </div>
            </div>
            <nav className="grid grid-cols-3 gap-2 rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-2">
              {navigation.map((item) => {
                const isActive = activeView === item.id
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setActiveView(item.id)}
                    className={`rounded-[1.25rem] px-3 py-3 text-left transition ${
                      isActive
                        ? 'bg-white text-black shadow-[0_20px_60px_rgba(255,255,255,0.15)]'
                        : 'bg-transparent text-stone-300 hover:bg-white/5'
                    }`}
                  >
                    <div className="text-sm font-medium">{item.label}</div>
                    <div className={`mt-1 text-[11px] ${isActive ? 'text-stone-700' : 'text-stone-500'}`}>
                      {item.caption}
                    </div>
                  </button>
                )
              })}
            </nav>
          </div>
        </header>

        <main className="flex-1">
          {activeView === 'library' && (
            <section className="space-y-5">
              <div className="grid gap-4 lg:grid-cols-[320px_minmax(0,1fr)]">
                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-medium text-white">在线书架</h2>
                      <p className="mt-1 text-sm text-stone-400">点击任意书籍即可继续上次阅读位置。</p>
                    </div>
                  </div>
                  <div className="space-y-3">
                    {books.map((book, index) => {
                      const savedPage = readingProgress[book.id] ?? 1
                      const isCurrent = selectedBook.id === book.id
                      return (
                        <button
                          key={book.id}
                          type="button"
                          onClick={() => selectBook(book.id)}
                          className={`w-full rounded-[1.5rem] border px-4 py-4 text-left transition ${
                            isCurrent
                              ? 'border-white/25 bg-white/10 text-white'
                              : 'border-white/10 bg-black/20 text-stone-200 hover:border-white/20 hover:bg-white/[0.06]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-3">
                            <div>
                              <div className="text-xs uppercase tracking-[0.24em] text-stone-500">
                                Book {String(index + 1).padStart(2, '0')}
                              </div>
                              <div className="mt-2 text-base font-medium">{book.title}</div>
                              <div className="mt-1 text-sm text-stone-400">{book.description}</div>
                            </div>
                            <span className="rounded-full border border-white/10 px-2 py-1 text-[11px] text-stone-400">
                              第 {savedPage} 页
                            </span>
                          </div>
                        </button>
                      )
                    })}
                  </div>
                </div>

                <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-4 sm:p-5">
                  <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
                    <div>
                      <div className="text-xs uppercase tracking-[0.3em] text-stone-500">阅读器</div>
                      <h2 className="mt-2 text-2xl font-medium text-white">{selectedBook.title}</h2>
                      <p className="mt-2 max-w-xl text-sm leading-7 text-stone-400">
                        {selectedBook.description} 当前进度 {currentPage}/{pageCount || '--'} 页，已保存 {readingCompletion}% 。
                      </p>
                    </div>
                    <a
                      href={getGoogleDrivePreviewUrl(selectedBook.driveUrl)}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-stone-200 transition hover:border-white/30 hover:bg-white/5"
                    >
                      备用预览
                    </a>
                  </div>

                  <div className="mt-4 flex flex-wrap items-center gap-3 rounded-[1.5rem] border border-white/10 bg-black/20 p-3 text-sm text-stone-300">
                    <button
                      type="button"
                      onClick={() => setReadingPage(currentPage - 1)}
                      className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:bg-white/5 disabled:opacity-40"
                      disabled={currentPage <= 1}
                    >
                      上一页
                    </button>
                    <button
                      type="button"
                      onClick={() => setReadingPage(currentPage + 1)}
                      className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:bg-white/5 disabled:opacity-40"
                      disabled={pageCount > 0 && currentPage >= pageCount}
                    >
                      下一页
                    </button>
                    <div className="min-w-0 flex-1">
                      <input
                        type="range"
                        min={1}
                        max={Math.max(pageCount, 1)}
                        value={currentPage}
                        onChange={(event) => setReadingPage(Number(event.target.value))}
                        className="app-slider w-full"
                        aria-label="阅读进度"
                      />
                    </div>
                    <span className="rounded-full border border-white/10 px-3 py-2 text-xs text-stone-400">
                      第 {currentPage} / {pageCount || '--'} 页
                    </span>
                  </div>

                  <div
                    ref={readerFrameRef}
                    className="mt-4 flex min-h-[420px] items-center justify-center rounded-[1.75rem] border border-white/10 bg-[#0d0d0d] p-4 sm:min-h-[720px]"
                  >
                    {pdfStatus === 'loading' && (
                      <div className="max-w-sm text-center text-sm leading-7 text-stone-400">
                        正在载入 PDF，请稍候…首次打开公开 Google Drive 文档时可能需要更久一点。
                      </div>
                    )}
                    {pdfStatus === 'error' && (
                      <div className="max-w-md text-center text-sm leading-7 text-stone-400">
                        <p>{pdfError}</p>
                        <a
                          href={getGoogleDrivePreviewUrl(selectedBook.driveUrl)}
                          target="_blank"
                          rel="noreferrer"
                          className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-white transition hover:border-white/30 hover:bg-white/5"
                        >
                          在 Google Drive 中阅读
                        </a>
                      </div>
                    )}
                    {pdfStatus === 'ready' && (
                      <canvas
                        ref={canvasRef}
                        className="max-w-full rounded-[1rem] border border-white/10 bg-white shadow-[0_30px_100px_rgba(255,255,255,0.06)]"
                      />
                    )}
                  </div>
                </div>
              </div>
            </section>
          )}

          {activeView === 'music' && (
            <section className="grid gap-5 xl:grid-cols-[360px_minmax(0,1fr)]">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.3em] text-stone-500">正在播放</div>
                <h2 className="mt-3 text-3xl font-medium text-white">{currentTrack.title}</h2>
                <p className="mt-2 text-sm text-stone-400">{currentTrack.artist}</p>
                <div className="mt-6 rounded-[1.75rem] border border-white/10 bg-black/20 p-4">
                  <div className="flex items-center justify-between text-xs text-stone-500">
                    <span>{formatTime(currentTime)}</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                  <input
                    type="range"
                    min={0}
                    max={duration || 0}
                    step={1}
                    value={Math.min(currentTime, duration || 0)}
                    onChange={(event) => {
                      const audio = audioRef.current
                      if (!audio) {
                        return
                      }
                      const nextTime = Number(event.target.value)
                      audio.currentTime = nextTime
                      setCurrentTime(nextTime)
                      updateStoredState(setStoredPlayer, (player) => ({ ...player, resumeTime: nextTime }))
                    }}
                    className="app-slider mt-3 w-full"
                    aria-label="播放进度"
                  />
                  <div className="mt-4 flex items-center gap-2 text-sm">
                    <button
                      type="button"
                      onClick={goToPreviousTrack}
                      className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:bg-white/5"
                    >
                      上一首
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsPlaying((value) => !value)}
                      className="rounded-full bg-white px-5 py-2 text-black transition hover:bg-stone-200"
                    >
                      {isPlaying ? '暂停' : '播放'}
                    </button>
                    <button
                      type="button"
                      onClick={goToNextTrack}
                      className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:bg-white/5"
                    >
                      下一首
                    </button>
                  </div>
                </div>
                <div className="mt-4 space-y-4 rounded-[1.75rem] border border-white/10 bg-black/20 p-4 text-sm text-stone-300">
                  <div>
                    <div className="mb-2 text-xs uppercase tracking-[0.24em] text-stone-500">播放模式</div>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        ['sequential', '顺序'],
                        ['loop', '循环'],
                        ['shuffle', '随机'],
                      ] as const).map(([mode, label]) => (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => updateStoredState(setStoredPlayer, (player) => ({ ...player, mode }))}
                          className={`rounded-full px-3 py-2 transition ${
                            storedPlayer.mode === mode
                              ? 'bg-white text-black'
                              : 'border border-white/10 text-stone-300 hover:border-white/30 hover:bg-white/5'
                          }`}
                        >
                          {label}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <div className="mb-2 flex items-center justify-between text-xs uppercase tracking-[0.24em] text-stone-500">
                      <span>音量</span>
                      <span>{Math.round(storedPlayer.volume * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min={0}
                      max={100}
                      value={Math.round(storedPlayer.volume * 100)}
                      onChange={(event) =>
                        updateStoredState(setStoredPlayer, (player) => ({
                          ...player,
                          volume: Number(event.target.value) / 100,
                        }))
                      }
                      className="app-slider w-full"
                      aria-label="音量"
                    />
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-stone-500">播放列表</div>
                    <h2 className="mt-2 text-2xl font-medium text-white">公开 Google Drive 曲库</h2>
                  </div>
                  <div className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-400">
                    {tracks.length} tracks
                  </div>
                </div>
                <div className="mt-4 grid gap-2 max-h-[70vh] overflow-y-auto pr-1">
                  {tracks.map((track, index) => {
                    const isCurrent = storedPlayer.trackIndex === index
                    return (
                      <button
                        key={track.id}
                        type="button"
                        onClick={() => changeTrack(index)}
                        className={`flex items-center justify-between rounded-[1.25rem] border px-4 py-3 text-left transition ${
                          isCurrent
                            ? 'border-white/25 bg-white/10 text-white'
                            : 'border-white/10 bg-black/20 text-stone-300 hover:border-white/20 hover:bg-white/[0.06]'
                        }`}
                      >
                        <div>
                          <div className="text-sm font-medium">{track.title}</div>
                          <div className="mt-1 text-xs text-stone-500">{track.artist}</div>
                        </div>
                        <div className="flex items-center gap-3 text-xs text-stone-500">
                          {isCurrent && <span className="text-white">LIVE</span>}
                          <span>{String(index + 1).padStart(2, '0')}</span>
                        </div>
                      </button>
                    )
                  })}
                </div>
              </div>
            </section>
          )}

          {activeView === 'notes' && (
            <section className="grid gap-5 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="text-xs uppercase tracking-[0.3em] text-stone-500">写笔记</div>
                <h2 className="mt-2 text-2xl font-medium text-white">保持思绪流动</h2>
                <p className="mt-3 max-w-xl text-sm leading-7 text-stone-400">
                  无论你正在读书还是听歌，都可以切换到这里快速写下灵感、摘录或待办。内容保存在本地浏览器中，下次打开仍会保留。
                </p>
                <div className="mt-5 rounded-[1.75rem] border border-white/10 bg-black/20 p-4">
                  <textarea
                    value={noteDraft}
                    onChange={(event) => setNoteDraft(event.target.value)}
                    placeholder="写下此刻想到的内容…"
                    className="h-64 w-full resize-none rounded-[1.25rem] border border-white/10 bg-[#0c0c0c] px-4 py-4 text-sm leading-7 text-white outline-none transition placeholder:text-stone-600 focus:border-white/25"
                  />
                  <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-xs text-stone-500">
                    <span>{noteDraft.trim().length} 个字符</span>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setNoteDraft('')}
                        className="rounded-full border border-white/10 px-4 py-2 text-stone-300 transition hover:border-white/30 hover:bg-white/5"
                      >
                        清空
                      </button>
                      <button
                        type="button"
                        onClick={saveNote}
                        className="rounded-full bg-white px-4 py-2 text-black transition hover:bg-stone-200"
                      >
                        保存笔记
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-5">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs uppercase tracking-[0.3em] text-stone-500">笔记库</div>
                    <h2 className="mt-2 text-2xl font-medium text-white">已保存内容</h2>
                  </div>
                  <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-400">
                    {notes.length} 条
                  </span>
                </div>
                <div className="mt-4 space-y-3">
                  {notes.length === 0 && (
                    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-black/20 p-8 text-center text-sm leading-7 text-stone-500">
                      还没有保存的笔记。你可以在这里记录阅读摘录、歌单灵感或日常想法。
                    </div>
                  )}
                  {notes.map((note) => (
                    <article
                      key={note.id}
                      className="rounded-[1.5rem] border border-white/10 bg-black/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <p className="whitespace-pre-wrap text-sm leading-7 text-stone-200">{note.content}</p>
                        <button
                          type="button"
                          onClick={() => setNotes((items) => items.filter((item) => item.id !== note.id))}
                          className="rounded-full border border-white/10 px-3 py-1 text-xs text-stone-400 transition hover:border-white/30 hover:bg-white/5 hover:text-white"
                        >
                          删除
                        </button>
                      </div>
                      <div className="mt-3 text-xs text-stone-500">{formatDate(note.updatedAt)}</div>
                    </article>
                  ))}
                </div>
              </div>
            </section>
          )}
        </main>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-white/10 bg-black/90 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="min-w-0">
              <div className="text-xs uppercase tracking-[0.3em] text-stone-500">底部播放器</div>
              <div className="mt-1 truncate text-base font-medium text-white">{currentTrack.title}</div>
              <div className="truncate text-sm text-stone-400">{currentTrack.artist}</div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-sm">
              <button
                type="button"
                onClick={goToPreviousTrack}
                className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:bg-white/5"
              >
                上一首
              </button>
              <button
                type="button"
                onClick={() => setIsPlaying((value) => !value)}
                className="rounded-full bg-white px-5 py-2 text-black transition hover:bg-stone-200"
              >
                {isPlaying ? '暂停' : '播放'}
              </button>
              <button
                type="button"
                onClick={goToNextTrack}
                className="rounded-full border border-white/10 px-4 py-2 transition hover:border-white/30 hover:bg-white/5"
              >
                下一首
              </button>
              <span className="rounded-full border border-white/10 px-3 py-2 text-xs uppercase tracking-[0.18em] text-stone-400">
                {storedPlayer.mode}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-3 text-xs text-stone-500">
            <span>{formatTime(currentTime)}</span>
            <input
              type="range"
              min={0}
              max={duration || 0}
              step={1}
              value={Math.min(currentTime, duration || 0)}
              onChange={(event) => {
                const audio = audioRef.current
                if (!audio) {
                  return
                }
                const nextTime = Number(event.target.value)
                audio.currentTime = nextTime
                setCurrentTime(nextTime)
                updateStoredState(setStoredPlayer, (player) => ({ ...player, resumeTime: nextTime }))
              }}
              className="app-slider flex-1"
              aria-label="底部播放进度"
            />
            <span>{formatTime(duration)}</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
