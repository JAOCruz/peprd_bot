import { useState, useEffect } from "react";
import { ChevronLeft, Download, CheckCircle, XCircle } from "lucide-react";
import { getAPIUrl } from "../services/api";

interface Quotation {
  id: number;
  doc_number: string;
  client_name: string;
  client_phone: string;
  type: string;
  items: any[];
  total: number;
  status: "draft" | "approved" | "sent";
  pdf_path: string;
  created_at: string;
  created_by_name?: string;
}

export default function Cotizaciones() {
  const [quotations, setQuotations] = useState<Quotation[]>([]);
  const [selectedQuotation, setSelectedQuotation] = useState<Quotation | null>(null);
  const [showRightPanel, setShowRightPanel] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchQuotations();
  }, []);

  const fetchQuotations = async () => {
    try {
      setLoading(true);
      const response = await fetch(`${getAPIUrl()}/api/invoices/quotations`);
      if (!response.ok) throw new Error("Failed to fetch quotations");
      const data = await response.json();
      setQuotations(data.quotations || []);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error loading quotations");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuotation = (quote: Quotation) => {
    setSelectedQuotation(quote);
    setShowRightPanel(true);
  };

  const handleApprove = async () => {
    if (!selectedQuotation) return;
    try {
      const response = await fetch(
        `${getAPIUrl()}/api/invoices/${selectedQuotation.id}/approve`,
        { method: "POST" }
      );
      if (!response.ok) throw new Error("Failed to approve");
      await fetchQuotations();
      setSelectedQuotation(null);
      setShowRightPanel(false);
    } catch (err) {
      console.error(err);
    }
  };

  const statusColor = {
    draft: "bg-yellow-100 text-yellow-800",
    approved: "bg-blue-100 text-blue-800",
    sent: "bg-green-100 text-green-800",
  };

  const statusLabel = {
    draft: "Pendiente",
    approved: "Aprobada",
    sent: "Enviada",
  };

  return (
    <div className="-m-3 md:-m-8 flex overflow-hidden bg-slate-950" style={{ height: "calc(100vh - 4rem)" }}>
      {/* Left Panel - Quotations List */}
      <div className={`${showRightPanel && window.innerWidth < 768 ? "hidden" : "w-full md:w-80"} flex-shrink-0 border-r border-slate-700 bg-slate-900 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-slate-700 bg-slate-800">
          <h2 className="text-lg font-bold text-white">Cotizaciones</h2>
          <p className="text-xs text-slate-400 mt-1">{quotations.length} total</p>
        </div>

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-slate-400">
            Cargando...
          </div>
        ) : error ? (
          <div className="flex-1 flex items-center justify-center text-red-400 p-4 text-center">
            {error}
          </div>
        ) : quotations.length === 0 ? (
          <div className="flex-1 flex items-center justify-center text-slate-400 p-4 text-center">
            No hay cotizaciones
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto">
            {quotations.map((quote) => (
              <button
                key={quote.id}
                onClick={() => handleSelectQuotation(quote)}
                className={`w-full text-left p-4 border-b border-slate-700 transition-colors ${
                  selectedQuotation?.id === quote.id
                    ? "bg-slate-800 border-l-4 border-l-blue-500"
                    : "hover:bg-slate-800/50"
                }`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-white text-base truncate">
                      {quote.doc_number}
                    </p>
                    <p className="text-sm text-slate-400 truncate">
                      {quote.client_name}
                    </p>
                    <p className="text-xs text-slate-500 mt-1">
                      RD$ {quote.total.toLocaleString("es-DO")}
                    </p>
                  </div>
                  <span className={`text-xs font-semibold px-2 py-1 rounded whitespace-nowrap ${statusColor[quote.status]}`}>
                    {statusLabel[quote.status]}
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-2">
                  {new Date(quote.created_at).toLocaleDateString("es-DO")}
                </p>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Right Panel - Quotation Details */}
      {selectedQuotation && (
        <div className={`${!showRightPanel && window.innerWidth < 768 ? "hidden" : "flex-1"} flex flex-col overflow-hidden bg-slate-950`}>
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-900">
            <div className="flex items-center gap-2">
              {window.innerWidth < 768 && (
                <button
                  onClick={() => setShowRightPanel(false)}
                  className="p-1 hover:bg-slate-800 rounded"
                >
                  <ChevronLeft size={20} className="text-slate-400" />
                </button>
              )}
              <h3 className="text-lg font-bold text-white">
                {selectedQuotation.doc_number}
              </h3>
            </div>
            <span className={`text-sm font-semibold px-3 py-1 rounded ${statusColor[selectedQuotation.status]}`}>
              {statusLabel[selectedQuotation.status]}
            </span>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            {/* Client Info */}
            <div className="bg-slate-800/50 rounded-lg p-4 mb-6 border border-slate-700">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-2">Cliente</p>
              <p className="text-base font-semibold text-white">{selectedQuotation.client_name}</p>
              <p className="text-sm text-slate-400 mt-1">📱 {selectedQuotation.client_phone}</p>
            </div>

            {/* Items */}
            <div className="mb-6">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-3">Artículos</p>
              <div className="space-y-2">
                {selectedQuotation.items?.map((item: any, i: number) => (
                  <div key={i} className="flex justify-between text-sm bg-slate-800/30 p-3 rounded border border-slate-700">
                    <span className="text-white">{item.desc || item.name || `Artículo ${i + 1}`}</span>
                    <span className="text-slate-400">
                      {item.cantidad || item.quantity}x RD$ {(item.precio || item.unitPrice || 0).toLocaleString("es-DO")}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Total */}
            <div className="bg-gradient-to-r from-blue-600/20 to-blue-500/10 rounded-lg p-4 border border-blue-500/30 mb-6">
              <p className="text-xs text-slate-400 uppercase tracking-wider mb-1">Total</p>
              <p className="text-2xl font-bold text-white">
                RD$ {selectedQuotation.total.toLocaleString("es-DO")}
              </p>
            </div>

            {/* PDF Preview Link */}
            {selectedQuotation.pdf_path && (
              <a
                href={`${getAPIUrl()}/api/invoices/pdf/${selectedQuotation.pdf_path.split("/").pop()}`}
                target="_blank"
                rel="noopener noreferrer"
                className="block w-full bg-slate-800 hover:bg-slate-700 text-center py-2 rounded border border-slate-700 text-white text-sm font-medium transition-colors mb-4"
              >
                <Download className="inline mr-2" size={16} />
                Descargar PDF
              </a>
            )}

            {/* Created Info */}
            <p className="text-xs text-slate-500 text-center">
              Creada el {new Date(selectedQuotation.created_at).toLocaleDateString("es-DO")} a las{" "}
              {new Date(selectedQuotation.created_at).toLocaleTimeString("es-DO", {
                hour: "2-digit",
                minute: "2-digit",
              })}
            </p>
          </div>

          {/* Actions */}
          {selectedQuotation.status === "draft" && (
            <div className="border-t border-slate-700 bg-slate-900 p-4 flex gap-3">
              <button
                onClick={handleApprove}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 rounded flex items-center justify-center gap-2 transition-colors"
              >
                <CheckCircle size={18} />
                Aprobar
              </button>
              <button className="flex-1 bg-red-600/20 hover:bg-red-600/30 text-red-400 font-semibold py-2 rounded flex items-center justify-center gap-2 transition-colors">
                <XCircle size={18} />
                Rechazar
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
