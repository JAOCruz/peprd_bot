import { useEffect, useMemo, useState } from "react";
import {
  Package,
  Search,
  Plus,
  Minus,
  RefreshCw,
  AlertTriangle,
  TrendingUp,
  Boxes,
  DollarSign,
} from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";

interface Product {
  id: number;
  category_slug: string | null;
  sku: string | null;
  name: string;
  description: string | null;
  price: number | string | null;
  unit: string | null;
  stock: number;
  low_stock_threshold: number;
  active: boolean;
}

interface Category {
  slug: string;
  name: string;
  emoji?: string;
  description?: string;
  count: number;
  total_stock: number;
  value: number | string;
}

interface Stats {
  total: number;
  active: number;
  out_of_stock: number;
  low_stock: number;
  inventory_value: number | string;
}

const RD$ = (n: number | string | null | undefined) =>
  `RD$ ${Number(n || 0).toLocaleString("es-DO", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

export default function Inventory() {
  const { isAdmin } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>("");
  const [q, setQ] = useState("");
  const [loading, setLoading] = useState(true);
  const [syncBusy, setSyncBusy] = useState(false);
  const [err, setErr] = useState("");

  const loadAll = async () => {
    setLoading(true);
    setErr("");
    try {
      const [p, c, s] = await Promise.all([
        api.get("/products", { params: { category: activeCategory || undefined, q: q || undefined } }),
        api.get("/products/categories"),
        api.get("/products/stats"),
      ]);
      setProducts(p.data.products || []);
      setCategories(c.data.categories || []);
      setStats(s.data.stats);
    } catch (e: any) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeCategory]);

  useEffect(() => {
    const t = setTimeout(loadAll, 300);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q]);

  const adjustStock = async (id: number, delta: number) => {
    if (!isAdmin) return;
    try {
      await api.post(`/products/${id}/stock`, { delta });
      loadAll();
    } catch (e: any) {
      setErr(e?.response?.data?.error || e.message);
    }
  };

  const syncCatalog = async () => {
    if (!isAdmin) return;
    setSyncBusy(true);
    try {
      await api.post("/products/sync-from-catalog");
      await loadAll();
    } catch (e: any) {
      setErr(e?.response?.data?.error || e.message);
    } finally {
      setSyncBusy(false);
    }
  };

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  const statCards = [
    {
      label: "Productos activos",
      value: stats?.active ?? "—",
      icon: Boxes,
      tone: "text-[#c89b3c]",
    },
    {
      label: "Sin stock",
      value: stats?.out_of_stock ?? "—",
      icon: AlertTriangle,
      tone: (stats?.out_of_stock || 0) > 0 ? "text-red-400" : "text-slate-400",
    },
    {
      label: "Stock bajo",
      value: stats?.low_stock ?? "—",
      icon: TrendingUp,
      tone: (stats?.low_stock || 0) > 0 ? "text-amber-400" : "text-slate-400",
    },
    {
      label: "Valor inventario",
      value: stats ? RD$(stats.inventory_value) : "—",
      icon: DollarSign,
      tone: "text-emerald-400",
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-3 font-serif italic text-2xl text-white">
            <Package size={26} className="text-[#c89b3c]" />
            Inventario
          </h1>
          <p className="mt-1 text-sm text-slate-400">
            Productos (péptidos) disponibles para cotización y envío. Stock bajo se marca automáticamente.
          </p>
        </div>
        {isAdmin && (
          <button
            onClick={syncCatalog}
            disabled={syncBusy}
            className="flex items-center gap-2 rounded-lg border border-[#c89b3c]/30 bg-[#c89b3c]/10 px-3 py-2 text-xs font-medium text-[#c89b3c] hover:bg-[#c89b3c]/20 disabled:opacity-50"
          >
            <RefreshCw size={14} className={syncBusy ? "animate-spin" : ""} />
            Sincronizar desde catálogo
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        {statCards.map((c) => (
          <div
            key={c.label}
            className="rounded-xl border border-slate-800 bg-slate-900/60 p-4"
          >
            <div className="flex items-center justify-between">
              <div className="font-mono text-[10px] uppercase tracking-wider text-slate-500">
                {c.label}
              </div>
              <c.icon size={16} className={c.tone} />
            </div>
            <div className="mt-2 font-serif italic text-2xl text-white">
              {c.value}
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-2">
          <CategoryChip
            active={activeCategory === ""}
            onClick={() => setActiveCategory("")}
          >
            Todas
          </CategoryChip>
          {categories.map((c) => (
            <CategoryChip
              key={c.slug}
              active={activeCategory === c.slug}
              onClick={() => setActiveCategory(c.slug)}
            >
              <span>{c.emoji}</span> {c.name}
              <span className="ml-1 rounded bg-slate-800 px-1.5 py-0.5 font-mono text-[10px] text-slate-400">
                {c.count}
              </span>
            </CategoryChip>
          ))}
        </div>

        <div className="relative max-w-md">
          <Search
            size={16}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500"
          />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, SKU, descripción…"
            className="w-full rounded-lg border border-slate-800 bg-slate-900/60 py-2 pl-9 pr-3 text-sm text-white placeholder-slate-500 focus:border-[#2d5f5a] focus:outline-none focus:ring-1 focus:ring-[#2d5f5a]"
          />
        </div>
      </div>

      {err && (
        <div className="rounded-lg border border-red-500/40 bg-red-500/10 px-4 py-2 text-sm text-red-300">
          {err}
        </div>
      )}

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60">
        <table className="w-full">
          <thead className="border-b border-slate-800 bg-slate-900/80">
            <tr className="text-left font-mono text-[10px] uppercase tracking-widest text-slate-500">
              <th className="px-4 py-3">Producto</th>
              <th className="px-4 py-3">Categoría</th>
              <th className="px-4 py-3 text-right">Precio</th>
              <th className="px-4 py-3 text-center">Stock</th>
              <th className="px-4 py-3 text-center">Estado</th>
              {isAdmin && <th className="px-4 py-3 text-right">Ajustar</th>}
            </tr>
          </thead>
          <tbody>
            {loading && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                  Cargando…
                </td>
              </tr>
            )}
            {!loading && sortedProducts.length === 0 && (
              <tr>
                <td colSpan={isAdmin ? 6 : 5} className="px-4 py-8 text-center text-slate-500">
                  Sin productos. {isAdmin && 'Usa "Sincronizar desde catálogo" para importar.'}
                </td>
              </tr>
            )}
            {!loading &&
              sortedProducts.map((p) => {
                const status = stockStatus(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-slate-800/60 transition-colors hover:bg-slate-900/40"
                  >
                    <td className="px-4 py-3">
                      <div className="font-medium text-slate-100">{p.name}</div>
                      {p.description && (
                        <div className="mt-0.5 line-clamp-1 text-xs text-slate-500">
                          {p.description}
                        </div>
                      )}
                      {p.sku && (
                        <div className="mt-0.5 font-mono text-[10px] text-slate-600">{p.sku}</div>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <CategoryBadge slug={p.category_slug} categories={categories} />
                    </td>
                    <td className="px-4 py-3 text-right font-mono text-sm text-slate-200">
                      {RD$(p.price)}
                    </td>
                    <td className="px-4 py-3 text-center font-mono text-lg font-semibold text-white">
                      {p.stock ?? 0}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider ${status.className}`}
                      >
                        {status.label}
                      </span>
                    </td>
                    {isAdmin && (
                      <td className="px-4 py-3">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => adjustStock(p.id, -1)}
                            className="rounded border border-slate-700 bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"
                            title="Restar 1"
                          >
                            <Minus size={14} />
                          </button>
                          <button
                            onClick={() => adjustStock(p.id, 1)}
                            className="rounded border border-slate-700 bg-slate-800 p-1 text-slate-300 hover:bg-slate-700"
                            title="Sumar 1"
                          >
                            <Plus size={14} />
                          </button>
                          <button
                            onClick={() => adjustStock(p.id, 5)}
                            className="rounded border border-[#2d5f5a]/50 bg-[#2d5f5a]/20 px-2 py-1 font-mono text-xs text-[#c89b3c] hover:bg-[#2d5f5a]/40"
                            title="Sumar 5"
                          >
                            +5
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function stockStatus(p: Product) {
  const s = p.stock || 0;
  const threshold = p.low_stock_threshold || 5;
  if (!p.active)
    return { label: "Inactivo", className: "bg-slate-800 text-slate-500" };
  if (s === 0)
    return {
      label: "Sin stock",
      className: "bg-red-500/15 text-red-400 border border-red-500/30",
    };
  if (s <= threshold)
    return {
      label: "Bajo",
      className: "bg-amber-500/15 text-amber-400 border border-amber-500/30",
    };
  return {
    label: "Disponible",
    className: "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30",
  };
}

function CategoryBadge({
  slug,
  categories,
}: {
  slug: string | null;
  categories: Category[];
}) {
  if (!slug) return <span className="text-slate-500">—</span>;
  const c = categories.find((x) => x.slug === slug);
  return (
    <span className="inline-flex items-center gap-1 rounded-md border border-slate-700 bg-slate-800 px-2 py-0.5 text-xs text-slate-300">
      {c?.emoji && <span>{c.emoji}</span>}
      <span>{c?.name || slug}</span>
    </span>
  );
}

function CategoryChip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium transition ${
        active
          ? "border-[#c89b3c]/50 bg-[#c89b3c]/15 text-[#c89b3c]"
          : "border-slate-800 bg-slate-900/50 text-slate-400 hover:border-slate-700 hover:text-slate-200"
      }`}
    >
      {children}
    </button>
  );
}
