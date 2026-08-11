'use client';

import React, { useState } from 'react';
import { authenticateUser, UserSession } from '@/lib/auth';
import { ISPLogo } from './ISPLogo';
import { Lock, User, LogIn, AlertCircle } from 'lucide-react';

interface LoginScreenProps {
  isOpen: boolean;
  onLoginSuccess: (user: UserSession) => void;
  onClose?: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  isOpen,
  onLoginSuccess,
  onClose,
}) => {
  const [username, setUsername] = useState('soporte');
  const [password, setPassword] = useState('soporte123');
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    const user = authenticateUser(username, password);
    if (user) {
      onLoginSuccess(user);
    } else {
      setErrorMsg('Usuario o contraseña incorrectos');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/70 backdrop-blur-md">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-modal overflow-hidden border border-slate-100 p-6 space-y-6 animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado con Logotipo ISP */}
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <ISPLogo size={52} />
          </div>
          <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
            Repos ISP Support
          </h2>
          <p className="text-xs text-slate-500">
            Ingresa tus credenciales para acceder al sistema de reportes técnicos.
          </p>
        </div>

        {/* Mensaje de Error */}
        {errorMsg && (
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 flex items-center gap-2 text-xs text-rose-700 font-semibold">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Formulario de Login */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Usuario
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                required
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="ej. soporte o admin"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Contraseña
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-3 py-2.5 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              className="w-full inline-flex items-center justify-center gap-2 py-3 rounded-xl bg-brand-600 hover:bg-brand-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-brand-500/25 active:scale-95 transition-all"
            >
              <LogIn className="w-4 h-4" />
              <span>Iniciar Sesión</span>
            </button>
          </div>
        </form>

        <div className="text-center pt-2 border-t border-slate-100 text-[11px] text-slate-400">
          Repos ISP v2.0 • Credenciales demo: <span className="font-semibold text-slate-600">soporte / soporte123</span>
        </div>
      </div>
    </div>
  );
};
