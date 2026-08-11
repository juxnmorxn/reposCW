'use client';

import React, { useState } from 'react';
import { NavTab } from './Header';
import { UserSession } from '@/lib/auth';
import {
  Home, LayoutList, Plus, Clock,
  MoreHorizontal, History, Users,
  Moon, Sun, Monitor, X,
} from 'lucide-react';
import { useTheme } from 'next-themes';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenNuevoReporte: () => void;
  pendingFollowUpsCount?: number;
  userSession?: UserSession | null;
}

const TABS: { id: NavTab; label: string; icon: React.ElementType }[] = [
  { id: 'dashboard', label: 'Inicio', icon: Home },
  { id: 'gestion', label: 'Reportes', icon: LayoutList },
  { id: 'recordatorios', label: 'Seguimiento', icon: Clock },
];

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onSelectTab,
  onOpenNuevoReporte,
  pendingFollowUpsCount = 0,
  userSession,
}) => {
  const [isMoreOpen, setIsMoreOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleTab = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMoreOpen(false);
  };

  const isMoreActive = ['historial', 'clientes'].includes(activeTab);

  return (
    <>
      {/* ────── FLOATING NAV ────── */}
      <nav className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-40 w-[92%] max-w-[380px]">
        <div className="bottom-nav-float rounded-[28px] px-4 py-3 flex items-center justify-between">

          {/* Left tabs */}
          {TABS.map(({ id, label, icon: Icon }) => {
            const isActive = activeTab === id;
            return (
              <button
                key={id}
                onClick={() => handleTab(id)}
                className="relative flex flex-col items-center justify-center gap-0.5 transition-all"
              >
                <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 ${
                  isActive
                    ? 'bg-[#ccff00] text-slate-900 shadow-lg shadow-[#ccff00]/25'
                    : 'text-white/50 hover:text-white/80'
                }`}>
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                </div>
                {isActive && (
                  <span className="text-[9px] font-bold text-[#ccff00] leading-none">{label}</span>
                )}
                {id === 'recordatorios' && pendingFollowUpsCount > 0 && (
                  <span className="absolute top-0.5 right-0.5 w-2.5 h-2.5 bg-rose-500 rounded-full ring-2 ring-[#0f1117] dark:ring-[#0f1117]" />
                )}
              </button>
            );
          })}

          {/* Center FAB */}
          <button
            onClick={onOpenNuevoReporte}
            className="w-14 h-14 -mt-6 flex items-center justify-center rounded-full bg-[#ccff00] text-slate-900 shadow-xl shadow-[#ccff00]/20 ring-4 ring-[#0f1117]/40 active:scale-95 transition-all"
          >
            <Plus className="w-7 h-7" strokeWidth={3} />
          </button>

          {/* Historial */}
          <button
            onClick={() => handleTab('historial')}
            className="relative flex flex-col items-center justify-center gap-0.5 transition-all"
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 ${
              activeTab === 'historial'
                ? 'bg-[#ccff00] text-slate-900 shadow-lg shadow-[#ccff00]/25'
                : 'text-white/50 hover:text-white/80'
            }`}>
              <History className="w-5 h-5" strokeWidth={activeTab === 'historial' ? 2.5 : 2} />
            </div>
            {activeTab === 'historial' && (
              <span className="text-[9px] font-bold text-[#ccff00] leading-none">Historial</span>
            )}
          </button>

          {/* More */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className="relative flex flex-col items-center justify-center gap-0.5 transition-all"
          >
            <div className={`w-10 h-10 flex items-center justify-center rounded-2xl transition-all duration-200 ${
              isMoreActive
                ? 'bg-[#ccff00] text-slate-900 shadow-lg shadow-[#ccff00]/25'
                : 'text-white/50 hover:text-white/80'
            }`}>
              <MoreHorizontal className="w-5 h-5" />
            </div>
          </button>
        </div>
      </nav>

      {/* ────── MORE BOTTOMSHEET ────── */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />

          {/* Sheet */}
          <div className="relative rounded-t-[32px] overflow-hidden animate-in slide-in-from-bottom duration-300"
            style={{
              background: 'rgba(26, 29, 39, 0.97)',
              backdropFilter: 'blur(32px)',
              WebkitBackdropFilter: 'blur(32px)',
              borderTop: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {/* Drag handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/20 rounded-full" />
            </div>

            {/* Header sheet */}
            <div className="flex items-center justify-between px-6 py-4">
              <h3 className="font-bold text-white text-xl">Más opciones</h3>
              <button
                onClick={() => setIsMoreOpen(false)}
                className="w-9 h-9 flex items-center justify-center rounded-full bg-white/10 text-white/70"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Navigation items */}
            <div className="px-5 space-y-2 pb-2">
              {userSession?.rol?.includes('Administrador') && (
                <button
                  onClick={() => handleTab('clientes')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${
                    activeTab === 'clientes'
                      ? 'bg-[#ccff00]/15 border border-[#ccff00]/30 text-[#ccff00]'
                      : 'bg-white/5 border border-white/5 text-white/80 hover:bg-white/10'
                  }`}
                >
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl ${
                    activeTab === 'clientes' ? 'bg-[#ccff00] text-slate-900' : 'bg-white/10'
                  }`}>
                    <Users className="w-6 h-6" />
                  </div>
                  <div className="text-left">
                    <p className="font-bold text-base">Directorio de Clientes</p>
                    <p className="text-xs text-white/50 font-normal">Gestión completa de clientes</p>
                  </div>
                </button>
              )}
            </div>

            {/* Theme section */}
            <div className="mx-5 mt-4 pt-4 border-t border-white/08">
              <p className="text-xs font-bold text-white/40 uppercase tracking-widest mb-3 px-1">Apariencia</p>
              <div className="flex gap-2 bg-white/5 p-1.5 rounded-2xl border border-white/05">
                {[
                  { value: 'light', label: 'Claro', Icon: Sun },
                  { value: 'dark', label: 'Oscuro', Icon: Moon },
                  { value: 'system', label: 'Auto', Icon: Monitor },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-3 rounded-xl text-xs font-bold transition-all ${
                      theme === value
                        ? 'bg-[#ccff00] text-slate-900 shadow-lg shadow-[#ccff00]/20'
                        : 'text-white/50 hover:text-white/70'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Safe area */}
            <div className="h-12" />
          </div>
        </div>
      )}
    </>
  );
};
