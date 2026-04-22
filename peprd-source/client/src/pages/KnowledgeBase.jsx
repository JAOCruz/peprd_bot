import { ExternalLink, Pencil } from 'lucide-react'
import { useState } from 'react'
import { useApi } from '../hooks/useApi'
import { api } from '../utils/api'

export default function KnowledgeBase() {
  const { data, loading, reload } = useApi('/dashboard/knowledge')
  const [activeTab, setActiveTab] = useState('topics')
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [saving, setSaving] = useState(false)

  const topics = data?.topics || []
  const institutions = data?.institutions || []
  const serviceCategories = data?.serviceCategories || []

  function openEditTopic(t) {
    setForm({ key: t.key, title: t.title, content: t.content, refs: (t.refs || []).join(', '), keywords: (t.keywords || []).join(', ') })
    setEditing('topic')
  }

  async function saveTopic(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.put(`/dashboard/knowledge/topics/${form.key}`, {
        title: form.title,
        content: form.content,
        refs: form.refs.split(',').map(s => s.trim()).filter(Boolean),
        keywords: form.keywords.split(',').map(s => s.trim()).filter(Boolean),
      })
      setEditing(null)
      reload()
    } catch (err) {
      alert(err.message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <h2 className="mb-md">Base de Conocimientos · Péptidos</h2>

      <div className="flex gap-sm mb-md">
        {[['topics', 'Péptidos'], ['institutions', 'Instituciones'], ['services', 'Servicios']].map(([key, label]) => (
          <button key={key} className={`btn ${activeTab === key ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveTab(key)}>
            {label}
          </button>
        ))}
      </div>

      {loading ? <p className="text-muted">Cargando...</p> : (
        <>
          {activeTab === 'topics' && (
            <div className="grid" style={{ gap: '1rem' }}>
              {topics.map(t => (
                <div key={t.key} className="card">
                  <div className="flex-between mb-sm">
                    <h3 style={{ fontSize: '1rem' }}>{t.title}</h3>
                    <button className="btn btn-secondary btn-sm" onClick={() => openEditTopic(t)}>✏️ Editar</button>
                  </div>
                  <div className="text-sm text-muted mb-sm" style={{ whiteSpace: 'pre-wrap', maxHeight: 120, overflow: 'hidden' }}>{t.content?.substring(0, 300)}...</div>
                  <div className="flex gap-sm" style={{ flexWrap: 'wrap' }}>
                    {(t.refs || []).map((r, i) => <span key={i} className="badge badge-primary">{r}</span>)}
                  </div>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'institutions' && (
            <div className="grid grid-2">
              {institutions.map(inst => (
                <div key={inst.key} className="card">
                  <strong>{inst.name}</strong>
                  <p className="text-sm text-muted mt-sm">{inst.description}</p>
                  <a href={inst.url} target="_blank" rel="noopener noreferrer" className="text-sm mt-sm" style={{ display: 'block' }}>🔗 {inst.url}</a>
                </div>
              ))}
            </div>
          )}

          {activeTab === 'services' && (
            <div className="grid grid-2">
              {serviceCategories.map(cat => (
                <div key={cat.key} className="card">
                  <h3 style={{ fontSize: '1rem', marginBottom: '.5rem' }}>{cat.emoji} {cat.name}</h3>
                  <div style={{ fontSize: '.85rem' }}>
                    {cat.items.map((item, i) => (
                      <div key={i} style={{ padding: '.3rem 0', borderBottom: '1px solid var(--border)' }}>
                        <div className="flex-between">
                          <span>{item.name}</span>
                          <span className="text-muted">{formatItemPrice(item.prices)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {editing === 'topic' && (
        <div className="modal-overlay" onClick={() => setEditing(null)}>
          <div className="modal" onClick={e => e.stopPropagation()} style={{ maxWidth: 600 }}>
            <h3>Editar Péptido</h3>
            <form onSubmit={saveTopic}>
              <div className="mb-sm"><label className="label">Título</label><input className="input" value={form.title || ''} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Contenido</label><textarea className="input" rows="8" value={form.content || ''} onChange={e => setForm({ ...form, content: e.target.value })} /></div>
              <div className="mb-sm"><label className="label">Referencias (papers, estudios) (separadas por coma)</label><input className="input" value={form.refs || ''} onChange={e => setForm({ ...form, refs: e.target.value })} /></div>
              <div className="mb-md"><label className="label">Palabras clave (separadas por coma)</label><input className="input" value={form.keywords || ''} onChange={e => setForm({ ...form, keywords: e.target.value })} /></div>
              <div className="flex gap-sm" style={{ justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => setEditing(null)}>Cancelar</button>
                <button className="btn btn-primary" disabled={saving}>{saving ? 'Guardando...' : 'Guardar'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function formatItemPrice(prices) {
  if (!prices) return '—'
  if (prices.rango) return `RD$${prices.rango}`
  if (prices.unico) return `RD$${prices.unico}`
  if (prices.unidad) return `RD$${prices.unidad}/u`
  const parts = []
  if (prices['8x11']) parts.push(`RD$${prices['8x11']}`)
  return parts.join(' | ') || '—'
}
