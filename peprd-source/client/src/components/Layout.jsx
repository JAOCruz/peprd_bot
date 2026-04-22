import { useState, useEffect } from 'react'
import { Outlet, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ShieldCheck,
  Pencil as PencilIcon,
  LayoutDashboard,
  Users,
  FolderOpen,
  MessageSquare,
  Calendar,
  FileText,
  Radio,
  BookOpen,
  MessageCircle,
  BarChart3,
  Settings,
  Menu,
  X,
  LogOut,
  Receipt,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react'

const NAV_PRIMARY = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard', end: true },
]

const NAV_WHATSAPP = [
  { to: '/whatsapp', icon: MessageCircle, label: 'WhatsApp', highlight: true },
]

const NAV_MANAGEMENT = [
  { to: '/clients',     icon: Users,         label: 'Clientes' },
  { to: '/cases',       icon: FolderOpen,    label: 'Pedidos / Casos' },
  { to: '/messages',    icon: MessageSquare, label: 'Mensajes' },
  { to: '/invoices',    icon: Receipt,       label: 'Facturas / Cotizaciones' },
  { to: '/broadcast',   icon: Radio,         label: 'Broadcast' },
  { to: '/appointments',icon: Calendar,      label: 'Citas' },
  { to: '/documents',   icon: FileText,      label: 'Documentos' },
  { to: '/knowledge',   icon: BookOpen,      label: 'Base de Péptidos' },
  { to: '/analytics',   icon: BarChart3,     label: 'Analíticas' },
  { to: '/settings',    icon: Settings,      label: 'Configuración' },
]

function NavItem({ item, onClick, collapsed }) {
  return (
    <NavLink
      to={item.to}
      end={item.end}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={({ isActive }) =>
        `group relative flex min-w-0 items-center transition-all duration-150 ${
          collapsed
            ? 'mx-auto w-11 h-11 justify-center rounded-xl'
            : 'gap-3 rounded-lg px-3 py-2.5'
        } text-[13.5px] font-semibold ${
          isActive
            ? 'bg-[#2D3FA0] text-white shadow-[0_2px_16px_rgba(59,130,246,0.4)]'
            : item.highlight
            ? 'text-indigo-300 hover:bg-[#1a2460]/60 hover:text-white'
            : 'text-slate-500 hover:bg-slate-800/60 hover:text-slate-100'
        }`
      }
    >
      {({ isActive }) => (
        <>
          <item.icon
            size={collapsed ? 22 : 17}
            className={`flex-shrink-0 transition-colors ${isActive ? 'text-white' : item.highlight ? 'text-indigo-400 group-hover:text-white' : 'text-slate-500 group-hover:text-slate-200'}`}
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {!collapsed && item.highlight && !isActive && (
            <span className="ml-auto h-1.5 w-1.5 flex-shrink-0 rounded-full bg-indigo-400 shadow-[0_0_5px_rgba(99,102,241,0.9)]" />
          )}
          {/* WhatsApp unread dot on collapsed */}
          {collapsed && item.highlight && !/* isActive placeholder */false && (
            <span className="absolute top-1.5 right-1.5 h-1.5 w-1.5 rounded-full bg-indigo-400 shadow-[0_0_4px_rgba(99,102,241,0.9)]" />
          )}
          {/* Tooltip on collapsed */}
          {collapsed && (
            <span className="pointer-events-none absolute left-full ml-3 hidden whitespace-nowrap rounded-lg bg-slate-800 px-3 py-1.5 text-xs font-semibold text-slate-200 shadow-xl ring-1 ring-white/5 group-hover:block z-50">
              {item.label}
            </span>
          )}
        </>
      )}
    </NavLink>
  )
}

