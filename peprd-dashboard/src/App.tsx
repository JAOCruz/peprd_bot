import { NavLink, Route, Routes, Navigate } from 'react-router-dom';
import Dashboard from './pages/Dashboard';
import Orders from './pages/Orders';
import Clients from './pages/Clients';
import Products from './pages/Products';
import Messages from './pages/Messages';
import ChatTester from './pages/ChatTester';

export default function App() {
  return (
    <div className="min-h-screen flex">
      <aside className="w-60 bg-brand-600 text-white p-4 space-y-2">
        <h1 className="text-xl font-bold mb-6">🧁 Tasty Temptations</h1>
        <Nav to="/">Dashboard</Nav>
        <Nav to="/chat">💬 Chat Tester</Nav>
        <Nav to="/orders">Pedidos</Nav>
        <Nav to="/clients">Clientes</Nav>
        <Nav to="/products">Productos</Nav>
        <Nav to="/messages">Mensajes</Nav>
      </aside>
      <main className="flex-1 p-8">
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/chat" element={<ChatTester />} />
          <Route path="/orders" element={<Orders />} />
          <Route path="/clients" element={<Clients />} />
          <Route path="/products" element={<Products />} />
          <Route path="/messages" element={<Messages />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </div>
  );
}

function Nav({ to, children }: { to: string; children: React.ReactNode }) {
  return (
    <NavLink
      to={to}
      end
      className={({ isActive }) =>
        `block px-3 py-2 rounded ${isActive ? 'bg-brand-700' : 'hover:bg-brand-500'}`
      }
    >
      {children}
    </NavLink>
  );
}
