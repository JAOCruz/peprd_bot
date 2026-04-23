import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import {
  MessageCircle,
  Inbox,
  Users,
  Folder,
  Receipt,
  Package,
  LogOut,
  Menu,
  ChevronRight,
} from "lucide-react";

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const [isSidebarOpen, setSidebarOpen] = useState(true);
  const initial = (user?.name || user?.email || "U").charAt(0).toUpperCase();

  return (
    <div className="flex min-h-screen bg-slate-950 font-sans text-slate-200 selection:bg-[#c89b3c]/30">
      {/* SIDEBAR */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col border-r border-slate-800 bg-slate-900 transition-all duration-300 ${
          isSidebarOpen ? "w-64" : "w-20"
        }`}
      >
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-800 px-6">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border-2 border-[#c89b3c] bg-[#1f4340]">
            <span className="font-serif italic text-sm font-semibold text-[#f6f3ec]">
              Pep
            </span>
          </div>
          <span
            className={`ml-3 font-serif italic text-xl text-white transition-opacity duration-300 ${
              !isSidebarOpen && "hidden opacity-0"
            }`}
          >
            PepRD
          </span>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 px-3 py-5">
          <NavItem to="/dashboard/whatsapp"  icon={<MessageCircle size={19} />} label="WhatsApp"   isOpen={isSidebarOpen} />
          <NavItem to="/dashboard/messages"  icon={<Inbox size={19} />}         label="Mensajes"   isOpen={isSidebarOpen} />
          <NavItem to="/dashboard/clients"   icon={<Users size={19} />}         label="Clientes"   isOpen={isSidebarOpen} />
          <NavItem to="/dashboard/cases"     icon={<Folder size={19} />}        label="Pedidos"    isOpen={isSidebarOpen} />
          <NavItem to="/dashboard/quotes"    icon={<Receipt size={19} />}       label="Cotizaciones" isOpen={isSidebarOpen} />
          <NavItem to="/dashboard/inventory" icon={<Package size={19} />}       label="Inventario" isOpen={isSidebarOpen} />
        </nav>

        {/* User Footer */}
        <div className="border-t border-slate-800 p-4">
          <div
            className={`flex items-center gap-3 rounded-xl bg-slate-800/50 p-2 transition-all ${
              !isSidebarOpen && "justify-center"
            }`}
          >
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#c89b3c]/20 font-bold text-[#c89b3c]">
              {initial}
            </div>
            {isSidebarOpen && (
              <div className="min-w-0 overflow-hidden">
                <p className="truncate text-sm font-medium text-white">
                  {user?.name || user?.email}
                </p>
                <button
                  onClick={logout}
                  className="flex items-center gap-1 text-xs text-slate-400 transition-colors hover:text-red-400"
                >
                  <LogOut size={12} /> Cerrar sesión
                </button>
              </div>
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <div
        className={`flex min-h-screen flex-1 flex-col transition-all duration-300 ${
          isSidebarOpen ? "ml-64" : "ml-20"
        }`}
      >
        {/* Top Header */}
        <header className="sticky top-0 z-40 flex h-16 items-center justify-between border-b border-slate-800 bg-slate-900/80 px-6 backdrop-blur-md">
          <div className="flex items-center gap-4">
            <button
              onClick={() => setSidebarOpen(!isSidebarOpen)}
              className="rounded-lg p-2 text-slate-400 transition-colors hover:bg-slate-800"
            >
              <Menu size={20} />
            </button>
            <h2 className="flex items-center gap-2 text-sm font-medium text-slate-400">
              <span className="text-slate-500">Panel</span>
              <ChevronRight size={14} />
              <span className="text-slate-200">
                {isAdmin ? "Administración" : "Operaciones"}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-3">
            <span className="rounded-md border border-[#c89b3c]/30 bg-[#c89b3c]/10 px-2 py-1 font-mono text-[10px] uppercase tracking-widest text-[#c89b3c]">
              Research Use Only
            </span>
          </div>
        </header>

        {/* Content Body */}
        <main className="flex-1 overflow-x-hidden p-6">{children}</main>
      </div>
    </div>
  );
};

// Helper Component for Links
const NavItem = ({ to, icon, label, isOpen }: any) => (
  <NavLink
    to={to}
    className={({ isActive }) =>
      `flex items-center gap-3 rounded-xl px-3 py-2.5 transition-all duration-200 ${
        isActive
          ? "border border-[#c89b3c]/30 bg-[#c89b3c]/10 text-[#c89b3c] shadow-sm"
          : "text-slate-400 hover:bg-slate-800 hover:text-slate-200"
      } ${!isOpen && "justify-center px-2"}`
    }
  >
    {icon}
    {isOpen && <span className="text-sm font-medium">{label}</span>}
  </NavLink>
);

export default DashboardLayout;
