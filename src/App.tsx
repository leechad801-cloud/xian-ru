import { Link, NavLink, Route, Routes } from 'react-router-dom'
import { AudioPlayerBar } from './components/AudioPlayerBar'
import { HomePage } from './pages/HomePage'
import { NotesPage } from './pages/NotesPage'
import { ReaderPage } from './pages/ReaderPage'

const navLinkClass = ({ isActive }: { isActive: boolean }) =>
  `rounded-full border px-4 py-2 text-sm transition ${
    isActive
      ? 'border-white bg-white text-black'
      : 'border-white/15 bg-white/5 text-white/70 hover:border-white/30 hover:text-white'
  }`

function App() {
  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="mx-auto flex min-h-screen w-full max-w-6xl flex-col px-4 pb-40 pt-4 sm:px-6 lg:px-8">
        <header className="mb-6 flex flex-col gap-4 rounded-[2rem] border border-white/10 bg-white/[0.03] px-5 py-5 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="space-y-1">
            <p className="text-xs uppercase tracking-[0.4em] text-white/40">Xian-ru</p>
            <h1 className="text-2xl font-semibold tracking-tight">音乐 · 阅读 · 笔记</h1>
          </Link>

          <nav className="flex flex-wrap gap-2">
            <NavLink to="/" end className={navLinkClass}>
              书库
            </NavLink>
            <NavLink to="/notes" className={navLinkClass}>
              笔记
            </NavLink>
          </nav>
        </header>

        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/reader/:bookId" element={<ReaderPage />} />
            <Route path="/notes" element={<NotesPage />} />
          </Routes>
        </main>
      </div>

      <AudioPlayerBar />
    </div>
  )
}

export default App
