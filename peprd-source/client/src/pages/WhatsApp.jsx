import { useState, useEffect, useRef } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { api } from '../utils/api'
import { motion } from 'framer-motion'
import { MessageCircle, Smartphone, QrCode, CheckCircle2, XCircle, Zap, RefreshCw, Pause, Play, Users, UserCheck } from 'lucide-react'

export default function WhatsApp() {
  const [status, setStatus] = useState(null)
  const [qr, setQr] = useState(null)
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [waitingForQr, setWaitingForQr] = useState(false)
  const [toggling, setToggling] = useState(false)
  const [error, setError] = useState(null)
  const pollRef = useRef(null)

  async function fetchStatus() {
    try {
      const data = await api.get('/whatsapp/status')
      setStatus(data)
      return data
    } catch {
      setStatus(null)
      return null
    } finally {
      setLoading(false)
    }
  }

  async function fetchQr() {
    try {
      const data = await api.get('/whatsapp/qr')
      console.log('QR fetch result:', data.qr ? `FOUND (${data.qr.length} chars)` : data.status)
      if (data.qr) {
        setQr(data.qr)
        return true
      }
      setQr(null)
      return false
    } catch (err) {
      console.error('QR fetch error:', err)
      setQr(null)
      return false
    }
  }

  useEffect(() => {
    fetchStatus()
    const interval = setInterval(() => {
      fetchStatus()
    }, 5000)
    return () => clearInterval(interval)
  }, [])

  // Cleanup poll on unmount
  useEffect(() => {
    return () => { if (pollRef.current) clearInterval(pollRef.current) }
  }, [])

  async function handleConnect() {
    setConnecting(true)
    setWaitingForQr(true)
    setError(null)
    try {
      console.log('Connecting to WhatsApp...')
      const response = await api.post('/whatsapp/connect')
      console.log('Connect response:', response)

      // Poll aggressively for QR code every 1.5 seconds for 30 seconds
      if (pollRef.current) clearInterval(pollRef.current)
      let attempts = 0
      pollRef.current = setInterval(async () => {
        attempts++
        console.log(`Polling for QR code... attempt ${attempts}`)
        const found = await fetchQr()
        await fetchStatus()
        if (found || attempts >= 20) {
          clearInterval(pollRef.current)
          pollRef.current = null
          setWaitingForQr(false)
          if (!found) {
            console.log('QR code not received after 20 attempts')
            setError('No se recibió código QR. Revisa el terminal del backend.')
          }
        }
      }, 1500)
    } catch (err) {
      console.error('Connection error:', err)
      setError(err.message || 'Failed to connect')
      setWaitingForQr(false)
    } finally {
      setConnecting(false)
    }
  }

  async function handleDisconnect() {
    if (!confirm('¿Desconectar la sesión de WhatsApp?')) return
    try {
      await api.post('/whatsapp/disconnect')
      setStatus({ ...status, connected: false })
      setQr(null)
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleBotToggle() {
    setToggling(true)
    try {
      const data = await api.post('/whatsapp/bot-toggle')
      setStatus(prev => ({ ...prev, botActive: data.botActive }))
    } catch (err) {
      alert(err.message)
    } finally {
      setToggling(false)
    }
  }

  async function handleBotMode(mode) {
    try {
      const data = await api.post('/whatsapp/bot-mode', { mode })
      setStatus(prev => ({ ...prev, botMode: data.botMode }))
    } catch (err) {
      alert(err.message)
    }
  }

  async function handleAssignmentMode(mode) {
    try {
      const data = await api.post('/whatsapp/assignment-mode', { mode })
      setStatus(prev => ({ ...prev, assignmentMode: data.assignmentMode }))
    } catch (err) {
      alert(err.message)
    }
  }

  const botActive = status?.botActive !== false
  const botMode = status?.botMode || 'all'
  const assignmentMode = status?.assignmentMode || 'automatic'
  const isConnected = status?.connected === true

  return (
    <div className="min-w-0">
      {/* Header */}
      <div className="mb-8">
        <div className="mb-4 flex items-center gap-3">
          <div className="rounded-xl bg-emerald-600/20 p-3">
            <MessageCircle className="h-6 w-6 text-emerald-400" />
          </div>
          <div>
            <h2 className="font-display text-2xl font-bold text-white md:text-3xl">
              Conexión WhatsApp
            </h2>
            <p className="text-sm text-slate-400">
              Conecta tu cuenta de WhatsApp para recibir mensajes
            </p>
          </div>
        </div>
      </div>

      {/* Connection Status & QR Code Grid */}
      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        {/* Connection Status Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-lg"
        >
          <div className="mb-6 flex items-center gap-2">
            <Smartphone className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">
              Estado de Conexión
            </h3>
          </div>

          {loading ? (
            <div className="flex items-center gap-3 py-4">
              <RefreshCw className="h-5 w-5 animate-spin text-blue-400" />
              <span className="text-slate-400">Verificando conexión...</span>
            </div>
          ) : (
            <div>
              {/* Status Indicator */}
              <div className="mb-6 flex items-center gap-4">
                <div className="relative">
                  {status?.connected ? (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-600/20">
                      <CheckCircle2 className="h-8 w-8 text-emerald-400" />
                      <div className="absolute inset-0 animate-ping rounded-full bg-emerald-600/20" />
                    </div>
                  ) : (
                    <div className="flex h-16 w-16 items-center justify-center rounded-full bg-red-600/20">
                      <XCircle className="h-8 w-8 text-red-400" />
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <div className="mb-1 text-lg font-bold text-white">
                    {status?.connected ? 'Conectado' : 'Desconectado'}
                  </div>
                  <div className="text-sm text-slate-400">
                    Sesión: <span className="font-mono">{status?.sessionId || 'N/A'}</span>
                  </div>
                </div>
              </div>

              {/* Bot Mode Selector — always visible */}
              <div className="mb-4 rounded-xl border border-slate-600 bg-slate-800/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Modo del Bot</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleBotMode('all')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      botMode === 'all'
                        ? 'bg-purple-600/30 text-purple-300 ring-1 ring-purple-500'
                        : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Users size={14} />
                    Todos
                  </button>
                  <button
                    onClick={() => handleBotMode('selected')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      botMode === 'selected'
                        ? 'bg-blue-600/30 text-blue-300 ring-1 ring-blue-500'
                        : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <UserCheck size={14} />
                    Seleccionados
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {botMode === 'all'
                    ? 'El bot responde a todos los contactos.'
                    : isConnected
                      ? 'El bot solo responde a los contactos que actives en la sección de Mensajes.'
                      : 'Conecta WhatsApp para seleccionar contactos específicos.'}
                </p>
              </div>

              {/* Assignment Mode Selector */}
              <div className="mb-4 rounded-xl border border-slate-600 bg-slate-800/50 p-3">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-slate-400">Asignación de Chats</p>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleAssignmentMode('automatic')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      assignmentMode === 'automatic'
                        ? 'bg-green-600/30 text-green-300 ring-1 ring-green-500'
                        : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <Zap size={14} />
                    Automática
                  </button>
                  <button
                    onClick={() => handleAssignmentMode('manual')}
                    className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-3 py-2 text-xs font-medium transition-all ${
                      assignmentMode === 'manual'
                        ? 'bg-cyan-600/30 text-cyan-300 ring-1 ring-cyan-500'
                        : 'bg-slate-700/50 text-slate-400 hover:text-slate-300'
                    }`}
                  >
                    <UserCheck size={14} />
                    Manual
                  </button>
                </div>
                <p className="mt-2 text-[11px] text-slate-500">
                  {assignmentMode === 'automatic'
                    ? 'Los chats nuevos se asignan automáticamente a los empleados disponibles.'
                    : 'Los chats nuevos se asignan manualmente por el administrador.'}
                </p>
              </div>

              {/* Action Buttons */}
              {isConnected ? (
                <div className="space-y-3">
                  {/* Bot Toggle */}
                  <button
                    onClick={handleBotToggle}
                    disabled={toggling}
                    className={`flex w-full items-center justify-center gap-2 rounded-xl border px-4 py-3 font-medium transition-all disabled:cursor-not-allowed disabled:opacity-50 ${
                      botActive
                        ? 'border-yellow-600 bg-yellow-600/20 text-yellow-400 hover:bg-yellow-600/30'
                        : 'border-emerald-600 bg-emerald-600/20 text-emerald-400 hover:bg-emerald-600/30'
                    }`}
                  >
                    {toggling ? (
                      <RefreshCw size={18} className="animate-spin" />
                    ) : botActive ? (
                      <Pause size={18} />
                    ) : (
                      <Play size={18} />
                    )}
                    {botActive ? 'Pausar Bot' : 'Reanudar Bot'}
                  </button>

                  {/* Paused indicator */}
                  {!botActive && (
                    <motion.div
                      initial={{ opacity: 0, y: -5 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-900/20 px-3 py-2"
                    >
                      <Pause size={14} className="flex-shrink-0 text-yellow-400" />
                      <span className="text-xs text-yellow-300">
                        Bot pausado — los mensajes se reciben y guardan, pero el bot no responde.
                      </span>
                    </motion.div>
                  )}

                  {/* Disconnect */}
                  <button
                    onClick={handleDisconnect}
                    className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-600 bg-red-600/20 px-4 py-3 font-medium text-red-400 transition-all hover:bg-red-600/30"
                  >
                    <XCircle size={18} />
                    Desconectar Sesión
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnect}
                  disabled={connecting}
                  className="neon-purple flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 font-bold text-white transition-all disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {connecting ? (
                    <>
                      <RefreshCw size={18} className="animate-spin" />
                      Conectando...
                    </>
                  ) : (
                    <>
                      <Zap size={18} />
                      Iniciar Conexión
                    </>
                  )}
                </button>
              )}

              {/* Error Display */}
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 flex items-start gap-2 rounded-lg border border-red-500/50 bg-red-900/20 p-3 text-red-400"
                >
                  <XCircle size={18} className="flex-shrink-0 mt-0.5" />
                  <div className="text-sm">
                    <strong className="font-semibold">Error:</strong> {error}
                  </div>
                </motion.div>
              )}
            </div>
          )}
        </motion.div>

        {/* QR Code Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
          className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-lg"
        >
          <div className="mb-6 flex items-center gap-2">
            <QrCode className="h-5 w-5 text-purple-400" />
            <h3 className="text-lg font-semibold text-white">Código QR</h3>
          </div>

          {status?.connected ? (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="mb-4 flex h-24 w-24 items-center justify-center rounded-full bg-emerald-600/20">
                <CheckCircle2 className="h-12 w-12 text-emerald-400" />
              </div>
              <p className="text-lg font-semibold text-emerald-400">
                ¡Sesión Activa!
              </p>
              <p className="mt-2 text-sm text-slate-400">
                No se requiere escanear código QR
              </p>
            </div>
          ) : qr ? (
            <div className="text-center">
              <p className="mb-4 text-sm text-slate-300">
                Escanea este código con WhatsApp:
              </p>
              <div className="inline-block overflow-hidden rounded-xl border-2 border-purple-500/50 bg-white p-4 shadow-[0_0_30px_rgba(147,51,234,0.3)]">
                <QRCodeSVG
                  value={qr}
                  size={256}
                  level="M"
                  includeMargin={false}
                />
              </div>
              <div className="mt-4 flex items-center justify-center gap-2 text-xs text-slate-500">
                <RefreshCw size={12} className="animate-spin" />
                Se actualiza automáticamente cada 5 segundos
              </div>
            </div>
          ) : waitingForQr ? (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="relative mb-4">
                <QrCode className="h-16 w-16 text-purple-500/30" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <RefreshCw className="h-8 w-8 animate-spin text-purple-400" />
                </div>
              </div>
              <p className="mb-2 text-slate-300">
                Generando código QR...
              </p>
              <p className="text-sm text-slate-500">
                Esto puede tomar unos segundos
              </p>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <QrCode className="mb-4 h-16 w-16 text-slate-600" />
              <p className="mb-2 text-slate-400">
                No hay código QR disponible
              </p>
              <p className="text-sm text-slate-500">
                Presiona "Iniciar Conexión" para generar uno
              </p>
            </div>
          )}
        </motion.div>
      </div>

      {/* Instructions Card */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
        className="rounded-2xl border border-slate-700 bg-gradient-to-br from-slate-900 to-slate-800 p-6 shadow-lg"
      >
        <h3 className="mb-4 flex items-center gap-2 text-lg font-semibold text-white">
          <MessageCircle className="h-5 w-5 text-blue-400" />
          Instrucciones de Conexión
        </h3>
        <ol className="space-y-3 text-sm text-slate-300">
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
              1
            </span>
            <span>
              Presiona <strong className="text-white">"Iniciar Conexión"</strong> para generar el código QR.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
              2
            </span>
            <span>
              Abre <strong className="text-white">WhatsApp</strong> en tu teléfono → <strong className="text-white">Dispositivos vinculados</strong> → <strong className="text-white">Vincular dispositivo</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
              3
            </span>
            <span>Escanea el código QR mostrado en pantalla.</span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
              4
            </span>
            <span>
              Una vez conectado, el bot comenzará a <strong className="text-white">atender mensajes automáticamente</strong>.
            </span>
          </li>
          <li className="flex gap-3">
            <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-purple-600/20 text-xs font-bold text-purple-400">
              5
            </span>
            <span>
              La sesión se mantendrá activa incluso al cerrar esta página.
            </span>
          </li>
        </ol>

        {/* Info Box */}
        <div className="mt-6 rounded-lg border border-blue-600/30 bg-blue-600/10 p-4">
          <div className="flex gap-3">
            <MessageCircle className="h-5 w-5 flex-shrink-0 text-blue-400" />
            <div className="text-sm text-blue-300">
              <strong className="font-semibold">Tip:</strong> Usa el botón <strong>"Pausar Bot"</strong> para dejar de responder mensajes sin desconectar WhatsApp. Los mensajes entrantes se seguirán guardando, pero el bot no enviará respuestas hasta que lo reanudes.
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  )
}
