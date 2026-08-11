'use client';

import React from 'react';
import { NavTab } from './Header';
import { UserSession } from '@/lib/auth';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNuevoReporte: () => void;
  pendingFollowUpsCount?: number;
  userSession?: UserSession | null;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenNuevoReporte,
  pendingFollowUpsCount = 0,
  userSession,
}) => {
  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-lg border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around">
      {/* 📊 Inicio / Dashboard */}
      <button
        onClick={() => onSelectTab('dashboard')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'dashboard'
            ? 'text-brand-600 font-bold bg-brand-50'
            : 'text-slate-500 font-medium hover:text-slate-800'
        }`}
      >
        <span className="text-lg leading-none">📊</span>
        <span className="text-[10px] mt-0.5 font-bold">Inicio</span>
      </button>

      {/* 📁 Gestión */}
      <button
        onClick={() => onSelectTab('gestion')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'gestion'
            ? 'text-brand-600 font-bold bg-brand-50'
            : 'text-slate-500 font-medium hover:text-slate-800'
        }`}
      >
        <span className="text-lg leading-none">📁</span>
        <span className="text-[10px] mt-0.5 font-bold">Gestión</span>
      </button>

      {/* ➕ Central Botón Nuevo Reporte */}
      <button
        onClick={onOpenNuevoReporte}
        className="flex flex-col items-center justify-center -mt-5"
      >
        <div className="w-11 h-11 rounded-full bg-brand-600 text-white flex items-center justify-center shadow-lg shadow-brand-500/40 ring-4 ring-white active:scale-95 transition-transform text-lg font-bold">
          ➕
        </div>
        <span className="text-[10px] font-extrabold text-brand-700 mt-0.5">Nuevo</span>
      </button>

      {/* 🔔 Seguimientos */}
      <button
        onClick={() => onSelectTab('recordatorios')}
        className={`relative flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'recordatorios'
            ? 'text-brand-600 font-bold bg-brand-50'
            : 'text-slate-500 font-medium hover:text-slate-800'
        }`}
      >
        <span className="text-lg leading-none">🔔</span>
        <span className="text-[10px] mt-0.5 font-bold">Seguimiento</span>
        {pendingFollowUpsCount > 0 && (
          <span className="absolute top-0.5 right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-extrabold rounded-full flex items-center justify-center ring-2 ring-white animate-bounce">
            {pendingFollowUpsCount}
          </span>
        )}
      </button>

      {/* 📜 Historial */}
      <button
        onClick={() => onSelectTab('historial')}
        className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
          activeTab === 'historial'
            ? 'text-brand-600 font-bold bg-brand-50'
            : 'text-slate-500 font-medium hover:text-slate-800'
        }`}
      >
        <span className="text-lg leading-none">📜</span>
        <span className="text-[10px] mt-0.5 font-bold">Historial</span>
      </button>

      {/* 👥 Clientes (Solo Admin) */}
      {userSession?.rol?.includes('Administrador') && (
        <button
          onClick={() => onSelectTab('clientes')}
          className={`flex flex-col items-center justify-center py-1 px-2.5 rounded-xl transition-all ${
            activeTab === 'clientes'
              ? 'text-brand-600 font-bold bg-brand-50'
              : 'text-slate-500 font-medium hover:text-slate-800'
          }`}
        >
          <span className="text-lg leading-none">👥</span>
          <span className="text-[10px] mt-0.5 font-bold">Clientes</span>
        </button>
      )}
    </nav>
  );
};
