export function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleDateString('es-DO', { day: '2-digit', month: 'short', year: 'numeric' })
}

export function formatDateTime(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('es-DO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })
}

export function formatTime(t) {
  if (!t) return '—'
  return t.substring(0, 5)
}

export function timeAgo(d) {
  const s = Math.floor((Date.now() - new Date(d)) / 1000)
  if (s < 60) return 'hace un momento'
  if (s < 3600) return `hace ${Math.floor(s / 60)}m`
  if (s < 86400) return `hace ${Math.floor(s / 3600)}h`
  return `hace ${Math.floor(s / 86400)}d`
}

export const STATUS_MAP = {
  open: { label: 'Abierto', cls: 'badge-primary' },
  in_progress: { label: 'En trámite', cls: 'badge-warning' },
  pending_docs: { label: 'Pend. docs', cls: 'badge-warning' },
  hearing_scheduled: { label: 'Audiencia', cls: 'badge-primary' },
  resolved: { label: 'Resuelto', cls: 'badge-success' },
  closed: { label: 'Cerrado', cls: 'badge-muted' },
  archived: { label: 'Archivado', cls: 'badge-muted' },
}

export const DOC_STATUS_MAP = {
  recibido: { label: 'Recibido', cls: 'badge-primary' },
  en_revision: { label: 'En revisión', cls: 'badge-warning' },
  aprobado: { label: 'Aprobado', cls: 'badge-success' },
  rechazado: { label: 'Rechazado', cls: 'badge-danger' },
  completado: { label: 'Completado', cls: 'badge-success' },
}
