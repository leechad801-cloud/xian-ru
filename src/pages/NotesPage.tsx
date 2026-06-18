import { useMemo } from 'react'
import { useLocalStorage } from '../hooks/useLocalStorage'

const STORAGE_KEY = 'xian-ru-notes'

export function NotesPage() {
  const [notes, setNotes] = useLocalStorage(STORAGE_KEY, '')

  const metadata = useMemo(() => {
    const words = notes.trim() ? notes.trim().split(/\s+/).length : 0
    const characters = notes.length
    return { words, characters }
  }, [notes])

  return (
    <div className="space-y-4">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6">
        <p className="text-xs uppercase tracking-[0.4em] text-white/35">Notes</p>
        <div className="mt-3 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-3xl font-semibold tracking-tight">随手记下正在听与正在读</h2>
            <p className="mt-2 max-w-2xl text-sm leading-7 text-white/60">
              笔记自动保存在浏览器 LocalStorage 中，刷新页面、切换阅读器或继续听歌都不会丢失。
            </p>
          </div>
          <button
            type="button"
            onClick={() => setNotes('')}
            className="rounded-full border border-white/10 px-4 py-2 text-sm text-white/70 transition hover:border-white/30 hover:text-white"
          >
            清空笔记
          </button>
        </div>
      </section>

      <section className="rounded-[2rem] border border-white/10 bg-[#090909] p-4">
        <div className="mb-3 flex items-center justify-between text-xs text-white/45">
          <span>{metadata.words} 词</span>
          <span>{metadata.characters} 字符</span>
        </div>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="输入今天想记下的句子、灵感或歌曲感受……"
          className="min-h-[60vh] w-full rounded-[1.5rem] border border-white/10 bg-white/[0.03] p-5 text-base leading-8 text-white outline-none placeholder:text-white/25 focus:border-white/25"
        />
      </section>
    </div>
  )
}
