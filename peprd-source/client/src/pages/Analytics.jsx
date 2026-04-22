import { useApi } from '../hooks/useApi'
import { STATUS_MAP } from '../utils/format'

export default function Analytics() {
  const { data, loading } = useApi('/dashboard/analytics')

  const s = data || {}

  return (
    <div>
      <h2 className="mb-md">Analíticas y Reportes</h2>

      {loading ? <p className="text-muted">Cargando datos...</p> : (
        <>
          <div className="grid grid-3 mb-md">
            <MetricCard title="Total Mensajes" value={s.totalMessages ?? 0} sub={`Entrantes: ${s.inboundMessages ?? 0} | Salientes: ${s.outboundMessages ?? 0}`} />
            <MetricCard title="Mensajes (7 días)" value={s.messagesLast7Days ?? 0} sub={`Promedio: ${Math.round((s.messagesLast7Days || 0) / 7)}/día`} />
            <MetricCard title="Clientes Activos" value={s.activeClients ?? 0} sub="Con actividad en los últimos 30 días" />
          </div>

          <div className="grid grid-2 mb-md">
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Casos por Estado</h3>
              {(s.casesByStatus || []).length === 0 ? <p className="text-muted text-sm">Sin datos</p> : (
                <div>
                  {s.casesByStatus.map(cs => (
                    <div key={cs.status} className="flex-between" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span className={`badge ${STATUS_MAP[cs.status]?.cls || 'badge-muted'}`}>{STATUS_MAP[cs.status]?.label || cs.status}</span>
                      <div className="flex gap-md" style={{ alignItems: 'center' }}>
                        <div style={{ width: 120, height: 8, background: 'var(--bg)', borderRadius: 4, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${Math.min(100, (cs.count / Math.max(1, s.totalCases)) * 100)}%`, background: 'var(--primary)', borderRadius: 4 }} />
                        </div>
                        <strong>{cs.count}</strong>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Casos por Tipo</h3>
              {(s.casesByType || []).length === 0 ? <p className="text-muted text-sm">Sin datos</p> : (
                <div>
                  {s.casesByType.map(ct => (
                    <div key={ct.case_type} className="flex-between" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span className="text-sm">{ct.case_type || 'Sin tipo'}</span>
                      <strong>{ct.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-2">
            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Volumen de Mensajes (7 días)</h3>
              {(s.messagesByDay || []).length === 0 ? <p className="text-muted text-sm">Sin datos</p> : (
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: '.5rem', height: 150 }}>
                  {s.messagesByDay.map(d => {
                    const max = Math.max(...s.messagesByDay.map(x => x.count), 1)
                    return (
                      <div key={d.day} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ background: 'var(--primary)', borderRadius: '4px 4px 0 0', height: `${Math.max(4, (d.count / max) * 120)}px`, transition: 'height .3s' }} />
                        <div className="text-sm text-muted" style={{ fontSize: '.7rem', marginTop: '.3rem' }}>{d.day_label}</div>
                        <div style={{ fontSize: '.75rem', fontWeight: 600 }}>{d.count}</div>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>

            <div className="card">
              <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Documentos por Estado</h3>
              {(s.documentsByStatus || []).length === 0 ? <p className="text-muted text-sm">Sin solicitudes de documentos</p> : (
                <div>
                  {s.documentsByStatus.map(ds => (
                    <div key={ds.status} className="flex-between" style={{ padding: '.5rem 0', borderBottom: '1px solid var(--border)' }}>
                      <span className="text-sm">{ds.status}</span>
                      <strong>{ds.count}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function MetricCard({ title, value, sub }) {
  return (
    <div className="card">
      <div className="text-sm text-muted mb-sm">{title}</div>
      <div style={{ fontSize: '2rem', fontWeight: 700, color: 'var(--primary)' }}>{value}</div>
      <div className="text-sm text-muted mt-sm">{sub}</div>
    </div>
  )
}
