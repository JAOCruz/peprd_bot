import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
import ClientDetail from './pages/ClientDetail'
import Cases from './pages/Cases'
import Messages from './pages/Messages'
import Appointments from './pages/Appointments'
import Documents from './pages/Documents'
import KnowledgeBase from './pages/KnowledgeBase'
import WhatsApp from './pages/WhatsApp'
import Analytics from './pages/Analytics'
import Settings from './pages/Settings'
import Invoices from './pages/Invoices'
import Broadcast from './pages/Broadcast'

function ProtectedRoute({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="empty">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  return children
}

function AdminOnly({ children }) {
  const { user, loading } = useAuth()
  if (loading) return <div className="empty">Cargando...</div>
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'admin') return <Navigate to="/" replace />
  return children
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="clients/:id" element={<ClientDetail />} />
        <Route path="cases" element={<Cases />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:clientId" element={<Messages />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="documents" element={<Documents />} />
        <Route path="knowledge" element={<AdminOnly><KnowledgeBase /></AdminOnly>} />
        <Route path="whatsapp" element={<AdminOnly><WhatsApp /></AdminOnly>} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="broadcast" element={<AdminOnly><Broadcast /></AdminOnly>} />
        <Route path="analytics" element={<AdminOnly><Analytics /></AdminOnly>} />
        <Route path="settings" element={<AdminOnly><Settings /></AdminOnly>} />
      </Route>
    </Routes>
  )
}
