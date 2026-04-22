import { useEffect, useState } from 'react';
import { botApi } from '../services/botApi';

export default function Messages() {
  const [rows, setRows] = useState<any[]>([]);
  const [q, setQ] = useState('');

  useEffect(() => {
    botApi.searchMessages(q || undefined).then(setRows).catch(() => setRows([]));
  }, [q]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-700 mb-4">Mensajes</h2>
      <input
        type="text"
        placeholder="Buscar..."
        value={q}
        onChange={(e) => setQ(e.target.value)}
        className="border rounded px-3 py-2 w-full mb-4"
      />
      <div className="bg-white rounded-lg shadow divide-y max-h-[70vh] overflow-y-auto">
        {rows.map((m) => (
          <div key={m.id} className="p-3">
            <div className="flex justify-between text-xs text-gray-500">
              <span>{m.phone} • {m.direction === 'in' ? '⬅️ Entrada' : '➡️ Salida'}</span>
              <span>{new Date(m.created_at).toLocaleString('es-DO')}</span>
            </div>
            <div className="mt-1 whitespace-pre-wrap">{m.body}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
