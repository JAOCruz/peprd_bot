import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import DashboardLayout from "../components/dashboard/DashboardLayout";
import WhatsAppBot from "./WhatsAppBot";
import BotMessages from "./BotMessages";
import BotClients from "./BotClients";
import ClientDetail from "./ClientDetail";
import Cases from "./Cases";
import Cotizaciones from "./Cotizaciones";
import Inventory from "./Inventory";

const Dashboard: React.FC = () => {
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/whatsapp" element={<WhatsAppBot />} />
        <Route path="/messages" element={<BotMessages />} />
        <Route path="/clients" element={<BotClients />} />
        <Route path="/clients/:id" element={<ClientDetail />} />
        <Route path="/cases" element={<Cases />} />
        <Route path="/quotes" element={<Cotizaciones />} />
        <Route path="/inventory" element={<Inventory />} />
        <Route path="*" element={<Navigate to="/dashboard/whatsapp" replace />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
