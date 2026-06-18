import { Link } from 'react-router-dom'
import { books } from '../data/library'
import { useAudioPlayer } from '../contexts/AudioPlayerContext'

const gradients = [
  'from-zinc-100/20 via-zinc-200/5 to-transparent',
  'from-emerald-200/20 via-emerald-200/5 to-transparent',
  'from-sky-200/20 via-sky-200/5 to-transparent',
  'from-fuchsia-200/20 via-fuchsia-200/5 to-transparent',
  'from-amber-200/20 via-amber-200/5 to-transparent',
  'from-violet-200/20 via-violet-200/5 to-transparent',
] as const

export function HomePage() {
  const { playTrack } = useAudioPlayer()

  return (
    <div className="space-y-5">
      <section className="rounded-[2rem] border border-white/10 bg-white/[0.03] p-6 shadow-2xl shadow-black/30">
        <p className="text-xs uppercase tracking-[0.4em] text-white/35">Mobile first</p>
        <div className="mt-3 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl space-y-3">
            <h2 className="text-4xl font-semibold leading-tight tracking-tight sm:text-5xl">
              黑色极简的个人音乐、书籍与笔记空间。
            </h2>
            <p className="max-w-xl text-sm leading-7 text-white/62 sm:text-base">
              阅读器支持 EPUB / TXT 自动识别、字体与行高调节、浅深色切换、进度保存与手机手势翻页；播放器则固定在底部，在阅读和记笔记时持续播放。
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            <button
              type="button"
              onClick={() => playTrack(Math.floor(Math.random() * 76))}
              className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 text-left transition hover:border-white/30 hover:bg-white/8"
            >
              <p className="text-xs text-white/40">即时播放</p>
              <p className="mt-1 text-lg font-medium">随机音乐</p>
            </button>
            <Link
              to="/notes"
              className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 transition hover:border-white/30 hover:bg-white/8"
            >
              <p className="text-xs text-white/40">LocalStorage</p>
              <p className="mt-1 text-lg font-medium">打开笔记</p>
            </Link>
            <div className="rounded-[1.5rem] border border-white/10 bg-white/5 px-4 py-4 sm:col-span-1 col-span-2">
              <p className="text-xs text-white/40">资源规模</p>
              <p className="mt-1 text-lg font-medium">6 本书 · 76 首歌</p>
            </div>
          </div>
        </div>
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs uppercase tracking-[0.4em] text-white/35">Library</p>
            <h3 className="mt-1 text-2xl font-semibold">Kindle 风格书架</h3>
          </div>
          <span className="rounded-full border border-white/10 px-3 py-1 text-xs text-white/50">手机全屏阅读</span>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {books.map((book, index) => (
            <Link
              key={book.id}
              to={`/reader/${book.id}`}
              className="group overflow-hidden rounded-[1.75rem] border border-white/10 bg-white/[0.03] transition hover:border-white/25 hover:bg-white/[0.05]"
            >
              <div className={`h-32 bg-gradient-to-br ${gradients[index % gradients.length]} p-5`}>
                <p className="text-xs uppercase tracking-[0.4em] text-white/45">Book {String(index + 1).padStart(2, '0')}</p>
                <h4 className="mt-3 text-2xl font-medium">{book.title}</h4>
              </div>
              <div className="space-y-3 p-5">
                <p className="text-sm leading-7 text-white/58">{book.summary}</p>
                <div className="flex items-center justify-between text-sm text-white/70">
                  <span>开始阅读</span>
                  <span className="transition group-hover:translate-x-1">→</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  )
}
