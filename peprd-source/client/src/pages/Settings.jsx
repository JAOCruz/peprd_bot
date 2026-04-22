import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { api } from '../utils/api'
import { useApi } from '../hooks/useApi'
import { formatDate } from '../utils/format'

export default function Settings() {
  const { user } = useAuth()
  const { data: usersData, reload: reloadUsers } = useApi('/dashboard/users')
  const [activeTab, setActiveTab] = useState('profile')
  const [showNewUser, setShowNewUser] = useState(false)
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', role: 'lawyer' })
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')

  async function createUser(e) {
    e.preventDefault()
    setSaving(true)
    setMsg('')
    try {
      await api.post('/auth/register', newUser)
      setShowNewUser(false)
      setNewUser({ name: '', email: '', password: '', role: 'lawyer' })
      setMsg('Usuario creado exitosamente')
      reloadUsers()
    } catch (err) {
      setMsg(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="mb-md">Configuración</h2>

      <div className="flex gap-sm mb-md">
        {[['profile', 'Mi Perfil'], ['users', 'Usuarios'], ['business', 'Negocio']].map(([key, label]) => (
          <button key={key} className={`btn ${activeTab === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {msg && <div style={{ padding: '.6rem', background: 'var(--primary-light)', color: 'var(--primary)', borderRadius: 'var(--radius)', marginBottom: '1rem', fontSize: '.85rem' }}>{msg}</div>}

      {activeTab === 'profile' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Mi Perfil</h3>
          <div className="mb-sm"><label className="label">Nombre</label><div className="text-sm">{user?.name}</div></div>
          <div className="mb-sm"><label className="label">Correo electrónico</label><div className="text-sm">{user?.email}</div></div>
          <div className="mb-sm"><label className="label">Rol</label><span className="badge badge-primary">{user?.role}</span></div>
        </div>
      )}

      {activeTab === 'users' && (
        <div className="card">
          <div className="flex-between mb-md">
            <h3 style={{ fontSize: '1rem' }}>Usuarios del Sistema</h3>
            <button className="btn btn-primary" onClick={() => setShowNewUser(!showNewUser)}>+ Nuevo Usuario</button>
          </div>

          {showNewUser && (
            <form onSubmit={createUser} className="card mb-md" style={{ background: 'var(--bg)' }}>
              <div className="grid grid-2 mb-sm">
                <div><label className="label">Nombre *</label><input className="input" required value={newUser.name} onChange={e => setNewUser({ ...newUser, name: e.target.value })} /></div>
                <div><label className="label">Correo *</label><input className="input" type="email" required value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} /></div>
              </div>
              <div className="grid grid-2 mb-md">
                <div><label className="label">Contraseña *</label><input className="input" type="password" required minLength={6} value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} /></div>
                <div><label className="label">Rol</label><select className="input" value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}><option value="lawyer">Abogado</option><option value="admin">Administrador</option><option value="assistant">Asistente</option></select></div>
              </div>
              <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setShowNewUser(false)}>Cancelar</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Creando...' : 'Crear Usuario'}</button>
              </div>
            </form>
          )}

          <div className="table-wrap">
            <table>
              <thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Registrado</th></tr></thead>
              <tbody>
                {(usersData?.users || []).map(u => (
                  <tr key={u.id}>
                    <td><strong>{u.name}</strong></td>
                    <td className="text-sm">{u.email}</td>
                    <td><span className="badge badge-primary">{u.role}</span></td>
                    <td className="text-sm text-muted">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'business' && (
        <div className="card" style={{ maxWidth: 500 }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '1rem' }}>Información del Negocio</h3>
          <div className="mb-sm"><label className="label">Nombre del Negocio</label><div>PepRD</div></div>
          <div className="mb-sm"><label className="label">Horario de Atención</label><div>Lunes a Viernes, 9:00 a 18:00 hrs</div></div>
          <div className="mb-sm"><label className="label">Sesión de Bot (Timeout)</label><div>30 minutos de inactividad</div></div>
          <div className="mb-sm"><label className="label">Horarios de Citas</label><div>09:00, 10:00, 11:00, 12:00, 14:00, 15:00, 16:00, 17:00</div></div>
        </div>
      )}
    </div>
  )
}
