import React, { useState } from "react";
import { useAuth } from "../context/AuthContext";

const Login: React.FC = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await login(email, password);
      setPassword("");
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md space-y-8 rounded-2xl border border-slate-800 bg-slate-900/50 p-8 shadow-xl backdrop-blur-sm">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl border-2 border-[#c89b3c] bg-[#1f4340] shadow-lg">
            <span className="font-serif italic text-2xl font-semibold text-[#f6f3ec]">
              Pep
            </span>
          </div>
          <h2 className="font-serif italic text-3xl text-white">PepRD Panel</h2>
          <p className="mt-2 font-mono text-xs uppercase tracking-[0.2em] text-[#c89b3c]">
            Research Peptides · RD
          </p>
        </div>

        {error && (
          <div className="rounded border border-red-500/50 bg-red-500/10 px-4 py-3 text-red-300">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Correo
            </label>
            <input
              type="email"
              autoComplete="username"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-[#2d5f5a] focus:ring-1 focus:ring-[#2d5f5a] focus:outline-none"
              placeholder="correo@peprd.io"
              required
            />
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-slate-300">
              Contraseña
            </label>
            <input
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="block w-full rounded-xl border border-slate-700 bg-slate-800 px-4 py-3 text-white placeholder-slate-500 transition-all focus:border-[#2d5f5a] focus:ring-1 focus:ring-[#2d5f5a] focus:outline-none"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-gradient-to-r from-[#1f4340] to-[#2d5f5a] px-4 py-3 font-semibold text-[#f6f3ec] shadow-lg transition-all hover:scale-[1.01] hover:shadow-[#c89b3c]/30 disabled:opacity-50 disabled:hover:scale-100"
          >
            {loading ? "Iniciando sesión..." : "Iniciar Sesión"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
