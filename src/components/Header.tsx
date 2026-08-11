'use client';

import React, { useState, useRef, useEffect } from 'react';
import { ISPLogo } from './ISPLogo';
import { UserSession } from '@/lib/auth';
import { getMonthAndWeekLabel } from '@/lib/db';
import {
  Database,
  Calendar,
  LayoutDashboard,
  PlusCircle,
  FolderKanban,
  Bell,
  History,
  ChevronDown,
  Clock,
  CalendarDays,
  Layers,
  User,
  LogOut,
} from 'lucide-react';

export type NavTab = 'dashboard' | 'crear' | 'gestion' | 'recordatorios' | 'historial' | 'clientes';

interface HeaderProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  modoFecha: 'diario' | 'fecha' | 'mes' | 'todos';
  onModoFechaChange: (modo: 'diario' | 'fecha' | 'mes' | 'todos') => void;
  fechaExacta: string;
  onFechaExactaChange: (fecha: string) => void;
  mesSeleccionado: string;
  onMesChange: (mes: string) => void;
  semanaDelMes: number;
  onSemanaDelMesChange: (semana: number) => void;
  año: number;
  isTursoLive?: boolean;
  pendingFollowUpsCount?: number;
  userSession: UserSession | null;
  onLogout: () => void;
  onOpenLogin: () => void;
}

