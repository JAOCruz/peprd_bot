import { useApi } from '../hooks/useApi'
import { Link } from 'react-router-dom'
import { formatDateTime, timeAgo, STATUS_MAP } from '../utils/format'
import { motion } from 'framer-motion'
import { Users, FolderOpen, MessageSquare, Calendar, ArrowRight, TrendingUp } from 'lucide-react'

export default function Dashboard() {
  const { data: stats } = useApi('/dashboard/stats')
  const { data: recent } = useApi('/dashboard/recent')

  const s = stats || {}

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="mb-8">
        <h2 className="mb-2 font-display text-2xl font-bold text-white md:text-3xl">
          Panel de Control
        </h2>
        <p className="text-sm text-slate-400">
          Vista general de tu sistema legal
        </p>
      </div>

      {/* Stats Grid - Mobile First with min-w-0 */}
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard
          icon={Users}
          label="Clientes"
          value={s.clientCount ?? '0'}
          color="text-emerald-400"
          delay={0}
          to="/clients"
        />
        <StatCard
          icon={FolderOpen}
          label="Casos Activos"
          value={s.activeCases ?? '0'}
          color="text-yellow-400"
          delay={0.1}
          to="/cases"
        />
        <StatCard
          icon={MessageSquare}
          label="Mensajes Hoy"
          value={s.messagesToday ?? '0'}
          color="text-blue-400"
          delay={0.2}
          to="/messages"
        />
        <StatCard
          icon={Calendar}
          label="Citas Pendientes"
          value={s.pendingAppointments ?? '0'}
          color="text-purple-400"
          delay={0.3}
          to="/appointments"
        />
      </div>

      {/* Recent Activity Grid - Stacks on mobile */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Messages Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
          className="min-w-0 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-lg sm:p-6"
        >
          <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-white sm:text-lg">
              Actividad Reciente
            </h3>
            <Link
              to="/messages"
              className="flex flex-shrink-0 items-center gap-1 text-xs text-purple-400 transition-colors hover:text-purple-300 sm:text-sm"
            >
              <span>Ver todo</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recent?.recentMessages?.length > 0 ? (
            <div className="space-y-3">
              {recent.recentMessages.map((m, index) => (
                <motion.div
                  key={m.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.5 + index * 0.05 }}
                  className="flex min-w-0 items-start justify-between gap-2 border-b border-slate-700 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <span
                      className={`mb-1 inline-block rounded-full px-2 py-0.5 text-xs font-semibold ${
                        m.direction === 'inbound'
                          ? 'bg-blue-900/30 text-blue-400'
                          : 'bg-slate-700 text-slate-400'
                      }`}
                    >
                      {m.direction === 'inbound' ? '← Entrante' : '→ Saliente'}
                    </span>
                    <p className="break-words text-xs text-slate-300 sm:text-sm">
                      {m.content?.substring(0, 100)}
                      {m.content?.length > 100 && '...'}
                    </p>
                  </div>
                  <span className="flex-shrink-0 text-xs text-slate-500">
                    {timeAgo(m.created_at)}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No hay actividad reciente
            </p>
          )}
        </motion.div>

        {/* Recent Cases Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.5 }}
          className="min-w-0 rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-4 shadow-lg sm:p-6"
        >
          <div className="mb-4 flex min-w-0 items-center justify-between gap-2">
            <h3 className="truncate text-base font-semibold text-white sm:text-lg">
              Casos Recientes
            </h3>
            <Link
              to="/cases"
              className="flex flex-shrink-0 items-center gap-1 text-xs text-purple-400 transition-colors hover:text-purple-300 sm:text-sm"
            >
              <span>Ver todo</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          {recent?.recentCases?.length > 0 ? (
            <div className="space-y-3">
              {recent.recentCases.map((c, index) => (
                <motion.div
                  key={c.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2, delay: 0.6 + index * 0.05 }}
                  className="flex min-w-0 items-start justify-between gap-2 border-b border-slate-700 pb-3 last:border-0 last:pb-0"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">
                      {c.case_number}
                    </p>
                    <p className="break-words text-xs text-slate-400">
                      {c.title}
                    </p>
                  </div>
                  <span
                    className={`flex-shrink-0 rounded-full px-2 py-0.5 text-xs font-semibold ${
                      STATUS_MAP[c.status]?.cls || 'badge-muted'
                    }`}
                  >
                    {STATUS_MAP[c.status]?.label || c.status}
                  </span>
                </motion.div>
              ))}
            </div>
          ) : (
            <p className="py-8 text-center text-sm text-slate-500">
              No hay casos registrados
            </p>
          )}
        </motion.div>
      </div>
    </div>
  )
}

function StatCard({ icon: Icon, label, value, color, delay, to }) {
  return (
    <Link to={to}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3, delay }}
        className="group relative min-w-0 cursor-pointer overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-3 shadow-lg transition-all hover:border-slate-600 hover:shadow-xl sm:p-4"
      >
        {/* Glow effect on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-purple-600/0 to-blue-600/0 opacity-0 transition-opacity duration-300 group-hover:opacity-10" />

        <div className="relative z-10 flex min-w-0 items-center gap-2 sm:gap-3">
          {/* Icon */}
          <div className={`flex-shrink-0 ${color}`}>
            <Icon size={20} className="sm:h-6 sm:w-6" />
          </div>

          {/* Content */}
          <div className="min-w-0 flex-1">
            <p
              className={`font-display truncate text-lg font-bold drop-shadow-[0_0_10px_currentColor] sm:text-2xl ${color}`}
            >
              {value}
            </p>
            <p className="truncate text-xs font-medium uppercase tracking-wider text-slate-400 sm:text-sm">
              {label}
            </p>
          </div>
        </div>
      </motion.div>
    </Link>
  )
}
