import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { api } from '../utils/api'
import { formatDate, formatTime } from '../utils/format'

const APPT_STATUSES = { pendiente: 'badge-warning', confirmada: 'badge-success', cancelada: 'badge-danger', completada: 'badge-muted' }

export default function Appointments() {
  const { data, loading, reload } = useApi('/dashboard/appointments')
  const [dateFilter, setDateFilter] = useState('')

  const appointments = (data?.appointments || []).filter(a =>
    !dateFilter || a.date === dateFilter
  )

  async function updateStatus(id, status) {
    try {
      await api.put(`/dashboard/appointments/${id}`, { status })
      reload()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div>
      <h2 className="mb-md">Citas y Agenda</h2>

      <div className="card">
        <div className="flex gap-md mb-md" style={{ flexWrap: 'wrap' }}>
          <input className="input" type="date" style={{ maxWidth: 200 }} value={dateFilter} onChange={e => setDateFilter(e.target.value)} />
          <button className="btn btn-secondary" onClick={() => setDateFilter('')}>Mostrar todas</button>
        </div>

        {loading ? <p className="text-muted">Cargando...</p> : appointments.length === 0 ? <p className="empty">No hay citas programadas</p> : (
          <div className="table-wrap">
            <table>
              <thead><tr><th>Fecha</th><th>Hora</th><th>Tipo</th><th>Cliente</th><th>Estado</th><th>Acciones</th></tr></thead>
              <tbody>
                {appointments.map(a => (
                  <tr key={a.id}>
                    <td>{formatDate(a.date)}</td>
                    <td>{formatTime(a.time)}</td>
                    <td>{a.type}</td>
                    <td>{a.client_name || `Cliente #${a.client_id}`}</td>
                    <td><span className={`badge ${APPT_STATUSES[a.status] || 'badge-muted'}`}>{a.status}</span></td>
                    <td>
                      <div className="flex gap-sm">
                        {a.status === 'pendiente' && (
                          <>
                            <button className="btn btn-sm btn-primary" onClick={() => updateStatus(a.id, 'confirmada')}>Confirmar</button>
                            <button className="btn btn-sm btn-danger" onClick={() => updateStatus(a.id, 'cancelada')}>Cancelar</button>
                          </>
                        )}
                        {a.status === 'confirmada' && (
                          <button className="btn btn-sm btn-secondary" onClick={() => updateStatus(a.id, 'completada')}>Completada</button>
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
