import { useEffect, useState } from 'react';
import { botApi } from '../services/botApi';

export default function Clients() {
  const [clients, setClients] = useState<any[]>([]);

  useEffect(() => {
    botApi.listClients().then(setClients).catch(() => setClients([]));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-700 mb-4">Clientes</h2>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-brand-50">
            <tr>
              <th className="p-3 text-left">Teléfono</th>
              <th className="p-3 text-left">Nombre</th>
              <th className="p-3 text-right">Pedidos</th>
              <th className="p-3 text-right">Total gastado</th>
              <th className="p-3 text-left">Última interacción</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr key={c.id} className="border-t hover:bg-brand-50">
                <td className="p-3">{c.phone}</td>
                <td className="p-3">{c.name || '—'}</td>
                <td className="p-3 text-right">{c.total_orders}</td>
                <td className="p-3 text-right">RD${c.total_spent}</td>
                <td className="p-3">{new Date(c.last_interaction_at).toLocaleString('es-DO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
