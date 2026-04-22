import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Search, User, Phone, ArrowLeft, Bot, UserCheck, UserPlus, X, Send, Power, Mail, MapPin, FolderOpen, Calendar, ChevronRight, Users } from 'lucide-react'
import { api } from '../utils/api'
import { formatDate, formatDateTime, formatTime, timeAgo, STATUS_MAP } from '../utils/format'
import { useAuth } from '../contexts/AuthContext'

const TABS = [
  { key: 'all', label: 'Todos' },
  { key: 'clients', label: 'Clientes' },
  { key: 'non_clients', label: 'Sin registrar' },
]

// Unread tracking via localStorage
const LAST_SEEN_KEY = 'guru_msg_last_seen'
function getLastSeen() {
  try { return JSON.parse(localStorage.getItem(LAST_SEEN_KEY) || '{}') } catch { return {} }
}
function setLastSeenForPhone(phone) {
  const data = getLastSeen()
  data[phone] = new Date().toISOString()
  localStorage.setItem(LAST_SEEN_KEY, JSON.stringify(data))
}

// Contact avatar with profile pic / initials / icon fallback
function ContactAvatar({ phone, name, clientId, profilePicUrl, size = 40 }) {
  const [imgError, setImgError] = useState(false)
  const initials = name ? name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase() : null

  if (profilePicUrl && !imgError) {
    return (
      <img
        src={profilePicUrl}
        alt={name || phone}
        className="flex-shrink-0 rounded-full object-cover"
        style={{ width: size, height: size }}
        onError={() => setImgError(true)}
      />
    )
  }

  return (
    <div
      className={`flex flex-shrink-0 items-center justify-center rounded-full ${
        clientId ? 'bg-emerald-900/30 text-emerald-400' : 'bg-slate-700 text-slate-400'
      }`}
      style={{ width: size, height: size }}
    >
      {initials ? (
        <span className="font-bold" style={{ fontSize: size * 0.35 }}>{initials}</span>
      ) : clientId ? (
        <User size={size * 0.45} />
      ) : (
        <Phone size={size * 0.45} />
      )}
    </div>
  )
}

