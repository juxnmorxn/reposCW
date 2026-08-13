'use client';

import React, { useState } from 'react';
import { NavTab } from './Header';
import { UserSession } from '@/lib/auth';
import {
  Home, LayoutList, Plus, Clock,
  MoreHorizontal, History, Users, Layers,
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

  const isMoreActive = ['recordatorios', 'clientes', 'contrasenas'].includes(activeTab);

  const NavButton = ({ id, label, icon: Icon, badge }: { id: NavTab; label: string; icon: React.ElementType; badge?: number }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => handleTab(id)}
        className="relative flex flex-col items-center justify-center gap-0.5"
      >
        <div className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 ${
          isActive
            ? 'bg-slate-900 text-white dark:bg-[#ccff00] dark:text-[#0f1117] shadow-lg dark:shadow-[#ccff00]/30'
            : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/70'
        }`}>
          <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 1.8} />
        </div>
        {(badge ?? 0) > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center ring-2 ring-white dark:ring-[#1a1d27]">{badge}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ═══════ FLOATING BOTTOM NAV ═══════ */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-fit">
        <div
          className="rounded-[26px] px-3 py-2.5 flex items-center justify-between gap-1 sm:gap-3 bg-white/90 dark:bg-[#161923]/90 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 shadow-lg shadow-slate-200/50 dark:shadow-black/50"
        >
          {/* ── Left: Inicio ── */}
          <NavButton id="dashboard" label="Inicio" icon={Home} />

          {/* ── Left: Reportes ── */}
          <NavButton id="gestion" label="Reportes" icon={LayoutList} />

          {/* ═══ CENTER: FAB (+) ═══ */}
          <div className="relative w-[52px] h-11 mx-1 sm:mx-2 flex justify-center">
            <button
              onClick={onOpenNuevoReporte}
              className="absolute -top-6 w-[56px] h-[56px] flex items-center justify-center rounded-full bg-slate-900 dark:bg-slate-700 text-white shadow-xl ring-[4px] ring-white dark:ring-[#161923] active:scale-95 transition-transform"
            >
              <Plus className="w-7 h-7" strokeWidth={3} />
            </button>
          </div>

          {/* ── Right: Historial ── */}
          <NavButton id="historial" label="Historial" icon={History} />

          {/* ── Right: Más ── */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center"
          >
            <div className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 ${
              isMoreActive
                ? 'bg-slate-900 text-white dark:bg-[#ccff00] dark:text-[#0f1117] shadow-lg dark:shadow-[#ccff00]/30'
                : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/70'
            }`}>
              <MoreHorizontal className="w-[22px] h-[22px]" strokeWidth={1.8} />
            </div>
          </button>
        </div>
      </nav>

      {/* ═══════ MORE BOTTOMSHEET ═══════ */}
      {isMoreOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setIsMoreOpen(false)}
          />
          <div
            className="relative rounded-t-[28px] overflow-hidden animate-in slide-in-from-bottom duration-300 bg-white dark:bg-[#1a1d27] border-t border-slate-200 dark:border-white/10"
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-slate-300 dark:bg-white/15 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-6 py-3">
              <h3 className="font-bold text-slate-900 dark:text-white text-lg">Más opciones</h3>
              <button onClick={() => setIsMoreOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-slate-100 dark:bg-white/10 text-slate-500 dark:text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 space-y-2 pb-3">
              {/* Seguimiento */}
              <button
                onClick={() => handleTab('recordatorios')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold transition-all ${
                  activeTab === 'recordatorios'
                    ? 'bg-slate-900 text-white dark:bg-[#ccff00]/12 dark:border dark:border-[#ccff00]/25 dark:text-[#ccff00]'
                    : 'bg-slate-50 border border-slate-100 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-white/70 active:bg-slate-100 dark:active:bg-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'recordatorios' ? 'bg-slate-800 dark:bg-[#ccff00] text-white dark:text-[#0f1117]' : 'bg-slate-200 dark:bg-white/8'
                }`}>
                  <Clock className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Seguimiento de Calidad</p>
                  <p className={`text-[11px] font-normal ${activeTab === 'recordatorios' ? 'text-slate-300 dark:text-white/40' : 'text-slate-500 dark:text-white/40'}`}>Verificación post-soporte</p>
                </div>
              </button>

              {/* Clientes */}
              {userSession?.rol?.includes('Administrador') && (
                <button
                  onClick={() => handleTab('clientes')}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold transition-all ${
                    activeTab === 'clientes'
                      ? 'bg-slate-900 text-white dark:bg-[#ccff00]/12 dark:border dark:border-[#ccff00]/25 dark:text-[#ccff00]'
                      : 'bg-slate-50 border border-slate-100 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-white/70 active:bg-slate-100 dark:active:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeTab === 'clientes' ? 'bg-slate-800 dark:bg-[#ccff00] text-white dark:text-[#0f1117]' : 'bg-slate-200 dark:bg-white/8'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Directorio de Clientes</p>
                    <p className={`text-[11px] font-normal ${activeTab === 'clientes' ? 'text-slate-300 dark:text-white/40' : 'text-slate-500 dark:text-white/40'}`}>Gestión completa del catálogo</p>
                  </div>
                </button>
              )}

              {/* Contraseñas */}
              <button
                onClick={() => handleTab('contrasenas')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold transition-all ${
                  activeTab === 'contrasenas'
                    ? 'bg-slate-900 text-white dark:bg-[#ccff00]/12 dark:border dark:border-[#ccff00]/25 dark:text-[#ccff00]'
                    : 'bg-slate-50 border border-slate-100 text-slate-700 dark:bg-white/5 dark:border-white/5 dark:text-white/70 active:bg-slate-100 dark:active:bg-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'contrasenas' ? 'bg-slate-800 dark:bg-[#ccff00] text-white dark:text-[#0f1117]' : 'bg-slate-200 dark:bg-white/8'
                }`}>
                  <Layers className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Gestión de Contraseñas</p>
                  <p className={`text-[11px] font-normal ${activeTab === 'contrasenas' ? 'text-slate-300 dark:text-white/40' : 'text-slate-500 dark:text-white/40'}`}>Cuentas, Winbox, Antenas</p>
                </div>
              </button>
            </div>

            {/* Theme */}
            <div className="mx-5 mt-2 pt-4 border-t border-slate-200 dark:border-white/10">
              <p className="text-[10px] font-bold text-slate-400 dark:text-white/30 uppercase tracking-widest mb-3">Apariencia</p>
              <div className="flex gap-1.5 bg-slate-100 dark:bg-white/5 p-1 rounded-2xl border border-slate-200 dark:border-white/5">
                {[
                  { value: 'light', label: 'Claro', Icon: Sun },
                  { value: 'dark', label: 'Oscuro', Icon: Moon },
                  { value: 'system', label: 'Auto', Icon: Monitor },
                ].map(({ value, label, Icon }) => (
                  <button
                    key={value}
                    onClick={() => setTheme(value)}
                    className={`flex-1 flex flex-col items-center gap-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                      theme === value
                        ? 'bg-white text-slate-900 shadow dark:bg-[#ccff00] dark:text-[#0f1117] dark:shadow-lg dark:shadow-[#ccff00]/20'
                        : 'text-slate-500 hover:text-slate-700 dark:text-white/40 dark:hover:text-white/60'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-10" />
          </div>
        </div>
      )}
    </>
  );
};
