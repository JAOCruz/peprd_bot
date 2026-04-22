import { useEffect, useState } from 'react';
import { botApi } from '../services/botApi';

export default function Dashboard() {
  const [wa, setWa] = useState<{ connected: boolean } | null>(null);
  const [orders, setOrders] = useState<any[]>([]);

  useEffect(() => {
    botApi.waStatus().then(setWa).catch(() => setWa({ connected: false }));
    botApi.listOrders({ limit: 10 }).then(setOrders).catch(() => setOrders([]));
  }, []);

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-700 mb-6">Panel de Control</h2>
      <div className="grid grid-cols-3 gap-4 mb-8">
        <Card title="Estado WhatsApp" value={wa?.connected ? '🟢 Conectado' : '🔴 Desconectado'} />
        <Card title="Pedidos recientes" value={String(orders.length)} />
        <Card title="Negocio" value="Tasty Temptations" />
      </div>

      <section className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-semibold mb-4">Últimos pedidos</h3>
        {orders.length === 0 ? (
          <p className="text-gray-500">Sin pedidos todavía.</p>
        ) : (
          <ul className="divide-y">
            {orders.map((o) => (
              <li key={o.id} className="py-2 flex justify-between">
                <span>{o.order_number}</span>
                <span className="text-gray-600">{o.status}</span>
                <span className="font-semibold">RD${o.total}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}

function Card({ title, value }: { title: string; value: string }) {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="text-sm text-gray-500">{title}</div>
      <div className="text-2xl font-bold mt-2 text-brand-700">{value}</div>
    </div>
  );
}