export default function Messages() {
  const { clientId } = useParams()
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  // Assignment state
  const [showAssignPopover, setShowAssignPopover] = useState(false)
  const [digitadores, setDigitadores]             = useState([])
  const [assignedTo, setAssignedTo]               = useState(null)   // { id, name } or null
  const [assigning, setAssigning]                 = useState(false)

  const [tab, setTab] = useState('all')
  const [conversations, setConversations] = useState([])
  const [loadingConvs, setLoadingConvs] = useState(true)
  const [selectedPhone, setSelectedPhone] = useState(null)
  const [messages, setMessages] = useState([])
  const [loadingMsgs, setLoadingMsgs] = useState(false)
  const [search, setSearch] = useState('')
  // Per-chat status
  const [chatEnabled, setChatEnabled] = useState(true)
  const [manualMode, setManualMode] = useState(false)
  const [togglingChat, setTogglingChat] = useState(false)
  const [togglingManual, setTogglingManual] = useState(false)
  // Global lists for sidebar badges
  const [enabledPhones, setEnabledPhones] = useState(new Set())
  const [manualPhones, setManualPhones] = useState(new Set())
  const [botMode, setBotMode] = useState('all')
  // Registration
  const [showRegister, setShowRegister] = useState(false)
  const [registerForm, setRegisterForm] = useState({ name: '', email: '', address: '', notes: '' })
  const [registering, setRegistering] = useState(false)
  const [registerError, setRegisterError] = useState('')
  // Compose
  const [compose, setCompose] = useState('')
  const [sending, setSending] = useState(false)
  // Refs
  const endRef = useRef(null)
  const composeRef = useRef(null)
  const scrollContainerRef = useRef(null)
  const isNearBottomRef = useRef(true)
  const prevMessageCountRef = useRef(0)
  // Profile pictures
  const [profilePics, setProfilePics] = useState({})
  // Client info panel
  const [showClientInfo, setShowClientInfo] = useState(false)
  const [clientInfo, setClientInfo] = useState(null)
  const [loadingClientInfo, setLoadingClientInfo] = useState(false)
  // Unread tracking
  const [lastSeen, setLastSeen] = useState(getLastSeen)
  // In-chat search
  const [chatSearch, setChatSearch] = useState('')
  const [showChatSearch, setShowChatSearch] = useState(false)

  // Fetch profile picture (cached in state)
  const fetchProfilePic = useCallback((phone) => {
    if (!phone || !/^\d+$/.test(phone)) return // skip non-numeric (status@broadcast, etc.)
    setProfilePics(prev => {
      if (prev[phone] !== undefined) return prev
      api.get(`/whatsapp/profile-pic/${phone}`)
        .then(d => setProfilePics(p => ({ ...p, [phone]: d.url })))
        .catch(() => setProfilePics(p => ({ ...p, [phone]: null })))
      return { ...prev, [phone]: '' } // mark as loading
    })
  }, [])

  // Scroll tracking
  function handleScroll() {
    const el = scrollContainerRef.current
    if (!el) return
    isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 100
  }

  // If navigating from Clients page with clientId, resolve to phone
  useEffect(() => {
    if (!clientId) return
    api.get(`/clients/${clientId}`)
      .then(d => { if (d.client?.phone) setSelectedPhone(d.client.phone) })
      .catch(() => {})
  }, [clientId])

  // Load conversations list
  useEffect(() => {
    setLoadingConvs(true)
    api.get(`/messages/conversations?filter=${tab}`)
      .then(d => setConversations(d.conversations || []))
      .catch(() => setConversations([]))
      .finally(() => setLoadingConvs(false))
  }, [tab])

  // Refresh conversations every 15s
  useEffect(() => {
    const interval = setInterval(() => {
      api.get(`/messages/conversations?filter=${tab}`)
        .then(d => setConversations(d.conversations || []))
        .catch(() => {})
    }, 15000)
    return () => clearInterval(interval)
  }, [tab])

  // Prefetch profile pics for visible conversations
  useEffect(() => {
    conversations.slice(0, 20).forEach(c => fetchProfilePic(c.phone))
  }, [conversations, fetchProfilePic])

  // Load global state on mount
  useEffect(() => {
    api.get('/messages/enabled-phones').then(d => setEnabledPhones(new Set(d.phones || []))).catch(() => {})
    api.get('/messages/manual-phones').then(d => setManualPhones(new Set(d.phones || []))).catch(() => {})
    api.get('/whatsapp/status').then(d => setBotMode(d.botMode || 'all')).catch(() => {})
  }, [])

  // Load messages + status for selected phone
  useEffect(() => {
    if (!selectedPhone) return
    prevMessageCountRef.current = 0
    isNearBottomRef.current = true
    setShowClientInfo(false)
    setClientInfo(null)
    setChatSearch('')
    setShowChatSearch(false)
    setLoadingMsgs(true)
    fetchProfilePic(selectedPhone)
    setLastSeenForPhone(selectedPhone)
    setLastSeen(getLastSeen())

    Promise.all([
      api.get(`/messages/phone/${selectedPhone}?limit=200`),
      api.get(`/messages/phone-status/${selectedPhone}`),
    ])
      .then(([msgData, statusData]) => {
        setMessages((msgData.messages || []).reverse())
        setChatEnabled(statusData.chatEnabled !== undefined ? statusData.chatEnabled : true)
        setManualMode(statusData.manualMode || false)
      })
      .catch(() => {
        setMessages([])
        setChatEnabled(true)
        setManualMode(false)
      })
      .finally(() => setLoadingMsgs(false))
  }, [selectedPhone, fetchProfilePic])

  // Auto-refresh messages every 8s
  useEffect(() => {
    if (!selectedPhone) return
    const interval = setInterval(() => {
      api.get(`/messages/phone/${selectedPhone}?limit=200`)
        .then(d => setMessages((d.messages || []).reverse()))
        .catch(() => {})
    }, 8000)
    return () => clearInterval(interval)
  }, [selectedPhone])

  // Smart scroll: only auto-scroll if near bottom OR new messages arrived
  useEffect(() => {
    const newCount = messages.length
    const hadNew = newCount > prevMessageCountRef.current
    prevMessageCountRef.current = newCount
    if (isNearBottomRef.current || hadNew) {
      endRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages])

  // Toggle chat enabled
  async function handleChatToggle() {
    if (!selectedPhone) return
    setTogglingChat(true)
    try {
      const data = await api.post(`/messages/chat-toggle/${selectedPhone}`)
      setChatEnabled(data.chatEnabled)
      setEnabledPhones(prev => {
        const next = new Set(prev)
        if (data.chatEnabled) next.add(selectedPhone); else next.delete(selectedPhone)
        return next
      })
    } catch (err) { console.error('Toggle chat error:', err) }
    finally { setTogglingChat(false) }
  }

  // Toggle manual mode
  async function handleManualToggle() {
    if (!selectedPhone) return
    setTogglingManual(true)
    try {
      const data = await api.post(`/messages/manual-toggle/${selectedPhone}`)
      setManualMode(data.manualMode)
      setManualPhones(prev => {
        const next = new Set(prev)
        if (data.manualMode) next.add(selectedPhone); else next.delete(selectedPhone)
        return next
      })
    } catch (err) { console.error('Toggle manual error:', err) }
    finally { setTogglingManual(false) }
  }

  // Register phone as client
  async function handleRegister(e) {
    e.preventDefault()
    if (!registerForm.name.trim()) return
    setRegistering(true)
    setRegisterError('')
    try {
      await api.post('/messages/register-client', {
        phone: selectedPhone,
        name: registerForm.name.trim(),
        email: registerForm.email.trim() || undefined,
        address: registerForm.address.trim() || undefined,
        notes: registerForm.notes.trim() || undefined,
      })
      const convData = await api.get(`/messages/conversations?filter=${tab}`)
      setConversations(convData.conversations || [])
      setShowRegister(false)
      setRegisterForm({ name: '', email: '', address: '', notes: '' })
    } catch (err) {
      setRegisterError(err.error || 'Error al registrar cliente')
    } finally { setRegistering(false) }
  }

  // Send message as agent
  async function handleSend(e) {
    e.preventDefault()
    const text = compose.trim()
    if (!text || !selectedPhone) return
    setSending(true)
    try {
      const data = await api.post('/messages/send-direct', { phone: selectedPhone, content: text })
      if (data.message) {
        setMessages(prev => [...prev, data.message])
        setCompose('')
        setTimeout(() => endRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
      }
    } catch (err) { console.error('Send message error:', err) }
    finally {
      setSending(false)
      composeRef.current?.focus()
    }
  }

  // Open client info panel
  async function handleOpenClientInfo() {
    if (!selectedConv?.client_id) return
    setShowClientInfo(true)
    setLoadingClientInfo(true)
    try {
      const data = await api.get(`/clients/${selectedConv.client_id}/summary`)
      setClientInfo(data)
    } catch (err) {
      console.error('Load client info error:', err)
      setClientInfo(null)
    } finally { setLoadingClientInfo(false) }
  }

  // Filter conversations by search
  const filtered = conversations.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (c.client_name && c.client_name.toLowerCase().includes(q)) || c.phone.includes(q)
  })

  const selectedConv = conversations.find(c => c.phone === selectedPhone)

  // Load assignment info + digitadores list when chat changes
  useEffect(() => {
    if (!selectedConv?.client_id || !isAdmin) return
    setAssignedTo(null)
    setShowAssignPopover(false)
    // Fetch client to get assigned_to
    api.get(`/clients/${selectedConv.client_id}`).then(d => {
      if (d.client?.assigned_to) {
        setAssignedTo({ id: d.client.assigned_to, name: d.client.assigned_name || 'Asignado' })
      }
    }).catch(() => {})
    // Fetch digitadores for dropdown
    if (digitadores.length === 0) {
      api.get('/admin/users').then(d => {
        setDigitadores((d.users || []).filter(u => u.role === 'digitador'))
      }).catch(() => {})
    }
  }, [selectedConv?.client_id, isAdmin])

  async function handleAssign(userId) {
    if (!selectedConv?.client_id) return
    setAssigning(true)
    try {
      await api.post('/admin/assign-client', { clientId: selectedConv.client_id, userId })
      const dig = userId ? digitadores.find(d => d.id === userId) : null
      setAssignedTo(dig ? { id: dig.id, name: dig.name } : null)
      setShowAssignPopover(false)
    } catch (e) { console.error(e) }
    finally { setAssigning(false) }
  }

  const isChatActive = botMode === 'all' ? true : chatEnabled
  const isBotResponding = isChatActive && !manualMode

  // Filter messages for in-chat search
  const displayMessages = chatSearch
    ? messages.filter(m => m.content.toLowerCase().includes(chatSearch.toLowerCase()))
    : messages

  return (
    <div className="-m-6 flex min-w-0 flex-col lg:-m-8" style={{ height: 'calc(100vh - 49px)' }}>
      {/* Header */}
      <div className="flex-shrink-0 px-6 pb-4 pt-6 lg:px-8 lg:pt-8">
        <h2 className="mb-1 font-display text-2xl font-bold text-white md:text-3xl">
          Mensajes WhatsApp
        </h2>
        <p className="text-sm text-slate-400">
          {conversations.length} conversacion{conversations.length !== 1 ? 'es' : ''} activa{conversations.length !== 1 ? 's' : ''}
          {botMode === 'selected' && (
            <span className="ml-2 rounded-full bg-blue-900/30 px-2 py-0.5 text-[10px] font-bold text-blue-400">
              Modo seleccionado
            </span>
          )}
        </p>
      </div>

      <div className="relative flex min-h-0 flex-1 gap-4 px-6 pb-6 lg:px-8 lg:pb-8">
        {/* Sidebar */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
          className={`flex w-full flex-shrink-0 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg md:w-80 ${selectedPhone ? 'hidden md:flex' : 'flex'}`}
        >
          {/* Tabs */}
          <div className="flex border-b border-slate-700">
            {TABS.map(t => (
              <button
                key={t.key}
                onClick={() => { setTab(t.key); setSelectedPhone(null) }}
                className={`flex-1 px-2 py-3 text-xs font-semibold uppercase tracking-wider transition-all ${
                  tab === t.key
                    ? 'border-b-2 border-purple-500 text-purple-400'
                    : 'text-slate-500 hover:text-slate-300'
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>

          {/* Search */}
          <div className="p-3">
            <div className="flex items-center gap-2 rounded-xl border border-slate-600 bg-slate-800/50 px-3 py-2 transition-all focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20">
              <Search size={14} className="flex-shrink-0 text-slate-500" />
              <input
                type="text"
                placeholder="Buscar por nombre o numero..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="min-w-0 flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
              />
            </div>
          </div>

          {/* Conversation list */}
          <div className="flex-1 overflow-y-auto">
            {loadingConvs ? (
              <div className="space-y-3 p-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="animate-pulse">
                    <div className="mb-2 h-4 w-3/4 rounded bg-slate-700" />
                    <div className="h-3 w-1/2 rounded bg-slate-700/50" />
                  </div>
                ))}
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <MessageSquare size={32} className="mb-3 text-slate-600" />
                <p className="text-sm text-slate-500">No hay conversaciones</p>
              </div>
            ) : (
              <AnimatePresence>
                {filtered.map((c, i) => {
                  const ls = lastSeen[c.phone]
                  const isUnread = c.last_direction === 'inbound' && (!ls || new Date(c.last_message_at) > new Date(ls))
                  return (
                    <motion.div
                      key={c.phone}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.2, delay: i * 0.03 }}
                      onClick={() => setSelectedPhone(c.phone)}
                      className={`cursor-pointer border-b border-slate-700/50 px-3 py-3 transition-all ${
                        c.phone === selectedPhone
                          ? 'bg-purple-600/10 border-l-2 border-l-purple-500'
                          : 'hover:bg-slate-800/50'
                      }`}
                    >
                      <div className="flex min-w-0 items-start gap-2.5">
                        <ContactAvatar
                          phone={c.phone}
                          name={c.client_name}
                          clientId={c.client_id}
                          profilePicUrl={profilePics[c.phone]}
                          size={36}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0 flex-1">
                              <div className="flex flex-wrap items-center gap-1.5">
                                <span className="truncate text-sm font-semibold text-white">
                                  {c.client_name || formatPhoneDisplay(c.phone)}
                                </span>
                                {isUnread && (
                                  <span className="h-2 w-2 flex-shrink-0 rounded-full bg-purple-500 shadow-[0_0_6px_rgba(147,51,234,0.5)]" />
                                )}
                                {c.client_id ? (
                                  <span className="flex-shrink-0 rounded-full bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                    Cliente
                                  </span>
                                ) : (
                                  <span className="flex-shrink-0 rounded-full bg-slate-700/50 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                                    Nuevo
                                  </span>
                                )}
                                {manualPhones.has(c.phone) && (
                                  <span className="flex-shrink-0 rounded-full bg-yellow-900/30 px-1.5 py-0.5 text-[10px] font-bold text-yellow-400">
                                    Manual
                                  </span>
                                )}
                                {botMode === 'selected' && enabledPhones.has(c.phone) && (
                                  <span className="flex-shrink-0 rounded-full bg-emerald-900/30 px-1.5 py-0.5 text-[10px] font-bold text-emerald-400">
                                    Bot ON
                                  </span>
                                )}
                              </div>
                              {c.client_name && (
                                <p className="mt-0.5 font-mono text-[11px] text-slate-500">
                                  {formatPhoneDisplay(c.phone)}
                                </p>
                              )}
                            </div>
                            <span className="flex-shrink-0 text-[11px] text-slate-500">
                              {timeAgo(c.last_message_at)}
                            </span>
                          </div>
                          <p className="mt-1 truncate text-xs text-slate-400">
                            {c.last_direction === 'outbound' && (
                              <span className="text-purple-400">Tu: </span>
                            )}
                            {c.last_message}
                          </p>
                          <p className="mt-1 font-mono text-[10px] text-slate-600">
                            {c.message_count} mensaje{c.message_count !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                    </motion.div>
                  )
                })}
              </AnimatePresence>
            )}
          </div>
        </motion.div>

        {/* Chat area */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className={`flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 shadow-lg ${selectedPhone ? 'flex' : 'hidden md:flex'}`}
        >
          {!selectedPhone ? (
            <div className="flex flex-1 flex-col items-center justify-center gap-4">
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-slate-800 shadow-[0_0_30px_rgba(147,51,234,0.1)]">
                <MessageSquare size={36} className="text-purple-500/50" />
              </div>
              <div className="text-center">
                <p className="text-base font-medium text-slate-400">
                  Seleccione una conversacion
                </p>
                <p className="mt-1 text-xs text-slate-600">
                  Elija un chat del panel izquierdo para ver los mensajes
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* Chat header */}
              <div className="flex items-center gap-3 border-b border-slate-700 px-4 py-3">
                <button
                  onClick={() => setSelectedPhone(null)}
                  className="flex-shrink-0 rounded-lg p-1.5 text-slate-400 transition-all hover:bg-slate-800 hover:text-white md:hidden"
                >
                  <ArrowLeft size={18} />
                </button>

                <ContactAvatar
                  phone={selectedPhone}
                  name={selectedConv?.client_name}
                  clientId={selectedConv?.client_id}
                  profilePicUrl={profilePics[selectedPhone]}
                  size={40}
                />

                <div className="min-w-0 flex-1">
                  <div
                    className={`flex items-center gap-2 ${selectedConv?.client_id ? 'cursor-pointer group' : ''}`}
                    onClick={() => selectedConv?.client_id && handleOpenClientInfo()}
                  >
                    <span className="truncate font-display text-sm font-bold text-white transition-colors group-hover:text-purple-300">
                      {selectedConv?.client_name || formatPhoneDisplay(selectedPhone)}
                    </span>
                    {selectedConv?.client_id ? (
                      <>
                        <span className="flex-shrink-0 rounded-full bg-emerald-900/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          Cliente
                        </span>
                        <ChevronRight size={14} className="flex-shrink-0 text-slate-500 opacity-0 transition-opacity group-hover:opacity-100" />
                      </>
                    ) : (
                      <button
                        onClick={() => { setShowRegister(true); setRegisterError('') }}
                        className="flex flex-shrink-0 items-center gap-1 rounded-full bg-purple-900/30 px-2 py-0.5 text-[10px] font-bold text-purple-400 transition-all hover:bg-purple-900/50"
                      >
                        <UserPlus size={10} />
                        Registrar
                      </button>
                    )}
                  </div>
                  <p
                    className={`font-mono text-xs text-slate-500 ${selectedConv?.client_id ? 'cursor-pointer hover:text-slate-400' : ''}`}
                    onClick={() => selectedConv?.client_id && handleOpenClientInfo()}
                  >
                    +{selectedPhone}
                  </p>
                </div>

                {/* Buttons row */}
                <div className="flex flex-shrink-0 items-center gap-2">
                  {/* In-chat search toggle */}
                  <button
                    onClick={() => setShowChatSearch(prev => !prev)}
                    className={`rounded-lg p-1.5 transition-all hover:bg-slate-800 ${showChatSearch ? 'text-purple-400' : 'text-slate-400 hover:text-white'}`}
                    title="Buscar en esta conversacion"
                  >
                    <Search size={16} />
                  </button>

                  {/* Activar Bot button — only in selected mode */}
                  {botMode === 'selected' && (
                    <button
                      onClick={handleChatToggle}
                      disabled={togglingChat}
                      title={chatEnabled ? 'Desactivar bot en este chat' : 'Activar bot en este chat'}
                      className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                        chatEnabled
                          ? 'border-emerald-600 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                          : 'border-blue-500 bg-blue-600/20 text-blue-300 hover:bg-blue-600/30'
                      }`}
                    >
                      <Power size={14} />
                      <span>{chatEnabled ? 'Activo' : 'Activar'}</span>
                    </button>
                  )}

                  {/* Manual mode toggle — always available */}
                  <button
                    onClick={handleManualToggle}
                    disabled={togglingManual}
                    title={manualMode ? 'Devolver control al bot' : 'Tomar control manual (agente)'}
                    className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all disabled:opacity-50 ${
                      manualMode
                        ? 'border-yellow-600 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                        : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-purple-500 hover:text-purple-400'
                    }`}
                  >
                    {manualMode ? (
                      <>
                        <UserCheck size={14} />
                        <span className="hidden sm:inline">Manual</span>
                      </>
                    ) : (
                      <>
                        <Bot size={14} />
                        <span className="hidden sm:inline">Bot</span>
                      </>
                    )}
                  </button>

                  {/* Assign button — admin only, only when a registered client is selected */}
                  {isAdmin && selectedConv?.client_id && (
                    <div className="relative">
                      <button
                        onClick={() => setShowAssignPopover(p => !p)}
                        title={assignedTo ? `Asignado a: ${assignedTo.name}` : 'Sin asignar — click para asignar'}
                        className={`flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-medium transition-all ${
                          assignedTo
                            ? 'border-indigo-600 bg-indigo-600/20 text-indigo-300 hover:bg-indigo-600/30'
                            : 'border-slate-600 bg-slate-800 text-slate-400 hover:border-indigo-500 hover:text-indigo-400'
                        }`}
                      >
                        <Users size={14} />
                        <span className="hidden sm:inline">
                          {assignedTo ? assignedTo.name : 'Asignar'}
                        </span>
                      </button>

                      {/* Assign dropdown popover */}
                      <AnimatePresence>
                        {showAssignPopover && (
                          <motion.div
                            initial={{ opacity: 0, y: -6, scale: 0.96 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            exit={{ opacity: 0, y: -6, scale: 0.96 }}
                            transition={{ duration: 0.15 }}
                            className="absolute right-0 top-full z-50 mt-2 w-52 rounded-xl border border-slate-700 bg-slate-900 p-2 shadow-2xl"
                          >
                            <p className="mb-2 px-2 text-[10px] font-semibold uppercase tracking-wider text-slate-500">
                              Asignar digitador
                            </p>
                            {digitadores.length === 0 ? (
                              <p className="px-2 py-1 text-xs text-slate-500">No hay digitadores</p>
                            ) : (
                              digitadores.map(d => (
                                <button
                                  key={d.id}
                                  disabled={assigning}
                                  onClick={() => handleAssign(d.id)}
                                  className={`flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs transition-all hover:bg-slate-800 ${
                                    assignedTo?.id === d.id ? 'text-indigo-400' : 'text-slate-300'
                                  }`}
                                >
                                  <span className={`h-2 w-2 flex-shrink-0 rounded-full ${assignedTo?.id === d.id ? 'bg-indigo-400' : 'bg-slate-600'}`} />
                                  {d.name}
                                  {assignedTo?.id === d.id && <span className="ml-auto text-[10px] text-indigo-400">Actual</span>}
                                </button>
                              ))
                            )}
                            {assignedTo && (
                              <>
                                <div className="my-1 border-t border-slate-700" />
                                <button
                                  disabled={assigning}
                                  onClick={() => handleAssign(null)}
                                  className="flex w-full items-center gap-2 rounded-lg px-2 py-2 text-xs text-rose-400 transition-all hover:bg-slate-800"
                                >
                                  <X size={12} /> Quitar asignación
                                </button>
                              </>
                            )}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  )}

                  {/* Non-admin: show who is assigned (read-only badge) */}
                  {!isAdmin && assignedTo && (
                    <span className="flex items-center gap-1.5 rounded-lg border border-indigo-800 bg-indigo-900/20 px-2 py-1 text-[10px] text-indigo-400">
                      <Users size={11} /> {assignedTo.name}
                    </span>
                  )}
                </div>
              </div>

              {/* In-chat search bar */}
              <AnimatePresence>
                {showChatSearch && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b border-slate-700"
                  >
                    <div className="flex items-center gap-2 px-4 py-2">
                      <Search size={14} className="flex-shrink-0 text-slate-500" />
                      <input
                        type="text"
                        value={chatSearch}
                        onChange={e => setChatSearch(e.target.value)}
                        placeholder="Buscar en mensajes..."
                        autoFocus
                        className="flex-1 border-none bg-transparent text-sm text-white outline-none placeholder:text-slate-500"
                      />
                      {chatSearch && (
                        <span className="text-[10px] text-slate-500">
                          {displayMessages.length} resultado{displayMessages.length !== 1 ? 's' : ''}
                        </span>
                      )}
                      {chatSearch && (
                        <button onClick={() => setChatSearch('')} className="text-slate-500 hover:text-slate-300">
                          <X size={14} />
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Status banners */}
              {botMode === 'selected' && !chatEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 border-b border-blue-600/30 bg-blue-900/20 px-4 py-2"
                >
                  <Power size={14} className="flex-shrink-0 text-blue-400" />
                  <span className="text-xs text-blue-300">
                    Bot no activado para este chat. Presione <strong>"Activar"</strong> para habilitarlo.
                  </span>
                </motion.div>
              )}
              {manualMode && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="flex items-center gap-2 border-b border-yellow-600/30 bg-yellow-900/20 px-4 py-2"
                >
                  <UserCheck size={14} className="flex-shrink-0 text-yellow-400" />
                  <span className="text-xs text-yellow-300">
                    Modo manual — el agente controla esta conversacion. El bot no responde.
                  </span>
                </motion.div>
              )}

              {/* Client registration form */}
              <AnimatePresence>
                {showRegister && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: 'auto' }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border-b border-purple-600/30 bg-purple-900/10"
                  >
                    <form onSubmit={handleRegister} className="p-4">
                      <div className="mb-3 flex items-center justify-between">
                        <h3 className="flex items-center gap-2 text-sm font-bold text-purple-300">
                          <UserPlus size={14} />
                          Registrar como cliente
                        </h3>
                        <button
                          type="button"
                          onClick={() => setShowRegister(false)}
                          className="rounded-lg p-1 text-slate-500 transition-all hover:bg-slate-800 hover:text-slate-300"
                        >
                          <X size={16} />
                        </button>
                      </div>

                      <div className="mb-2 rounded-lg bg-slate-800/50 px-3 py-2">
                        <span className="font-mono text-xs text-slate-400">+{selectedPhone}</span>
                      </div>

                      <div className="grid gap-2 sm:grid-cols-2">
                        <input type="text" placeholder="Nombre completo *" value={registerForm.name}
                          onChange={e => setRegisterForm(f => ({ ...f, name: e.target.value }))} required
                          className="rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30" />
                        <input type="email" placeholder="Email" value={registerForm.email}
                          onChange={e => setRegisterForm(f => ({ ...f, email: e.target.value }))}
                          className="rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30" />
                        <input type="text" placeholder="Direccion" value={registerForm.address}
                          onChange={e => setRegisterForm(f => ({ ...f, address: e.target.value }))}
                          className="rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30" />
                        <input type="text" placeholder="Notas" value={registerForm.notes}
                          onChange={e => setRegisterForm(f => ({ ...f, notes: e.target.value }))}
                          className="rounded-lg border border-slate-600 bg-slate-800/50 px-3 py-2 text-sm text-white outline-none placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30" />
                      </div>

                      {registerError && <p className="mt-2 text-xs text-red-400">{registerError}</p>}

                      <div className="mt-3 flex justify-end gap-2">
                        <button type="button" onClick={() => setShowRegister(false)}
                          className="rounded-lg border border-slate-600 px-3 py-1.5 text-xs text-slate-400 transition-all hover:bg-slate-800">
                          Cancelar
                        </button>
                        <button type="submit" disabled={registering || !registerForm.name.trim()}
                          className="flex items-center gap-1.5 rounded-lg bg-purple-600 px-4 py-1.5 text-xs font-medium text-white transition-all hover:bg-purple-500 disabled:opacity-50">
                          {registering ? <div className="h-3 w-3 animate-spin rounded-full border border-white border-t-transparent" /> : <UserPlus size={12} />}
                          Registrar
                        </button>
                      </div>
                    </form>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div
                ref={scrollContainerRef}
                onScroll={handleScroll}
                className="flex-1 overflow-y-auto px-3 py-4 md:px-6"
              >
                {loadingMsgs ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-8 w-8 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <MessageSquare size={28} className="mb-2 text-slate-600" />
                    <p className="text-sm text-slate-500">Sin mensajes</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {chatSearch && displayMessages.length === 0 && (
                      <p className="text-center text-xs text-slate-500">No se encontraron resultados</p>
                    )}
                    {displayMessages.map((m, i) => (
                      <motion.div
                        key={m.id}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.15, delay: Math.min(i * 0.02, 0.5) }}
                        className={`flex ${m.direction === 'outbound' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 shadow-md sm:max-w-[70%] ${
                          m.direction === 'outbound'
                            ? 'rounded-br-md bg-purple-600 text-white shadow-purple-900/30'
                            : 'rounded-bl-md border border-slate-700 bg-slate-800 text-slate-200'
                        }`}>
                          <p className="whitespace-pre-wrap break-words text-[13px] leading-relaxed">{m.content}</p>
                          <p className={`mt-1 text-right text-[10px] ${
                            m.direction === 'outbound' ? 'text-purple-200/60' : 'text-slate-500'
                          }`}>
                            {formatDateTime(m.created_at)}
                          </p>
                        </div>
                      </motion.div>
                    ))}
                    <div ref={endRef} />
                  </div>
                )}
              </div>

              {/* Compose bar */}
              <form onSubmit={manualMode ? handleSend : e => e.preventDefault()} className="flex items-end gap-2 border-t border-slate-700 px-3 py-3 md:px-4">
                <div className="relative flex-1">
                  <textarea
                    ref={composeRef}
                    value={compose}
                    onChange={e => manualMode && setCompose(e.target.value)}
                    onKeyDown={e => {
                      if (!manualMode) return
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault()
                        handleSend(e)
                      }
                    }}
                    placeholder={manualMode ? 'Escribe un mensaje...' : 'Activa modo manual para escribir...'}
                    rows={1}
                    disabled={!manualMode}
                    className={`max-h-24 min-h-[38px] w-full resize-none rounded-xl border px-3 py-2 text-sm outline-none transition-all ${
                      manualMode
                        ? 'border-slate-600 bg-slate-800/50 text-white placeholder:text-slate-500 focus:border-purple-500 focus:ring-1 focus:ring-purple-500/30'
                        : 'cursor-not-allowed border-slate-700/50 bg-slate-800/20 text-slate-600 placeholder:text-slate-700 select-none'
                    }`}
                  />
                </div>
                <button
                  type="submit"
                  disabled={!manualMode || sending || !compose.trim()}
                  title={manualMode ? 'Enviar' : 'Activa modo manual para enviar'}
                  className={`flex h-[38px] w-[38px] flex-shrink-0 items-center justify-center rounded-xl text-white transition-all ${
                    manualMode
                      ? 'bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:hover:bg-purple-600'
                      : 'cursor-not-allowed bg-slate-700/40 opacity-30'
                  }`}
                >
                  {sending ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </form>
            </>
          )}
        </motion.div>

        {/* Client info side panel */}
        <AnimatePresence>
          {showClientInfo && (
            <motion.div
              initial={{ opacity: 0, x: 300 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 300 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="absolute right-0 top-0 z-20 flex h-full w-80 flex-col rounded-2xl border border-slate-700 bg-slate-900 shadow-2xl lg:relative lg:flex-shrink-0"
            >
              <div className="flex items-center justify-between border-b border-slate-700 px-4 py-3">
                <h3 className="font-display text-sm font-bold text-white">Informacion del Cliente</h3>
                <button
                  onClick={() => setShowClientInfo(false)}
                  className="rounded-lg p-1 text-slate-400 transition-all hover:bg-slate-800 hover:text-white"
                >
                  <X size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-4">
                {loadingClientInfo ? (
                  <div className="flex items-center justify-center py-8">
                    <div className="h-6 w-6 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
                  </div>
                ) : clientInfo ? (
                  <div className="space-y-4">
                    <div className="flex flex-col items-center gap-3 border-b border-slate-700/50 pb-4">
                      <ContactAvatar
                        phone={selectedPhone}
                        name={clientInfo.client.name}
                        clientId={clientInfo.client.id}
                        profilePicUrl={profilePics[selectedPhone]}
                        size={64}
                      />
                      <div className="text-center">
                        <p className="font-display text-base font-bold text-white">{clientInfo.client.name}</p>
                        <p className="font-mono text-xs text-slate-500">+{clientInfo.client.phone}</p>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {clientInfo.client.email && (
                        <div className="flex items-center gap-2 text-sm">
                          <Mail size={14} className="flex-shrink-0 text-slate-500" />
                          <span className="text-slate-300">{clientInfo.client.email}</span>
                        </div>
                      )}
                      {clientInfo.client.address && (
                        <div className="flex items-center gap-2 text-sm">
                          <MapPin size={14} className="flex-shrink-0 text-slate-500" />
                          <span className="text-slate-300">{clientInfo.client.address}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-2 text-sm">
                        <Calendar size={14} className="flex-shrink-0 text-slate-500" />
                        <span className="text-slate-400">Registrado: {formatDate(clientInfo.client.created_at)}</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-3 gap-2 rounded-xl bg-slate-800/50 p-3">
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{clientInfo.cases.length}</p>
                        <p className="text-[10px] text-slate-500">Casos</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{clientInfo.documentCount}</p>
                        <p className="text-[10px] text-slate-500">Docs</p>
                      </div>
                      <div className="text-center">
                        <p className="text-lg font-bold text-white">{clientInfo.messageCount}</p>
                        <p className="text-[10px] text-slate-500">Mensajes</p>
                      </div>
                    </div>

                    {clientInfo.client.notes && (
                      <div className="rounded-xl bg-slate-800/30 p-3">
                        <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-slate-500">Notas</p>
                        <p className="text-xs text-slate-300">{clientInfo.client.notes}</p>
                      </div>
                    )}

                    {clientInfo.cases.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Casos</p>
                        <div className="space-y-1.5">
                          {clientInfo.cases.map(c => (
                            <Link key={c.id} to="/cases"
                              className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2 text-xs transition-all hover:bg-slate-800"
                            >
                              <FolderOpen size={12} className="flex-shrink-0 text-purple-400" />
                              <span className="flex-1 truncate text-slate-300">{c.case_number} — {c.title}</span>
                              <span className={`rounded-full px-1.5 py-0.5 text-[9px] font-bold ${STATUS_MAP[c.status]?.cls || 'badge-muted'}`}>
                                {STATUS_MAP[c.status]?.label || c.status}
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}

                    {clientInfo.upcomingAppointments?.length > 0 && (
                      <div>
                        <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-slate-500">Proximas Citas</p>
                        <div className="space-y-1.5">
                          {clientInfo.upcomingAppointments.map(a => (
                            <div key={a.id} className="flex items-center gap-2 rounded-lg bg-slate-800/40 px-3 py-2 text-xs">
                              <Calendar size={12} className="flex-shrink-0 text-blue-400" />
                              <span className="text-slate-300">{formatDate(a.date)} — {formatTime(a.time)}</span>
                              <span className="text-slate-500">{a.type}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-center text-sm text-slate-500">Error al cargar informacion</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  )
}

function formatPhoneDisplay(phone) {
  if (!phone) return ''
  if (phone.length === 11 && phone.startsWith('1')) {
    return `+1 (${phone.slice(1, 4)}) ${phone.slice(4, 7)}-${phone.slice(7)}`
  }
  return `+${phone}`
}
