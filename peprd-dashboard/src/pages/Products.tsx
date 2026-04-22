import { useEffect, useState } from 'react';
import { botApi } from '../services/botApi';

export default function Products() {
  const [cats, setCats] = useState<any[]>([]);
  const [items, setItems] = useState<any[]>([]);
  const [slug, setSlug] = useState<string>('');

  useEffect(() => {
    botApi.listCategories().then(setCats).catch(() => setCats([]));
  }, []);

  useEffect(() => {
    botApi.listProducts(slug || undefined).then(setItems).catch(() => setItems([]));
  }, [slug]);

  return (
    <div>
      <h2 className="text-2xl font-bold text-brand-700 mb-4">Productos</h2>
      <div className="flex gap-2 mb-4 flex-wrap">
        <button onClick={() => setSlug('')} className={`px-3 py-1 rounded ${!slug ? 'bg-brand-600 text-white' : 'bg-white'}`}>Todos</button>
        {cats.map((c) => (
          <button
            key={c.slug}
            onClick={() => setSlug(c.slug)}
            className={`px-3 py-1 rounded ${slug === c.slug ? 'bg-brand-600 text-white' : 'bg-white'}`}
          >
            {c.emoji} {c.name}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-4">
        {items.map((p) => (
          <div key={p.id} className="bg-white rounded-lg shadow p-4">
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-500">{p.description}</div>
            <div className="text-brand-700 font-bold mt-2">RD${p.price}</div>
            <div className="text-xs text-gray-400 mt-1">{p.available ? 'Disponible' : 'Agotado'}</div>
          </div>
        ))}
      </div>
    </div>
  );
}
