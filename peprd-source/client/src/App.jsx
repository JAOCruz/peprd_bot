import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './contexts/AuthContext'
import Layout from './components/Layout'
import Login from './pages/Login'
import Dashboard from './pages/Dashboard'
import Clients from './pages/Clients'
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

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/" element={<ProtectedRoute><Layout /></ProtectedRoute>}>
        <Route index element={<Dashboard />} />
        <Route path="clients" element={<Clients />} />
        <Route path="cases" element={<Cases />} />
        <Route path="messages" element={<Messages />} />
        <Route path="messages/:clientId" element={<Messages />} />
        <Route path="appointments" element={<Appointments />} />
        <Route path="documents" element={<Documents />} />
        <Route path="knowledge" element={<KnowledgeBase />} />
        <Route path="whatsapp" element={<WhatsApp />} />
        <Route path="invoices" element={<Invoices />} />
        <Route path="broadcast" element={<Broadcast />} />
        <Route path="analytics" element={<Analytics />} />
        <Route path="settings" element={<Settings />} />
      </Route>
    </Routes>
  )
}
