import { useEffect, useState } from 'react';
import { botApi } from '../services/botApi';

export default function Orders() {
  const [orders, setOrders] = useState<any[]>([]);
  const [status, setStatus] = useState<string>('');

  useEffect(() => {
    botApi.listOrders({ status: status || undefined }).then(setOrders).catch(() => setOrders([]));
  }, [status]);

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold text-brand-700">Pedidos</h2>
        <select value={status} onChange={(e) => setStatus(e.target.value)} className="border rounded px-3 py-1">
          <option value="">Todos</option>
          <option value="pending">Pendientes</option>
          <option value="preparing">Preparando</option>
          <option value="ready">Listos</option>
          <option value="delivered">Entregados</option>
          <option value="cancelled">Cancelados</option>
        </select>
      </div>
      <div className="bg-white rounded-lg shadow">
        <table className="w-full">
          <thead className="bg-brand-50">
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Cliente</th>
              <th className="p-3 text-left">Estado</th>
              <th className="p-3 text-right">Total</th>
              <th className="p-3 text-left">Fecha</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((o) => (
              <tr key={o.id} className="border-t hover:bg-brand-50">
                <td className="p-3">{o.order_number}</td>
                <td className="p-3">{o.client_id}</td>
                <td className="p-3">{o.status}</td>
                <td className="p-3 text-right">RD${o.total}</td>
                <td className="p-3">{new Date(o.created_at).toLocaleString('es-DO')}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
