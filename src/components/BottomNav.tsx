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

  const NavButton = ({ id, label, icon: Icon, badge }: { id: NavTab; label: string; icon: React.ElementType; badge?: number }) => {
    const isActive = activeTab === id;
    return (
      <button
        onClick={() => handleTab(id)}
        className="relative flex flex-col items-center justify-center gap-0.5"
      >
        <div className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 ${
          isActive
            ? 'bg-[#ccff00] text-[#0f1117] shadow-lg shadow-[#ccff00]/30'
            : 'text-slate-400 dark:text-white/40'
        }`}>
          <Icon className="w-[22px] h-[22px]" strokeWidth={isActive ? 2.5 : 1.8} />
        </div>
        {badge && badge > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 text-[9px] font-bold bg-rose-500 text-white rounded-full flex items-center justify-center ring-2 ring-[#1a1d27]">{badge}</span>
        )}
      </button>
    );
  };

  return (
    <>
      {/* ═══════ FLOATING BOTTOM NAV ═══════ */}
      <nav className="md:hidden fixed bottom-4 left-1/2 -translate-x-1/2 z-40 w-[88%] max-w-[360px]">
        <div
          className="rounded-[26px] px-3 py-2.5 flex items-center justify-between"
          style={{
            background: 'rgba(22, 25, 35, 0.92)',
            backdropFilter: 'blur(24px) saturate(180%)',
            WebkitBackdropFilter: 'blur(24px) saturate(180%)',
            border: '1px solid rgba(255,255,255,0.08)',
            boxShadow: '0 8px 40px rgba(0,0,0,0.5), 0 0 0 0.5px rgba(255,255,255,0.05) inset',
          }}
        >
          {/* ── Left: Inicio ── */}
          <NavButton id="dashboard" label="Inicio" icon={Home} />

          {/* ── Left: Reportes ── */}
          <NavButton id="gestion" label="Reportes" icon={LayoutList} />

          {/* ═══ CENTER: FAB (+) ═══ */}
          <button
            onClick={onOpenNuevoReporte}
            className="w-[52px] h-[52px] -mt-7 flex items-center justify-center rounded-full bg-[#ccff00] text-[#0f1117] shadow-xl shadow-[#ccff00]/30 ring-[3px] ring-[#161923] active:scale-90 transition-transform"
          >
            <Plus className="w-7 h-7" strokeWidth={3} />
          </button>

          {/* ── Right: Seguimiento ── */}
          <NavButton id="recordatorios" label="Seguimiento" icon={Clock} badge={pendingFollowUpsCount} />

          {/* ── Right: Más ── */}
          <button
            onClick={() => setIsMoreOpen(true)}
            className="flex flex-col items-center justify-center"
          >
            <div className={`w-11 h-11 flex items-center justify-center rounded-2xl transition-all duration-200 ${
              isMoreActive
                ? 'bg-[#ccff00] text-[#0f1117] shadow-lg shadow-[#ccff00]/30'
                : 'text-slate-400 dark:text-white/40'
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
            className="relative rounded-t-[28px] overflow-hidden animate-in slide-in-from-bottom duration-300"
            style={{
              background: '#1a1d27',
              borderTop: '1px solid rgba(255,255,255,0.08)',
            }}
          >
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-white/15 rounded-full" />
            </div>

            <div className="flex items-center justify-between px-6 py-3">
              <h3 className="font-bold text-white text-lg">Más opciones</h3>
              <button onClick={() => setIsMoreOpen(false)} className="w-8 h-8 flex items-center justify-center rounded-full bg-white/8 text-white/60">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="px-5 space-y-2 pb-3">
              {/* Historial */}
              <button
                onClick={() => handleTab('historial')}
                className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold transition-all ${
                  activeTab === 'historial'
                    ? 'bg-[#ccff00]/12 border border-[#ccff00]/25 text-[#ccff00]'
                    : 'bg-white/5 border border-white/5 text-white/70 active:bg-white/10'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                  activeTab === 'historial' ? 'bg-[#ccff00] text-[#0f1117]' : 'bg-white/8'
                }`}>
                  <History className="w-5 h-5" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-bold">Historial de Reportes</p>
                  <p className="text-[11px] text-white/40 font-normal">Exportación y registros pasados</p>
                </div>
              </button>

              {/* Clientes */}
              {userSession?.rol?.includes('Administrador') && (
                <button
                  onClick={() => handleTab('clientes')}
                  className={`w-full flex items-center gap-3 p-3.5 rounded-2xl font-bold transition-all ${
                    activeTab === 'clientes'
                      ? 'bg-[#ccff00]/12 border border-[#ccff00]/25 text-[#ccff00]'
                      : 'bg-white/5 border border-white/5 text-white/70 active:bg-white/10'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                    activeTab === 'clientes' ? 'bg-[#ccff00] text-[#0f1117]' : 'bg-white/8'
                  }`}>
                    <Users className="w-5 h-5" />
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-bold">Directorio de Clientes</p>
                    <p className="text-[11px] text-white/40 font-normal">Gestión completa del catálogo</p>
                  </div>
                </button>
              )}
            </div>

            {/* Theme */}
            <div className="mx-5 mt-2 pt-4 border-t border-white/8">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest mb-3">Apariencia</p>
              <div className="flex gap-1.5 bg-white/5 p-1 rounded-2xl border border-white/5">
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
                        ? 'bg-[#ccff00] text-[#0f1117] shadow-lg shadow-[#ccff00]/20'
                        : 'text-white/40'
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
