import { useApi } from '../hooks/useApi'
import { api } from '../utils/api'
import { formatDateTime, DOC_STATUS_MAP } from '../utils/format'

const NEXT_STATUS = { recibido: 'en_revision', en_revision: 'aprobado', aprobado: 'completado' }

export default function Documents() {
  const { data, loading, reload } = useApi('/dashboard/documents')

  async function advanceStatus(doc) {
    const next = NEXT_STATUS[doc.status]
    if (!next) return
    try {
      await api.put(`/dashboard/documents/${doc.id}`, { status: next })
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  async function rejectDoc(id) {
    try {
      await api.put(`/dashboard/documents/${id}`, { status: 'rechazado', notes: 'Documento rechazado por el equipo legal' })
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  const docs = data?.documents || []

  return (
    <div>
      <h2 className="mb-md">Solicitudes de Documentos</h2>

      <div className="card">
        {loading ? <p className="text-muted">Cargando...</p> : docs.length === 0 ? <p className="empty">No hay solicitudes de documentos</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Ref.</th><th>Tipo</th><th>Descripción</th><th>Cliente</th><th>Estado</th><th>Recibido</th><th>Acciones</th></tr></thead>
              <tbody>
                {docs.map(d => (
                  <tr key={d.id}>
                    <td><strong>DOC-{d.id}</strong></td>
                    <td>{d.doc_type}</td>
                    <td className="text-sm">{d.description || '—'}</td>
                    <td>{d.client_name || `#${d.client_id}`}</td>
                    <td><span className={`badge ${DOC_STATUS_MAP[d.status]?.cls || 'badge-muted'}`}>{DOC_STATUS_MAP[d.status]?.label || d.status}</span></td>
                    <td className="text-sm text-muted">{formatDateTime(d.created_at)}</td>
                    <td>
                      <div className="flex gap-sm">
                        {NEXT_STATUS[d.status] && (
                          <button className="btn btn-sm btn-primary" onClick={() => advanceStatus(d)}>
                            → {DOC_STATUS_MAP[NEXT_STATUS[d.status]]?.label}
                          </button>
                        )}
                        {d.status !== 'rechazado' && d.status !== 'completado' && (
                          <button className="btn btn-sm btn-danger" onClick={() => rejectDoc(d.id)}>Rechazar</button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
