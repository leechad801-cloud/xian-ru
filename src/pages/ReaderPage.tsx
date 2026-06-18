import ePub from 'epubjs'
import {
  TouchEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react'
import { Link, useParams } from 'react-router-dom'
import { books, type Book } from '../data/library'
import { useLocalStorage } from '../hooks/useLocalStorage'

type ReaderTheme = 'dark' | 'light'
type ReaderFont = 'serif' | 'sans'
type ReaderMode = 'loading' | 'epub' | 'text' | 'error'

type ReaderSettings = {
  fontSize: number
  lineHeight: number
  theme: ReaderTheme
  fontFamily: ReaderFont
}

type SavedProgress =
  | { type: 'epub'; location: string; percentage: number }
  | { type: 'text'; page: number; percentage: number }

type ProgressMap = Record<string, SavedProgress>

const SETTINGS_KEY = 'xian-ru-reader-settings'
const PROGRESS_KEY = 'xian-ru-reader-progress'
const DEFAULT_SETTINGS: ReaderSettings = {
  fontSize: 18,
  lineHeight: 1.75,
  theme: 'dark',
  fontFamily: 'serif',
}

const colors = {
  dark: {
    shell: 'bg-[#0a0a0a] text-white',
    panel: 'border-white/10 bg-white/[0.03]',
    text: '#f4f4f2',
    background: '#0c0c0c',
    muted: 'text-white/55',
  },
  light: {
    shell: 'bg-[#f6f0e3] text-[#231f18]',
    panel: 'border-black/10 bg-white/60',
    text: '#231f18',
    background: '#f6f0e3',
    muted: 'text-black/55',
  },
} as const

function isZipLike(buffer: ArrayBuffer) {
  const signature = new Uint8Array(buffer.slice(0, 2))
  return signature[0] === 0x50 && signature[1] === 0x4b
}

function paginateText(content: string, settings: ReaderSettings) {
  const normalized = content
    .replace(/\r\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  if (!normalized) {
    return ['']
  }

  const baseChars = 1500
  const sizePenalty = (settings.fontSize - 18) * 55
  const lineHeightPenalty = Math.round((settings.lineHeight - 1.75) * 280)
  const pageSize = Math.max(650, baseChars - sizePenalty - lineHeightPenalty)
  const pages: string[] = []

  let cursor = 0
  while (cursor < normalized.length) {
    let end = Math.min(cursor + pageSize, normalized.length)
    if (end < normalized.length) {
      const breakPoint = normalized.lastIndexOf(' ', end)
      if (breakPoint > cursor + Math.floor(pageSize * 0.65)) {
        end = breakPoint
      }
    }
    pages.push(normalized.slice(cursor, end).trim())
    cursor = end
  }

  return pages.length ? pages : ['']
}

function controlClass(theme: ReaderTheme) {
  return theme === 'dark'
    ? 'border-white/10 bg-white/5 text-white hover:border-white/25 hover:bg-white/8'
    : 'border-black/10 bg-black/[0.04] text-black hover:border-black/20 hover:bg-black/[0.07]'
}

function fontStack(fontFamily: ReaderFont) {
  return fontFamily === 'serif'
    ? 'Iowan Old Style, Georgia, serif'
    : 'Inter, -apple-system, BlinkMacSystemFont, Segoe UI, sans-serif'
}

export function ReaderPage() {
  const { bookId } = useParams()
  const book = books.find((entry) => entry.id === bookId) as Book | undefined
  const containerRef = useRef<HTMLDivElement | null>(null)
  const renditionRef = useRef<any>(null)
  const touchStartX = useRef<number | null>(null)
  const [settings, setSettings] = useLocalStorage<ReaderSettings>(SETTINGS_KEY, DEFAULT_SETTINGS)
  const [progressMap, setProgressMap] = useLocalStorage<ProgressMap>(PROGRESS_KEY, {})
  const [mode, setMode] = useState<ReaderMode>('loading')
  const [errorMessage, setErrorMessage] = useState('')
  const [textContent, setTextContent] = useState('')
  const [textPage, setTextPage] = useState(0)
  const [epubProgress, setEpubProgress] = useState(0)

  const palette = colors[settings.theme]
  const savedProgress = book ? progressMap[book.id] : undefined
  const textPages = useMemo(() => paginateText(textContent, settings), [textContent, settings])

  useEffect(() => {
    if (!book || !containerRef.current) {
      setMode('error')
      setErrorMessage('未找到这本书。')
      return
    }

    let cancelled = false
    let cleanup: (() => void) | undefined

    const loadBook = async () => {
      setMode('loading')
      setErrorMessage('')
      setTextContent('')
      setTextPage(0)
      setEpubProgress(savedProgress?.percentage ?? 0)
      containerRef.current!.innerHTML = ''

      try {
        const response = await fetch(book.sourceUrl)
        if (!response.ok) {
          throw new Error('无法读取 Google Drive 文件，请确认链接已公开。')
        }

        const buffer = await response.arrayBuffer()
        if (cancelled) return

        if (isZipLike(buffer)) {
          const epubBook = ePub(buffer)
          const rendition = epubBook.renderTo(containerRef.current!, {
            width: '100%',
            height: '100%',
            spread: 'none',
            flow: 'paginated',
            manager: 'default',
          })

          renditionRef.current = rendition
          setMode('epub')

          await epubBook.ready
          await epubBook.locations.generate(700)

          const onRelocated = (location: any) => {
            const cfi = location?.start?.cfi
            if (!cfi || cancelled) return
            const percentage = epubBook.locations.percentageFromCfi(cfi) || 0
            setEpubProgress(percentage)
            setProgressMap((current) => ({
              ...current,
              [book.id]: {
                type: 'epub',
                location: cfi,
                percentage,
              },
            }))
          }

          rendition.on('relocated', onRelocated)
          cleanup = () => {
            rendition.off('relocated', onRelocated)
            rendition.destroy()
            epubBook.destroy()
            renditionRef.current = null
          }

          const initialLocation = savedProgress?.type === 'epub' ? savedProgress.location : undefined
          await rendition.display(initialLocation)
          return
        }

        const text = new TextDecoder('utf-8').decode(buffer)
        if (cancelled) return
        setTextContent(text)
        setMode('text')
      } catch (error) {
        if (cancelled) return
        setMode('error')
        setErrorMessage(error instanceof Error ? error.message : '文件加载失败。')
      }
    }

    void loadBook()

    return () => {
      cancelled = true
      cleanup?.()
      if (containerRef.current) {
        containerRef.current.innerHTML = ''
      }
    }
  }, [book, savedProgress, setProgressMap])

  useEffect(() => {
    const rendition = renditionRef.current
    if (!rendition || mode !== 'epub') return

    rendition.themes.override('font-size', `${settings.fontSize}px`)
    rendition.themes.override('line-height', `${settings.lineHeight}`)
    rendition.themes.override('font-family', fontStack(settings.fontFamily))
    rendition.themes.override('color', palette.text)
    rendition.themes.override('background', palette.background)
  }, [mode, palette.background, palette.text, settings.fontFamily, settings.fontSize, settings.lineHeight])

  useEffect(() => {
    if (!book || mode !== 'text' || textPages.length === 0) return

    const nextPage =
      savedProgress?.type === 'text'
        ? Math.min(Math.round(savedProgress.percentage * Math.max(textPages.length - 1, 0)), textPages.length - 1)
        : 0

    setTextPage((currentPage) => (currentPage === 0 ? nextPage : Math.min(currentPage, textPages.length - 1)))
  }, [book, mode, savedProgress, textPages.length])

  useEffect(() => {
    if (!book || mode !== 'text' || textPages.length === 0) return

    const percentage = textPages.length === 1 ? 1 : textPage / (textPages.length - 1)
    setProgressMap((current) => ({
      ...current,
      [book.id]: {
        type: 'text',
        page: textPage,
        percentage,
      },
    }))
  }, [book, mode, setProgressMap, textPage, textPages.length])

  if (!book) {
    return (
      <div className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 text-white">
        <p>书籍不存在。</p>
        <Link to="/" className="mt-4 inline-flex rounded-full border border-white/10 px-4 py-2 text-sm text-white/70">
          返回书库
        </Link>
      </div>
    )
  }

  const goNext = () => {
    if (mode === 'epub') {
      void renditionRef.current?.next()
      return
    }
    if (mode === 'text') {
      setTextPage((currentPage) => Math.min(currentPage + 1, textPages.length - 1))
    }
  }

  const goPrevious = () => {
    if (mode === 'epub') {
      void renditionRef.current?.prev()
      return
    }
    if (mode === 'text') {
      setTextPage((currentPage) => Math.max(currentPage - 1, 0))
    }
  }

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.changedTouches[0]?.clientX ?? null
  }

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return
    const delta = (event.changedTouches[0]?.clientX ?? 0) - touchStartX.current
    touchStartX.current = null

    if (Math.abs(delta) < 40) {
      return
    }

    if (delta < 0) {
      goNext()
    } else {
      goPrevious()
    }
  }

  const progressPercent = mode === 'epub' ? epubProgress * 100 : textPages.length === 1 ? 100 : (textPage / Math.max(textPages.length - 1, 1)) * 100

  return (
    <div className={`space-y-4 rounded-[2rem] p-3 sm:p-4 ${palette.shell}`}>
      <section className={`rounded-[1.75rem] border p-4 sm:p-5 ${palette.panel}`}>
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <Link to="/" className={`text-xs uppercase tracking-[0.35em] ${palette.muted}`}>
              ← 返回书库
            </Link>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight">{book.title}</h2>
            <p className={`mt-2 text-sm leading-7 ${palette.muted}`}>{book.summary}</p>
          </div>

          <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
            <button
              type="button"
              onClick={() => setSettings((current) => ({ ...current, fontSize: Math.max(14, current.fontSize - 2) }))}
              className={`rounded-full border px-4 py-2 text-sm transition ${controlClass(settings.theme)}`}
            >
              A-
            </button>
            <button
              type="button"
              onClick={() => setSettings((current) => ({ ...current, fontSize: 18 }))}
              className={`rounded-full border px-4 py-2 text-sm transition ${controlClass(settings.theme)}`}
            >
              A
            </button>
            <button
              type="button"
              onClick={() => setSettings((current) => ({ ...current, fontSize: Math.min(30, current.fontSize + 2) }))}
              className={`rounded-full border px-4 py-2 text-sm transition ${controlClass(settings.theme)}`}
            >
              A+
            </button>
            <button
              type="button"
              onClick={() => setSettings((current) => ({ ...current, theme: current.theme === 'dark' ? 'light' : 'dark' }))}
              className={`rounded-full border px-4 py-2 text-sm transition ${controlClass(settings.theme)}`}
            >
              {settings.theme === 'dark' ? '浅色' : '深色'}
            </button>
          </div>
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="space-y-2 text-sm">
            <span className={palette.muted}>字号：{settings.fontSize}px</span>
            <input
              type="range"
              min={14}
              max={30}
              step={1}
              value={settings.fontSize}
              onChange={(event) => setSettings((current) => ({ ...current, fontSize: Number(event.target.value) }))}
              className="w-full"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className={palette.muted}>行高：{settings.lineHeight.toFixed(2)}</span>
            <input
              type="range"
              min={1.4}
              max={2.2}
              step={0.05}
              value={settings.lineHeight}
              onChange={(event) => setSettings((current) => ({ ...current, lineHeight: Number(event.target.value) }))}
              className="w-full"
            />
          </label>

          <label className="space-y-2 text-sm">
            <span className={palette.muted}>字体</span>
            <select
              value={settings.fontFamily}
              onChange={(event) =>
                setSettings((current) => ({
                  ...current,
                  fontFamily: event.target.value as ReaderFont,
                }))
              }
              className={`w-full rounded-full border px-4 py-2 outline-none transition ${controlClass(settings.theme)}`}
            >
              <option value="serif">serif</option>
              <option value="sans">sans-serif</option>
            </select>
          </label>

          <div className="space-y-2 text-sm">
            <span className={palette.muted}>阅读进度</span>
            <div className={`rounded-[1.25rem] border p-4 ${settings.theme === 'dark' ? 'border-white/10 bg-white/4' : 'border-black/10 bg-black/[0.03]'}`}>
              <p className="text-2xl font-semibold">{progressPercent.toFixed(0)}%</p>
              <p className={palette.muted}>{mode === 'text' ? `第 ${textPage + 1} / ${textPages.length} 页` : '自动保存到当前章节'}</p>
            </div>
          </div>
        </div>
      </section>

      <section className={`rounded-[1.75rem] border p-3 sm:p-4 ${palette.panel}`}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className={`text-xs uppercase tracking-[0.35em] ${palette.muted}`}>
            {mode === 'loading' ? '载入中' : mode === 'epub' ? 'EPUB Reader' : mode === 'text' ? 'TXT Reader' : '读取失败'}
          </span>
          <a
            href={book.previewUrl}
            target="_blank"
            rel="noreferrer"
            className={`rounded-full border px-3 py-1 text-xs transition ${controlClass(settings.theme)}`}
          >
            原始文件
          </a>
        </div>

        <div
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
          className={`relative min-h-[68vh] overflow-hidden rounded-[1.5rem] border ${settings.theme === 'dark' ? 'border-white/10 bg-[#0c0c0c]' : 'border-black/10 bg-[#f7f0e4]'}`}
        >
          {mode === 'loading' && (
            <div className="flex h-[68vh] items-center justify-center text-sm text-white/50">正在准备你的书页…</div>
          )}

          {mode === 'error' && (
            <div className="flex h-[68vh] flex-col items-center justify-center gap-3 px-6 text-center">
              <p className="text-lg font-medium">无法加载当前书籍</p>
              <p className={`max-w-md text-sm leading-7 ${palette.muted}`}>{errorMessage}</p>
            </div>
          )}

          {mode === 'epub' && <div ref={containerRef} className="h-[68vh] w-full" />}

          {mode === 'text' && (
            <div
              style={{ fontSize: `${settings.fontSize}px`, lineHeight: settings.lineHeight, fontFamily: fontStack(settings.fontFamily) }}
              className={`flex h-[68vh] flex-col justify-between px-5 py-6 sm:px-8 ${settings.theme === 'dark' ? 'text-[#f4f4f2]' : 'text-[#231f18]'}`}
            >
              <div className="overflow-auto whitespace-pre-wrap">{textPages[textPage]}</div>
              <div className={`pt-6 text-center text-xs ${palette.muted}`}>滑动或使用按钮快速翻页</div>
            </div>
          )}
        </div>

        <div className="mt-3 flex items-center gap-3">
          <button
            type="button"
            onClick={goPrevious}
            className={`flex-1 rounded-full border px-4 py-3 text-sm transition ${controlClass(settings.theme)}`}
          >
            上一页
          </button>
          <button
            type="button"
            onClick={goNext}
            className={`flex-1 rounded-full border px-4 py-3 text-sm transition ${controlClass(settings.theme)}`}
          >
            下一页
          </button>
        </div>
      </section>
    </div>
  )
}
