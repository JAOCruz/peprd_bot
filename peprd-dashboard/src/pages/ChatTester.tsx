import { useEffect, useRef, useState } from 'react';
import { botApi } from '../services/botApi';

type Msg = { from: 'user' | 'bot'; text: string; flow?: string | null; step?: string | null };

export default function ChatTester() {
  const [sessionId] = useState(() => localStorage.getItem('chat-session') || `web-${Date.now()}`);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [state, setState] = useState<{ flow: string | null; step: string | null }>({ flow: null, step: null });
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    localStorage.setItem('chat-session', sessionId);
    botApi.chatState(sessionId).then((s) => setState({ flow: s.flow, step: s.step })).catch(() => {});
  }, [sessionId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  async function send() {
    const text = input.trim();
    if (!text || loading) return;
    setInput('');
    setMessages((m) => [...m, { from: 'user', text }]);
    setLoading(true);
    try {
      const res = await botApi.chatSend(text, sessionId);
      const botMsgs: Msg[] = (res.responses || []).map((r: any) => ({
        from: 'bot',
        text: r.body,
        flow: r.flow,
        step: r.step,
      }));
      setMessages((m) => [...m, ...botMsgs]);
      setState({ flow: res.session?.flow || null, step: res.session?.step || null });
    } catch (err: any) {
      setMessages((m) => [...m, { from: 'bot', text: `⚠️ Error: ${err?.response?.data?.error || err.message}` }]);
    } finally {
      setLoading(false);
    }
  }

  async function reset() {
    await botApi.chatReset(sessionId);
    setMessages([]);
    setState({ flow: null, step: null });
  }

  return (
    <div className="flex flex-col h-[calc(100vh-4rem)]">
      <div className="flex justify-between items-center mb-4">
        <div>
          <h2 className="text-2xl font-bold text-brand-700">Chat Tester</h2>
          <div className="text-xs text-gray-500 mt-1">
            Session: <code>{sessionId}</code>
            {state.flow && <> • Flow: <code>{state.flow}</code></>}
            {state.step && <> • Step: <code>{state.step}</code></>}
          </div>
        </div>
        <button onClick={reset} className="px-3 py-1 bg-white border rounded hover:bg-gray-50">
          Reiniciar conversación
        </button>
      </div>

      <div className="flex-1 bg-white rounded-lg shadow p-4 overflow-y-auto space-y-2">
        {messages.length === 0 && (
          <div className="text-gray-400 text-sm text-center py-8">
            Escribe "hola" o "menu" para comenzar. Se usa el mismo motor que WhatsApp.
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.from === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[70%] rounded-2xl px-4 py-2 whitespace-pre-wrap ${
                m.from === 'user'
                  ? 'bg-brand-600 text-white rounded-br-sm'
                  : 'bg-brand-50 text-gray-800 rounded-bl-sm'
              }`}
            >
              {m.text}
              {m.from === 'bot' && (m.flow || m.step) && (
                <div className="text-[10px] opacity-60 mt-1">
                  {m.flow}{m.step ? ` → ${m.step}` : ''}
                </div>
              )}
            </div>
          </div>
        ))}
        {loading && <div className="text-sm text-gray-400">Dulce está escribiendo…</div>}
        <div ref={endRef} />
      </div>

      <div className="mt-3 flex gap-2">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') send(); }}
          placeholder="Escribe un mensaje..."
          className="flex-1 border rounded-lg px-4 py-2 focus:outline-none focus:border-brand-500"
        />
        <button
          onClick={send}
          disabled={loading}
          className="px-5 py-2 bg-brand-600 text-white rounded-lg hover:bg-brand-700 disabled:opacity-50"
        >
          Enviar
        </button>
      </div>
    </div>
  );
}
