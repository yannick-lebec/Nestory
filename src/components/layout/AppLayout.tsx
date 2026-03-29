import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { Home, Clock, BookImage, CalendarDays, Search, Plus, LogOut, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useAuthStore } from '@/store/auth'

const navItems = [
  { to: '/', icon: Home, label: 'Accueil', end: true },
  { to: '/timeline', icon: Clock, label: 'Timeline' },
  { to: '/albums', icon: BookImage, label: 'Albums' },
  { to: '/recaps', icon: CalendarDays, label: 'Récaps' },
  { to: '/search', icon: Search, label: 'Recherche' },
]

export function AppLayout() {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  function handleLogout() {
    logout()
    navigate('/login')
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <aside className="hidden md:flex flex-col fixed top-0 left-0 h-screen w-64 bg-white border-r border-gray-100 px-4 py-6 gap-1">
        <div className="px-3 mb-6">
          <h1 className="text-xl font-bold text-violet-600">Nestory</h1>
          <p className="text-xs text-gray-400 mt-0.5">Journal de famille</p>
        </div>

        <nav className="flex flex-col gap-1 flex-1">
          {navItems.map(({ to, icon: Icon, label, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-violet-50 text-violet-700'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                )
              }
            >
              <Icon size={18} />
              {label}
            </NavLink>
          ))}
        </nav>

        <button
          onClick={() => navigate('/import')}
          className="flex items-center gap-2 bg-violet-600 hover:bg-violet-700 text-white px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-2"
        >
          <Upload size={16} />
          Importer des photos
        </button>
        <button
          onClick={() => navigate('/memories/add')}
          className="flex items-center gap-2 border border-gray-200 text-gray-600 hover:bg-gray-50 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors mb-3"
        >
          <Plus size={16} />
          Ajouter un souvenir
        </button>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2 border-t border-gray-100 pt-4">
          <div className="w-8 h-8 rounded-full bg-violet-100 flex items-center justify-center text-violet-700 font-semibold text-sm">
            {user?.name?.[0]?.toUpperCase()}
          </div>
          <span className="flex-1 text-sm font-medium text-gray-700 truncate">{user?.name}</span>
          <button onClick={handleLogout} className="text-gray-400 hover:text-gray-600 transition-colors">
            <LogOut size={16} />
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 md:ml-64 overflow-auto">
        <Outlet />
      </main>

      {/* Mobile bottom nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-100 flex items-center justify-around px-2 py-2 z-50">
        {navItems.filter(({ to }) => to !== '/recaps').map(({ to, icon: Icon, label, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            className={({ isActive }) =>
              cn(
                'flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-xs transition-colors',
                isActive ? 'text-violet-600' : 'text-gray-400'
              )
            }
          >
            <Icon size={20} />
            {label}
          </NavLink>
        ))}
        <button
          onClick={() => navigate('/import')}
          className="flex flex-col items-center gap-1 px-3 py-1.5 text-xs text-violet-600"
        >
          <Upload size={20} />
          Importer
        </button>
      </nav>
    </div>
  )
}