// ── Online presence dot ──
function PresenceDot({ online }) {
  return (
    <span
      className={`inline-block h-1.5 w-1.5 flex-shrink-0 rounded-full ${
        online
          ? 'bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.8)]'
          : 'bg-slate-600'
      }`}
    />
  )
}

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [sidebarCollapsed, setSidebarCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem('guru_sidebar_collapsed')
      return stored === null ? true : stored === 'true'  // default: collapsed (icon-only)
    } catch { return true }
  })
  const [digitadores, setDigitadores] = useState([])

  function toggleCollapse() {
    setSidebarCollapsed(prev => {
      localStorage.setItem('guru_sidebar_collapsed', String(!prev))
      return !prev
    })
  }

  function handleLogout() {
    logout()
    navigate('/login')
  }
  const closeMenu = () => setSidebarOpen(false)

  // ── Keepalive: ping every 60s so last_seen stays fresh ──
  useEffect(() => {
    if (!user) return
    const ping = () => api.post('/auth/ping').catch(() => {})
    ping() // immediate on mount
    const id = setInterval(ping, 60_000)
    return () => clearInterval(id)
  }, [user])

  // ── Admin: poll digitador online presence every 30s ──
  useEffect(() => {
    if (user?.role !== 'admin') return

    const fetchPresence = () =>
      api.get('/admin/online-users')
        .then(d => setDigitadores(d.digitadores || []))
        .catch(() => {})

    fetchPresence()
    const id = setInterval(fetchPresence, 30_000)
    return () => clearInterval(id)
  }, [user])

  return (
    <div className="flex min-h-screen min-w-0" style={{ background: '#06060b' }}>
      {/* Mobile Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm md:hidden"
            onClick={closeMenu}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside
        className={`fixed left-0 top-0 z-50 flex h-full flex-col transition-all duration-300 md:relative md:translate-x-0 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } ${sidebarCollapsed ? 'w-[64px]' : 'w-[200px]'}`}
        style={{ background: '#06060b', borderRight: '1px solid rgba(255,255,255,0.06)' }}
      >
        {/* Brand */}
        <div className={`flex items-center py-4 ${sidebarCollapsed ? 'justify-center px-0' : 'justify-between px-4'}`}>
          {!sidebarCollapsed && (
            <div className="flex items-center gap-0 leading-none">
              <span className="text-[20px] font-serif italic font-semibold text-white tracking-tight">PepRD</span>
              <span
                className="ml-2 text-[10px] font-mono tracking-[0.15em] uppercase"
                style={{ color: '#c89b3c' }}
              >
                Research
              </span>
            </div>
          )}
          {/* Collapse toggle — desktop only */}
          <button
            onClick={toggleCollapse}
            className="hidden rounded p-1.5 text-slate-600 hover:text-slate-300 transition-colors md:flex"
            title={sidebarCollapsed ? 'Expandir sidebar' : 'Colapsar sidebar'}
          >
            {sidebarCollapsed ? <PanelLeftOpen size={16} /> : <PanelLeftClose size={16} />}
          </button>
          <button onClick={closeMenu} className="rounded p-1 text-slate-600 hover:text-white md:hidden">
            <X size={16} />
          </button>
        </div>

        {/* Nav */}
        <nav className={`flex-1 overflow-y-auto pb-4 ${sidebarCollapsed ? 'px-1.5 space-y-1' : 'px-2'}`}>
          {/* Main */}
          <div className="space-y-0.5">
            {NAV_PRIMARY.map(item => (
              <NavItem key={item.to} item={item} onClick={closeMenu} collapsed={sidebarCollapsed} />
            ))}
          </div>

          {/* WhatsApp Bot — admin only */}
          {user?.role === 'admin' && (
            <div className="mt-4">
              {!sidebarCollapsed && <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-600">WhatsApp Bot</p>}
              <div className="space-y-0.5">
                {NAV_WHATSAPP.map(item => (
                  <NavItem key={item.to} item={item} onClick={closeMenu} collapsed={sidebarCollapsed} />
                ))}
              </div>
            </div>
          )}

          {/* Gestión */}
          <div className="mt-4">
            {!sidebarCollapsed && <p className="mb-1 px-3 text-[9px] font-bold uppercase tracking-widest text-slate-600">Gestión</p>}
            <div className="space-y-0.5">
              {NAV_MANAGEMENT.map(item => (
                <NavItem key={item.to} item={item} onClick={closeMenu} collapsed={sidebarCollapsed} />
              ))}
            </div>
          </div>

          {/* Role badge — hide when collapsed */}
          {!sidebarCollapsed && (
          <div className="mt-3 mx-2">
            {user?.role === 'admin' ? (
              <div className="rounded-lg bg-indigo-900/30 px-3 py-1.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-indigo-400"><ShieldCheck size={11} className="inline mr-1" />Administrador</span>
              </div>
            ) : (
              <div className="rounded-lg bg-emerald-900/20 px-3 py-1.5 text-center">
                <span className="text-[10px] font-bold uppercase tracking-widest text-emerald-500"><PencilIcon size={11} className="inline mr-1" />Digitador</span>
              </div>
            )}
          </div>
          )}
        </nav>

        {/* ── User section + Online presence ── */}
        <div className={`border-t py-3 ${sidebarCollapsed ? 'px-1' : 'px-3'}`} style={{ borderColor: 'rgba(255,255,255,0.06)' }}>
          {/* User card */}
          <div className={`flex items-center mb-2 ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`}>
            <div
              className="relative flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
              {(user?.name || user?.email || 'A')[0].toUpperCase()}
              {/* Self online dot */}
              <span className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full border border-[#06060b] bg-emerald-400 shadow-[0_0_5px_rgba(52,211,153,0.9)]" />
            </div>
            {!sidebarCollapsed && (
              <div className="min-w-0">
                <p className="truncate text-[12px] font-semibold text-slate-200">{user?.name || 'Admin'}</p>
                <p className="truncate text-[10px] text-slate-500">{user?.email?.split('@')[0]}</p>
              </div>
            )}
          </div>

          <button
            onClick={handleLogout}
            title="Cerrar Sesión"
            className={`flex w-full items-center rounded-md py-1.5 text-[11px] font-medium text-slate-500 transition hover:bg-slate-800 hover:text-slate-200 ${sidebarCollapsed ? 'justify-center px-0' : 'gap-1.5 px-2'}`}
          >
            <LogOut size={12} />
            {!sidebarCollapsed && 'Cerrar Sesión'}
          </button>

          {/* ── DIGITADORES EN LÍNEA (admin only) ── */}
          {user?.role === 'admin' && digitadores.length > 0 && (
            <div className="mt-3 pt-3" style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}>
              {!sidebarCollapsed && (
                <p className="mb-2 px-1 text-[9px] font-bold uppercase tracking-widest text-slate-600">
                  Digitadores en línea
                </p>
              )}
              <div className="space-y-1.5">
                {digitadores.map(d => (
                  <div key={d.id} className={`flex items-center px-1 ${sidebarCollapsed ? 'justify-center' : 'gap-2'}`} title={sidebarCollapsed ? `${d.name} — ${d.online ? 'activo' : 'offline'}` : undefined}>
                    <PresenceDot online={d.online} />
                    {!sidebarCollapsed && (
                      <>
                        <span className={`truncate text-[11px] font-medium ${d.online ? 'text-slate-300' : 'text-slate-600'}`}>
                          {d.name}
                        </span>
                        {d.online && (
                          <span className="ml-auto flex-shrink-0 rounded-full bg-emerald-900/30 px-1.5 py-0.5 text-[9px] font-bold text-emerald-500">
                            activo
                          </span>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </aside>

      {/* Main */}
      <div className="flex min-w-0 flex-1 flex-col">
        {/* Topbar */}
        <header
          className="flex items-center gap-4 px-6 py-3"
          style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', background: '#06060b' }}
        >
          <button
            onClick={() => setSidebarOpen(true)}
            className="rounded p-1.5 text-slate-500 hover:text-white md:hidden"
          >
            <Menu size={18} />
          </button>
          <div className="flex-1" />
          <div className="hidden items-center gap-2 md:flex">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)]" />
            <span className="text-[12px] text-slate-500 uppercase tracking-widest">Sesión activa:</span>
            <span className="text-[12px] font-bold text-slate-200 uppercase tracking-wider">
              {user?.name || user?.email?.split('@')[0] || 'Admin'}
            </span>
          </div>
        </header>

        {/* Content */}
        <main
          className="min-w-0 flex-1 overflow-y-auto p-6 lg:p-8"
          style={{
            background: '#06060b',
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)',
            backgroundSize: '28px 28px',
            position: 'relative',
            zIndex: 1,
          }}
        >
          <div className="mx-auto max-w-7xl">
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  )
}