const MESES = [
  'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
  'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
];

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onSelectTab,
  modoFecha,
  onModoFechaChange,
  fechaExacta,
  onFechaExactaChange,
  mesSeleccionado,
  onMesChange,
  semanaDelMes,
  onSemanaDelMesChange,
  año,
  isTursoLive = false,
  pendingFollowUpsCount = 0,
  userSession,
  onLogout,
  onOpenLogin,
}) => {
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const popoverRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        setIsDatePickerOpen(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getFechaLabel = () => {
    if (modoFecha === 'diario') return 'Hoy (Diario)';
    if (modoFecha === 'fecha') return fechaExacta;
    if (modoFecha === 'mes') return `${mesSeleccionado} - Sem. ${semanaDelMes}`;
    return 'Todo el Historial';
  };

  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-subtle">
      <div className="max-w-7xl mx-auto px-4 py-2.5 sm:px-6 flex items-center justify-between gap-3">
        {/* IZQUIERDA: Isotipo vector ISP + Nombre Repos ISP + Insignia Turso DB */}
        <div className="flex items-center gap-2.5 shrink-0">
          <ISPLogo size={36} />
          <div>
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-slate-900 text-base sm:text-lg tracking-tight leading-none">
                Repos ISP
              </h1>
              {isTursoLive ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-300">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  Turso Live
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-200">
                  <Database className="w-3 h-3" />
                  Turso DB
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-500 font-medium">Soporte Técnico & Redes</p>
          </div>
        </div>

        {/* CENTRO (DESKTOP): NAVBAR ÚNICA CON PESTAÑAS */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-100/90 p-1 rounded-2xl border border-slate-200">
          <button
            onClick={() => onSelectTab('dashboard')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'dashboard'
                ? 'bg-white text-brand-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span>Dashboard</span>
          </button>

          <button
            onClick={() => onSelectTab('crear')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'crear'
                ? 'bg-brand-600 text-white shadow-md shadow-brand-500/20'
                : 'bg-brand-50 text-brand-700 hover:bg-brand-100 border border-brand-200'
            }`}
          >
            <PlusCircle className="w-3.5 h-3.5" />
            <span>Crear Reporte</span>
          </button>

          <button
            onClick={() => onSelectTab('gestion')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'gestion'
                ? 'bg-white text-brand-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <FolderKanban className="w-3.5 h-3.5" />
            <span>Gestión de Reportes</span>
          </button>

          <button
            onClick={() => onSelectTab('recordatorios')}
            className={`relative inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'recordatorios'
                ? 'bg-white text-brand-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <Bell className="w-3.5 h-3.5" />
            <span>Seguimientos</span>
            {pendingFollowUpsCount > 0 && (
              <span className="w-4 h-4 bg-amber-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center">
                {pendingFollowUpsCount}
              </span>
            )}
          </button>

          {userSession?.rol?.includes('Administrador') && (
            <button
              onClick={() => onSelectTab('clientes')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                activeTab === 'clientes'
                  ? 'bg-white text-brand-600 shadow-sm border border-slate-200'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
              }`}
            >
              <User className="w-3.5 h-3.5" />
              <span>Clientes</span>
            </button>
          )}

          <button
            onClick={() => onSelectTab('historial')}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === 'historial'
                ? 'bg-white text-brand-600 shadow-sm border border-slate-200'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/50'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Historial</span>
          </button>
        </nav>

        {/* DERECHA: SELECTOR DE FECHA POPOVER & PERFIL DE USUARIO */}
        <div className="flex items-center gap-2">
          {/* POPOVER FILTRO DE FECHA */}
          <div className="relative" ref={popoverRef}>
            <button
              onClick={() => setIsDatePickerOpen(!isDatePickerOpen)}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-800 transition-colors"
            >
              <Calendar className="w-4 h-4 text-brand-600" />
              <span>{getFechaLabel()}</span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
            </button>

            {isDatePickerOpen && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-2xl border border-slate-200 shadow-modal p-3 z-50 space-y-3 animate-in fade-in zoom-in-95 duration-150">
                <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                  <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                    Filtro por Fecha
                  </span>
                  <span className="text-[11px] font-semibold text-brand-600">Actopan UTC-6</span>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    onClick={() => {
                      onModoFechaChange('diario');
                      setIsDatePickerOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      modoFecha === 'diario'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5" /> Hoy (Diario)
                  </button>

                  <button
                    onClick={() => onModoFechaChange('fecha')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      modoFecha === 'fecha'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <CalendarDays className="w-3.5 h-3.5" /> Por Fecha
                  </button>

                  <button
                    onClick={() => onModoFechaChange('mes')}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      modoFecha === 'mes'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5" /> Por Mes/Semana
                  </button>

                  <button
                    onClick={() => {
                      onModoFechaChange('todos');
                      setIsDatePickerOpen(false);
                    }}
                    className={`py-1.5 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1 transition-all ${
                      modoFecha === 'todos'
                        ? 'bg-brand-600 text-white shadow-sm'
                        : 'bg-slate-50 text-slate-700 hover:bg-slate-100 border border-slate-200'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" /> Todo
                  </button>
                </div>

                {modoFecha === 'fecha' && (
                  <div className="pt-2 border-t border-slate-100">
                    <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                      Selecciona la fecha:
                    </label>
                    <input
                      type="date"
                      value={fechaExacta}
                      onChange={(e) => {
                        onFechaExactaChange(e.target.value);
                        setIsDatePickerOpen(false);
                      }}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 cursor-pointer"
                    />
                  </div>
                )}

                {modoFecha === 'mes' && (
                  <div className="pt-2 border-t border-slate-100 space-y-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Selecciona el Mes:
                      </label>
                      <select
                        value={mesSeleccionado}
                        onChange={(e) => onMesChange(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-bold text-slate-800 focus:ring-2 focus:ring-brand-500 cursor-pointer"
                      >
                        {MESES.map((m) => (
                          <option key={m} value={m}>
                            {m} ({año})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-semibold text-slate-600 mb-1">
                        Semana del Mes:
                      </label>
                      <div className="grid grid-cols-4 gap-1">
                        {[1, 2, 3, 4].map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => {
                              onSemanaDelMesChange(s);
                              setIsDatePickerOpen(false);
                            }}
                            className={`py-1 rounded-lg text-xs font-bold transition-all ${
                              semanaDelMes === s
                                ? 'bg-brand-600 text-white'
                                : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                            }`}
                          >
                            Sem. {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* MENÚ DE PERFIL DE USUARIO / LOGIN / LOGOUT */}
          <div className="relative" ref={userMenuRef}>
            <button
              onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
              className="w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 flex items-center justify-center text-slate-700 transition-colors"
              title={userSession ? userSession.nombre : 'Iniciar Sesión'}
            >
              <User className="w-4 h-4 text-slate-600" />
            </button>

            {isUserMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-2xl border border-slate-200 shadow-modal p-3 z-50 space-y-2 animate-in fade-in zoom-in-95 duration-150">
                {userSession ? (
                  <>
                    <div className="px-2 py-1">
                      <p className="font-bold text-slate-900 text-xs sm:text-sm leading-tight">
                        {userSession.nombre}
                      </p>
                      <p className="text-[11px] text-slate-500 mt-0.5">{userSession.rol}</p>
                    </div>
                    <div className="border-t border-slate-100 pt-1">
                      <button
                        onClick={() => {
                          setIsUserMenuOpen(false);
                          onLogout();
                        }}
                        className="w-full text-left inline-flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-rose-600 hover:bg-rose-50 transition-colors"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        <span>Cerrar Sesión</span>
                      </button>
                    </div>
                  </>
                ) : (
                  <button
                    onClick={() => {
                      setIsUserMenuOpen(false);
                      onOpenLogin();
                    }}
                    className="w-full text-left inline-flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-bold text-brand-600 hover:bg-brand-50 transition-colors"
                  >
                    <User className="w-3.5 h-3.5" />
                    <span>Iniciar Sesión</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
