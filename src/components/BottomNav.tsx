'use client';

import React, { useState } from 'react';
import { NavTab } from './Header';
import { UserSession } from '@/lib/auth';
import { Home, LayoutList, Plus, Clock, MoreHorizontal, History, Users, Moon, Sun, Monitor, LogOut, X } from 'lucide-react';
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
  const [isMoreMenuOpen, setIsMoreMenuOpen] = useState(false);
  const { theme, setTheme } = useTheme();

  const handleSelect = (tab: NavTab) => {
    onSelectTab(tab);
    setIsMoreMenuOpen(false);
  };

  const activeColor = 'text-[#BFFF00] dark:text-[#ccff00] font-bold bg-[#BFFF00]/10 dark:bg-[#ccff00]/10'; // Lime green highlight
  const inactiveColor = 'text-slate-500 dark:text-slate-400 font-medium hover:text-slate-800 dark:hover:text-slate-200';

  return (
    <>
      {/* Floating Bottom Nav */}
      <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-40 w-[90%] max-w-sm">
        <nav className="bg-slate-900/80 dark:bg-slate-950/80 backdrop-blur-xl border border-slate-700 shadow-2xl rounded-3xl px-3 py-2 flex items-center justify-between relative">
          
          {/* Inicio */}
          <button
            onClick={() => handleSelect('dashboard')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${activeTab === 'dashboard' ? activeColor : inactiveColor}`}
          >
            <Home className="w-6 h-6" strokeWidth={activeTab === 'dashboard' ? 2.5 : 2} />
          </button>

          {/* Gestión */}
          <button
            onClick={() => handleSelect('gestion')}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${activeTab === 'gestion' ? activeColor : inactiveColor}`}
          >
            <LayoutList className="w-6 h-6" strokeWidth={activeTab === 'gestion' ? 2.5 : 2} />
          </button>

          {/* Botón Central Nuevo */}
          <button
            onClick={onOpenNuevoReporte}
            className="flex flex-col items-center justify-center -mt-8 relative"
          >
            <div className="w-14 h-14 rounded-full bg-[#BFFF00] dark:bg-[#ccff00] text-slate-900 dark:text-white flex items-center justify-center shadow-lg shadow-[#BFFF00]/20 ring-4 ring-slate-900 active:scale-95 transition-transform font-bold">
              <Plus className="w-8 h-8" strokeWidth={3} />
            </div>
          </button>

          {/* Seguimientos */}
          <button
            onClick={() => handleSelect('recordatorios')}
            className={`relative flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${activeTab === 'recordatorios' ? activeColor : inactiveColor}`}
          >
            <Clock className="w-6 h-6" strokeWidth={activeTab === 'recordatorios' ? 2.5 : 2} />
            {pendingFollowUpsCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-rose-500 rounded-full ring-2 ring-slate-900 animate-pulse"></span>
            )}
          </button>

          {/* Menú Más */}
          <button
            onClick={() => setIsMoreMenuOpen(true)}
            className={`flex flex-col items-center justify-center p-2 rounded-2xl transition-all ${['historial', 'clientes'].includes(activeTab) || isMoreMenuOpen ? activeColor : inactiveColor}`}
          >
            <MoreHorizontal className="w-6 h-6" strokeWidth={isMoreMenuOpen ? 2.5 : 2} />
          </button>
        </nav>
      </div>

      {/* Menú "Más" Desplegable (BottomSheet) */}
      {isMoreMenuOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex flex-col justify-end">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={() => setIsMoreMenuOpen(false)}></div>
          <div className="bg-white dark:bg-slate-900 rounded-t-3xl p-6 relative animate-in slide-in-from-bottom duration-300 border-t border-slate-200 dark:border-slate-800">
            <button 
              onClick={() => setIsMoreMenuOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-100 dark:bg-slate-800 rounded-full text-slate-500 dark:text-slate-400"
            >
              <X className="w-5 h-5" />
            </button>
            <h3 className="font-bold text-lg mb-6 text-slate-900 dark:text-white">Más Opciones</h3>
            
            <div className="space-y-2">
              <button
                onClick={() => handleSelect('historial')}
                className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'historial' ? 'bg-[#BFFF00]/10 dark:bg-[#ccff00]/10 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
              >
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === 'historial' ? 'bg-[#BFFF00] dark:bg-[#ccff00] text-slate-900 dark:text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                  <History className="w-5 h-5" />
                </div>
                Historial de Reportes
              </button>

              {userSession?.rol?.includes('Administrador') && (
                <button
                  onClick={() => handleSelect('clientes')}
                  className={`w-full flex items-center gap-4 p-4 rounded-2xl font-bold transition-all ${activeTab === 'clientes' ? 'bg-[#BFFF00]/10 dark:bg-[#ccff00]/10 text-slate-900 dark:text-white' : 'bg-slate-50 dark:bg-slate-800/50 text-slate-700 dark:text-slate-300'}`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${activeTab === 'clientes' ? 'bg-[#BFFF00] dark:bg-[#ccff00] text-slate-900 dark:text-white' : 'bg-slate-200 dark:bg-slate-700'}`}>
                    <Users className="w-5 h-5" />
                  </div>
                  Directorio de Clientes
                </button>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
              <h4 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-3">Apariencia</h4>
              <div className="flex gap-2 bg-slate-100 dark:bg-slate-800 p-1.5 rounded-2xl">
                <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${theme === 'light' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Sun className="w-4 h-4" /> Claro
                </button>
                <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${theme === 'dark' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Moon className="w-4 h-4" /> Oscuro
                </button>
                <button onClick={() => setTheme('system')} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all ${theme === 'system' ? 'bg-white dark:bg-slate-700 shadow text-slate-900 dark:text-white' : 'text-slate-500 dark:text-slate-400'}`}>
                  <Monitor className="w-4 h-4" /> Auto
                </button>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-slate-200 dark:border-slate-800">
               <button
                  onClick={() => {
                    // Logic to close session or refresh 
                    window.location.reload(); 
                  }}
                  className="w-full flex items-center justify-center gap-2 p-4 rounded-2xl font-bold bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400"
                >
                  <LogOut className="w-5 h-5" />
                  Cerrar Sesión / Recargar
                </button>
            </div>
            
          </div>
        </div>
      )}
    </>
  );
};
