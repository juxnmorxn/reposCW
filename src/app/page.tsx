'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Reporte, ResultadoSeguimiento } from '@/lib/types';
import { getWeekAndYear, getLocalDateString, getMonthAndWeekLabel } from '@/lib/db';
import { getActiveSession, clearActiveSession, UserSession } from '@/lib/auth';
import { Header, NavTab } from '@/components/Header';
import { BottomNav } from '@/components/BottomNav';
import { FollowUpBanner } from '@/components/FollowUpBanner';
import { ReportCard } from '@/components/ReportCard';
import { ReportFormModal } from '@/components/ReportFormModal';
import { ReportPreviewModal } from '@/components/ReportPreviewModal';
import { PDFExportModal } from '@/components/PDFExportModal';
import { LoginScreen } from '@/components/LoginScreen';
import { ClientManagement } from '@/components/ClientManagement';
import { PasswordManagement } from '@/components/PasswordManagement';
import {
  Plus,
  FileDown,
  Search,
  CheckCircle2,
  Clock,
  XCircle,
  BarChart3,
  Filter,
  RefreshCw,
  Inbox,
  Calendar as CalendarIcon,
  Wrench,
  Settings,
  PhoneCall,
  FileText,
  HelpCircle,
  Layers,
  History as HistoryIcon,
} from 'lucide-react';

function DashboardContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const activeTabParam = searchParams.get('tab') as NavTab;

  const todayStr = getLocalDateString();
  const { semana: currentWeek, año: currentYear } = getWeekAndYear(todayStr);
  const { mesNombre: currentMonth, semanaMes: currentWeekOfMonth } = getMonthAndWeekLabel(todayStr);

  const [userSession, setUserSession] = useState<UserSession | null>(null);
  const [isLoginOpen, setIsLoginOpen] = useState(false);

  const [activeTabLocal, setActiveTabLocal] = useState<NavTab>('dashboard');
  
  // Sincronizar estado local con la URL
  useEffect(() => {
    if (activeTabParam && ['dashboard', 'crear', 'gestion', 'recordatorios', 'historial', 'clientes', 'contrasenas'].includes(activeTabParam)) {
      setActiveTabLocal(activeTabParam);
    }
  }, [activeTabParam]);

  const activeTab = activeTabParam || activeTabLocal;

  const handleTabChange = (tab: NavTab) => {
    setActiveTabLocal(tab);
    const params = new URLSearchParams(searchParams.toString());
    params.set('tab', tab);
    router.push(`/?${params.toString()}`);
  };

  const [modoFecha, setModoFecha] = useState<'diario' | 'fecha' | 'mes' | 'todos'>('diario');
  const [fechaExacta, setFechaExacta] = useState<string>(todayStr);
  const [mesSeleccionado, setMesSeleccionado] = useState<string>(currentMonth);
  const [semanaDelMes, setSemanaDelMes] = useState<number>(currentWeekOfMonth);
  const [semana, setSemana] = useState<number>(currentWeek);
  const [año, setAño] = useState<number>(currentYear);

  const [reportes, setReportes] = useState<Reporte[]>([]);
  const [loading, setLoading] = useState(true);
  const [isTursoLive, setIsTursoLive] = useState(false);

  // Filtros de Gestión
  const [tipoFiltro, setTipoFiltro] = useState<string>('todos');
  const [estadoFiltro, setEstadoFiltro] = useState<string>('todos');
  const [busqueda, setBusqueda] = useState('');

  // Modales
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReporte, setEditingReporte] = useState<Reporte | null>(null);
  
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewReporte, setPreviewReporte] = useState<Reporte | null>(null);

  const [isPDFModalOpen, setIsPDFModalOpen] = useState(false);

  useEffect(() => {
    // Inicializar sesión de usuario
    const session = getActiveSession();
    setUserSession(session);
  }, []);

  // Cargar reportes desde Turso DB
  const loadData = async () => {
    setLoading(true);
    try {
      let queryUrl = `/api/reportes?tipo=${tipoFiltro}&estado=${estadoFiltro}&busqueda=${encodeURIComponent(
        busqueda
      )}`;

      if (activeTab === 'historial' || activeTab === 'gestion' || modoFecha === 'todos') {
        queryUrl += `&año=${año}`;
      } else if (modoFecha === 'diario') {
        queryUrl += `&fechaExacta=${todayStr}`;
      } else if (modoFecha === 'fecha') {
        queryUrl += `&fechaExacta=${fechaExacta}`;
      } else if (modoFecha === 'mes') {
        queryUrl += `&semana=${semana}&año=${año}`;
      }

      const res = await fetch(queryUrl);
      if (res.ok) {
        const json = await res.json();
        setReportes(json.data || []);
        setIsTursoLive(true);
      }
    } catch (err) {
      console.error('Error cargando reportes:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [semana, año, modoFecha, fechaExacta, mesSeleccionado, semanaDelMes, tipoFiltro, estadoFiltro, busqueda, activeTab]);

  // Manejar guardar / editar
  const handleSaveReporte = async (data: Omit<Reporte, 'id'> | Reporte) => {
    try {
      const payload: any = { ...data };
      if (typeof payload.firma_cliente === 'string' && payload.firma_cliente.startsWith('data:image')) {
        payload.firma_cliente = null;
      }
      const method = 'id' in data && data.id ? 'PUT' : 'POST';
      const res = await fetch('/api/reportes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        await loadData();
        handleTabChange('gestion');
      }
    } catch (err) {
      console.error('Error guardando reporte:', err);
    }
  };

  // Manejar seguimiento
  const handleMarcarSeguimiento = async (id: number, resultado: ResultadoSeguimiento) => {
    try {
      const res = await fetch('/api/reportes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id,
          seguimiento_realizado: 1,
          fecha_seguimiento: todayStr,
          resultado_seguimiento: resultado,
        }),
      });

      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Error actualizando seguimiento:', err);
    }
  };

  // Manejar eliminar
  const handleDeleteReporte = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar este registro de Turso DB?')) return;
    try {
      const res = await fetch(`/api/reportes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      }
    } catch (err) {
      console.error('Error eliminando:', err);
    }
  };

  // Métricas KPI
  const total = reportes.length;
  const completados = reportes.filter((r) => r.estado === 'Completado' || r.estado === 'Resuelto').length;
  const pendientes = reportes.filter((r) => r.estado === 'Pendiente' || r.estado === 'En Proceso').length;
  const noCompletados = reportes.filter((r) => r.estado === 'No Completado' || r.estado === 'Rechazado').length;

  const pendingFollowUps = reportes.filter(
    (r) => (r.estado === 'Completado' || r.estado === 'Resuelto') && !r.seguimiento_realizado
  );

  return (
    <div className="min-h-screen flex flex-col pb-28 md:pb-8">
      {/* BARRA SUPERIOR ÚNICA "REPOS ISP" */}
      <Header
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'crear') {
            setEditingReporte(null);
            setIsModalOpen(true);
          } else {
            handleTabChange(tab);
          }
        }}
        modoFecha={modoFecha}
        onModoFechaChange={(modo) => setModoFecha(modo)}
        fechaExacta={fechaExacta}
        onFechaExactaChange={(f) => setFechaExacta(f)}
        mesSeleccionado={mesSeleccionado}
        onMesChange={(m) => setMesSeleccionado(m)}
        semanaDelMes={semanaDelMes}
        onSemanaDelMesChange={(s) => setSemanaDelMes(s)}
        año={año}
        isTursoLive={isTursoLive}
        pendingFollowUpsCount={pendingFollowUps.length}
        userSession={userSession}
        onLogout={() => {
          clearActiveSession();
          setUserSession(null);
          setIsLoginOpen(true);
        }}
        onOpenLogin={() => setIsLoginOpen(true)}
      />

      {/* MOBILE MINI TOPBAR (visible only on mobile) */}
      <div className="md:hidden sticky top-0 z-30 header-glass px-4 py-2.5 flex items-center justify-between gap-2 border-b border-slate-200/60 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-brand-600 flex items-center justify-center shrink-0 shadow-sm">
            <span className="text-white text-xs font-extrabold">ISP</span>
          </div>
          <div>
            <p className="font-extrabold text-sm text-slate-900 dark:text-white leading-none">Repos ISP</p>
            {userSession && (
              <p className="text-[10px] text-slate-500 dark:text-slate-400 leading-none mt-0.5">{userSession.nombre}</p>
            )}
          </div>
        </div>

        {/* Filtro de Fecha Rápido para Móvil */}
        <div className="flex items-center gap-2">
          <select
            value={modoFecha}
            onChange={(e) => setModoFecha(e.target.value as any)}
            className="bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-800 dark:text-slate-100 text-[11px] font-bold rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
          >
            <option value="diario">📅 Hoy</option>
            <option value="fecha">📆 Fecha</option>
            <option value="mes">🗓️ Mes</option>
            <option value="todos">♾️ Todos</option>
          </select>
        </div>
      </div>

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 space-y-6 flex-1">
        {/* ======================================================== */}
        {/* VISTA 1: DASHBOARD PRINCIPAL                             */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* TARJETAS KPI (SOLO EN DASHBOARD) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                  Resumen Ejecutivo
                </h2>
                <div className="flex items-center gap-3">
                  {userSession && (
                    <span className="text-xs font-semibold text-brand-600">
                      Usuario: {userSession.nombre}
                    </span>
                  )}
                </div>
              </div>
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <button
                  type="button"
                  onClick={() => {
                    setEstadoFiltro('todos');
                    handleTabChange('gestion');
                  }}
                  className="text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none hover:border-brand-500 transition-all flex items-center justify-between active:scale-95"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Actividades</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{total}</h4>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEstadoFiltro('Completado');
                    handleTabChange('gestion');
                  }}
                  className="text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none hover:border-emerald-500 transition-all flex items-center justify-between active:scale-95"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completados</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">{completados}</h4>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEstadoFiltro('Pendiente');
                    handleTabChange('gestion');
                  }}
                  className="text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none hover:border-amber-500 transition-all flex items-center justify-between active:scale-95"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pendientes</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">{pendientes}</h4>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setEstadoFiltro('No Completado');
                    handleTabChange('gestion');
                  }}
                  className="text-left bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none hover:border-rose-500 transition-all flex items-center justify-between active:scale-95"
                >
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No Completados</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">{noCompletados}</h4>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                </button>
              </div>
            </div>

            {/* SECCIÓN RESUMEN DIARIO & BOTÓN EXPORTAR */}
            <div className="flex items-center justify-between bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none">
              <div>
                <h3 className="font-bold text-slate-900 dark:text-white text-sm sm:text-base flex items-center gap-2">
                  <CalendarIcon className="w-4 h-4 text-brand-600" />
                  Actividades del Día ({todayStr})
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  {reportes.length} actividad{reportes.length !== 1 ? 'es' : ''} registrada{reportes.length !== 1 ? 's' : ''} hoy en Turso DB.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsPDFModalOpen(true)}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
                >
                  <FileDown className="w-4 h-4" />
                  <span>Exportar PDF</span>
                </button>
              </div>
            </div>

            {/* LISTA DE ACTIVIDADES DEL DÍA */}
            <div className="space-y-4">
              {loading ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cargando actividades del día...</p>
                </div>
              ) : reportes.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No hay actividades registradas hoy</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Aún no se han registrado actividades para el día de hoy ({todayStr}).
                  </p>
                  <button
                    onClick={() => {
                      setEditingReporte(null);
                      setIsModalOpen(true);
                    }}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 text-white text-xs font-bold"
                  >
                    <Plus className="w-4 h-4" />
                    Crear Primer Reporte
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportes.slice(0, 6).map((reporte) => (
                    <ReportCard
                      key={reporte.id}
                      reporte={reporte}
                      onClick={(r) => {
                        setPreviewReporte(r);
                        setIsPreviewOpen(true);
                      }}
                      onEdit={(r) => {
                        setEditingReporte(r);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDeleteReporte}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 2: GESTIÓN DE REPORTES (FILTROS + BÚSQUEDA)        */}
        {/* ======================================================== */}
        {activeTab === 'gestion' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                  Gestión y Búsqueda de Reportes
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Filtra, busca, edita o elimina reportes almacenados en Turso DB.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    setEditingReporte(null);
                    setIsModalOpen(true);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
                >
                  <Plus className="w-4 h-4" />
                  <span>Crear Reporte</span>
                </button>
              </div>
            </div>

            {/* BARRA DE FILTROS & BÚSQUEDA */}
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none space-y-3">
              <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
                {/* Buscador */}
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                  <input
                    type="text"
                    placeholder="Buscar por cliente, problema, equipo o técnico..."
                    value={busqueda}
                    onChange={(e) => setBusqueda(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500"
                  />
                </div>

                {/* Filtro por Estado */}
                <div className="flex items-center gap-2 shrink-0">
                  <Filter className="w-4 h-4 text-slate-400 hidden sm:inline-block" />
                  <select
                    value={estadoFiltro}
                    onChange={(e) => setEstadoFiltro(e.target.value)}
                    className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-brand-500 cursor-pointer"
                  >
                    <option value="todos">Todos los Estados</option>
                    <option value="Completado">Completados</option>
                    <option value="Pendiente">Pendientes</option>
                    <option value="En Proceso">En Proceso</option>
                    <option value="No Completado">No Completados</option>
                  </select>
                </div>
              </div>

              {/* Categorías: Dropdown en Móvil & Horizontal Pills en Desktop */}
              <div className="pt-1">
                <div className="md:hidden">
                  <select
                    value={tipoFiltro}
                    onChange={(e) => setTipoFiltro(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs font-bold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 cursor-pointer shadow-subtle"
                  >
                    <option value="todos">Todas las Actividades</option>
                    <option value="soporte">Soporte Técnico</option>
                    <option value="libre">Actividades Libres</option>
                  </select>
                </div>

                <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar bg-slate-50 dark:bg-slate-800/40 p-1.5 rounded-xl border border-slate-200/60 dark:border-slate-800">
                  <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider pl-1 shrink-0">Tipo:</span>
                  {[
                    { id: 'todos', label: 'Todas', icon: Layers },
                    { id: 'soporte', label: 'Soporte Técnico', icon: Wrench },
                    { id: 'libre', label: 'Actividad Libre', icon: FileText },
                  ].map((cat) => {
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setTipoFiltro(cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                          tipoFiltro === cat.id
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-800 border border-slate-200/80 dark:border-slate-700'
                        }`}
                      >
                        <IconComp className="w-3.5 h-3.5" />
                        <span>{cat.label}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* LISTA COMPLETA DE REGISTROS */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-600 dark:text-slate-300">
                  Resultados encontrados ({reportes.length})
                </span>
                <button
                  onClick={loadData}
                  className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
                  Sincronizar
                </button>
              </div>

              {loading ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                  <RefreshCw className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
                  <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cargando reportes...</p>
                </div>
              ) : reportes.length === 0 ? (
                <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                  <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                    <Inbox className="w-5 h-5" />
                  </div>
                  <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No se encontraron reportes</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                    Ajusta los filtros de búsqueda o registra una nueva actividad.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {reportes.map((reporte) => (
                    <ReportCard
                      key={reporte.id}
                      reporte={reporte}
                      onClick={(r) => {
                        setPreviewReporte(r);
                        setIsPreviewOpen(true);
                      }}
                      onEdit={(r) => {
                        setEditingReporte(r);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDeleteReporte}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 3: SEGUIMIENTOS Y CONTROL DE CALIDAD               */}
        {/* ======================================================== */}
        {activeTab === 'recordatorios' && (
          <div className="space-y-5">
            <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none">
              <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                Seguimiento de Calidad a Clientes
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Casos completados que requieren verificación telefónica de servicio técnico.
              </p>
            </div>

            <FollowUpBanner
              pendingReportes={pendingFollowUps}
              onMarcarSeguimiento={handleMarcarSeguimiento}
            />

            <div className="space-y-4">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Historial de Seguimientos Realizados
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {reportes
                  .filter((r) => r.seguimiento_realizado)
                  .map((reporte) => (
                    <ReportCard
                      key={reporte.id}
                      reporte={reporte}
                      onClick={(r) => {
                        setPreviewReporte(r);
                        setIsPreviewOpen(true);
                      }}
                      onEdit={(r) => {
                        setEditingReporte(r);
                        setIsModalOpen(true);
                      }}
                      onDelete={handleDeleteReporte}
                    />
                  ))}
              </div>
            </div>
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 4: HISTORIAL Y EXPORTACIÓN                         */}
        {/* ======================================================== */}
        {/* VISTA 4: HISTORIAL Y EXPORTACIÓN EN TABLAS POR SEMANA    */}
        {/* ======================================================== */}
        {activeTab === 'historial' && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 sm:p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg flex items-center gap-2">
                  <HistoryIcon className="w-5 h-5 text-brand-600" />
                  Historial de Reportes Agrupados por Semana
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Visualización tabular tipo PDF desglosada por semana con opción de descarga de reportes.
                </p>
              </div>

              <button
                onClick={() => setIsPDFModalOpen(true)}
                className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all shrink-0"
              >
                <FileDown className="w-4.5 h-4.5" />
                <span>Exportar PDF</span>
              </button>
            </div>

            {/* Agrupar reportes por semana */}
            {(() => {
              const mapSemanas = new Map<number, Reporte[]>();
              reportes.forEach((r) => {
                const sem = r.semana || 1;
                if (!mapSemanas.has(sem)) mapSemanas.set(sem, []);
                mapSemanas.get(sem)!.push(r);
              });
              const semanasOrdenadas = Array.from(mapSemanas.entries()).sort((a, b) => b[0] - a[0]);

              if (loading) {
                return (
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-2">
                    <RefreshCw className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Cargando historial por semanas...</p>
                  </div>
                );
              }

              if (semanasOrdenadas.length === 0) {
                return (
                  <div className="bg-white dark:bg-slate-900 p-10 rounded-2xl border border-slate-200 dark:border-slate-700 text-center space-y-3">
                    <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
                      <Inbox className="w-5 h-5" />
                    </div>
                    <h4 className="font-bold text-slate-800 dark:text-slate-100 text-sm">No hay reportes en el historial</h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mx-auto">
                      Registra nuevas actividades para comenzar a visualizar las tablas semanales.
                    </p>
                  </div>
                );
              }

              return (
                <div className="space-y-6">
                  {semanasOrdenadas.map(([numSemana, listaSemana]) => {
                    const completadosSemana = listaSemana.filter((r) => r.estado === 'Completado' || r.estado === 'Resuelto').length;
                    const pendientesSemana = listaSemana.filter((r) => r.estado === 'Pendiente' || r.estado === 'En Proceso').length;

                    return (
                      <div
                        key={numSemana}
                        className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 overflow-hidden shadow-card dark:shadow-none"
                      >
                        {/* Cabecera de Semana */}
                        <div className="bg-slate-50 dark:bg-slate-800/60 px-5 py-3.5 border-b border-slate-200 dark:border-slate-700 flex flex-wrap items-center justify-between gap-2">
                          <div className="flex items-center gap-2.5">
                            <span className="bg-brand-600 text-white text-xs font-black px-2.5 py-1 rounded-lg">
                              Semana {numSemana}
                            </span>
                            <span className="text-xs font-bold text-slate-700 dark:text-slate-200">
                              {listaSemana.length} actividad{listaSemana.length !== 1 ? 'es' : ''} registrada{listaSemana.length !== 1 ? 's' : ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-semibold">
                            <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 border border-emerald-500/20">
                              {completadosSemana} Resueltos
                            </span>
                            {pendientesSemana > 0 && (
                              <span className="px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-600 border border-amber-500/20">
                                {pendientesSemana} Pendientes
                              </span>
                            )}
                          </div>
                        </div>

                        {/* VISTA MÓVIL (< 640px): Tarjetas Apiladas Compactas */}
                        <div className="sm:hidden divide-y divide-slate-100 dark:divide-slate-800">
                          {listaSemana.map((reporte) => {
                            const isSoporte = reporte.tipo_actividad === 'soporte';
                            return (
                              <div key={reporte.id} className="p-3.5 space-y-2 hover:bg-slate-50 dark:hover:bg-slate-800/40">
                                <div className="flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase ${
                                        isSoporte
                                          ? 'bg-brand-500/10 text-brand-600 border border-brand-500/20'
                                          : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                                      }`}
                                    >
                                      {isSoporte ? 'Soporte' : 'Libre'}
                                    </span>
                                    <span className="text-[11px] font-medium text-slate-500">{reporte.fecha_creacion}</span>
                                  </div>
                                  <span
                                    className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold ${
                                      reporte.estado === 'Completado' || reporte.estado === 'Resuelto'
                                        ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                        : reporte.estado === 'En Proceso'
                                        ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                        : reporte.estado === 'Pendiente'
                                        ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                        : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                    }`}
                                  >
                                    {reporte.estado}
                                  </span>
                                </div>

                                <div>
                                  <p className="font-bold text-slate-900 dark:text-white text-xs sm:text-sm">
                                    {isSoporte ? reporte.nombre_cliente || 'Sin cliente' : 'Actividad General'}
                                  </p>
                                  {isSoporte && (reporte.ip_cliente || reporte.telefono_cliente) && (
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
                                      {reporte.ip_cliente && <span className="font-mono text-brand-600 font-semibold">{reporte.ip_cliente} </span>}
                                      {reporte.telefono_cliente && <span>• {reporte.telefono_cliente}</span>}
                                    </p>
                                  )}
                                </div>

                                <p className="text-xs text-slate-600 dark:text-slate-300 line-clamp-2 leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-2 rounded-xl border border-slate-200/60 dark:border-slate-700/60">
                                  {reporte.accion_realizada || reporte.descripcion_actividad || 'Sin detalles'}
                                </p>

                                <div className="flex items-center justify-end gap-2 pt-1">
                                  <button
                                    onClick={() => {
                                      setPreviewReporte(reporte);
                                      setIsPreviewOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold"
                                  >
                                    <FileText className="w-3.5 h-3.5" />
                                    <span>Ver</span>
                                  </button>
                                  <button
                                    onClick={() => {
                                      setEditingReporte(reporte);
                                      setIsModalOpen(true);
                                    }}
                                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-brand-50 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300 border border-brand-200 dark:border-brand-800 text-xs font-semibold"
                                  >
                                    <Wrench className="w-3.5 h-3.5" />
                                    <span>Editar</span>
                                  </button>
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* VISTA ESCRITORIO / TABLET (>= 640px): Tabla Completa */}
                        <div className="hidden sm:block overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-100/70 dark:bg-slate-800/30 text-[11px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                                <th className="py-3 px-4">Fecha</th>
                                <th className="py-3 px-4">Tipo / Cliente</th>
                                <th className="py-3 px-4">Contacto / IP</th>
                                <th className="py-3 px-4">Detalle / Acción Realizada</th>
                                <th className="py-3 px-4 text-center">Estado</th>
                                <th className="py-3 px-4 text-right">Acciones</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
                              {listaSemana.map((reporte) => {
                                const isSoporte = reporte.tipo_actividad === 'soporte';
                                return (
                                  <tr
                                    key={reporte.id}
                                    className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors"
                                  >
                                    {/* Fecha */}
                                    <td className="py-3 px-4 whitespace-nowrap font-medium text-slate-600 dark:text-slate-300">
                                      {reporte.fecha_creacion}
                                    </td>

                                    {/* Tipo / Cliente */}
                                    <td className="py-3 px-4">
                                      <div className="flex items-center gap-2">
                                        <span
                                          className={`text-[10px] font-extrabold px-2 py-0.5 rounded-md uppercase shrink-0 ${
                                            isSoporte
                                              ? 'bg-brand-500/10 text-brand-600 border border-brand-500/20'
                                              : 'bg-indigo-500/10 text-indigo-600 border border-indigo-500/20'
                                          }`}
                                        >
                                          {isSoporte ? 'Soporte' : 'Libre'}
                                        </span>
                                        <div>
                                          <p className="font-bold text-slate-900 dark:text-white line-clamp-1">
                                            {isSoporte ? reporte.nombre_cliente || 'Sin cliente' : 'Actividad General'}
                                          </p>
                                          {reporte.folio && (
                                            <p className="text-[10px] text-slate-400">Folio: {reporte.folio}</p>
                                          )}
                                        </div>
                                      </div>
                                    </td>

                                    {/* Contacto / IP */}
                                    <td className="py-3 px-4 whitespace-nowrap">
                                      {isSoporte ? (
                                        <div>
                                          {reporte.ip_cliente && (
                                            <p className="font-mono text-slate-700 dark:text-slate-300 font-semibold">{reporte.ip_cliente}</p>
                                          )}
                                          {reporte.telefono_cliente && (
                                            <p className="text-[11px] text-slate-500 dark:text-slate-400">{reporte.telefono_cliente}</p>
                                          )}
                                          {!reporte.ip_cliente && !reporte.telefono_cliente && (
                                            <span className="text-slate-400 italic">N/A</span>
                                          )}
                                        </div>
                                      ) : (
                                        <span className="text-slate-400 italic">N/A</span>
                                      )}
                                    </td>

                                    {/* Detalle / Acción Realizada */}
                                    <td className="py-3 px-4 max-w-xs">
                                      <p className="text-slate-700 dark:text-slate-300 line-clamp-2 leading-relaxed">
                                        {reporte.accion_realizada || reporte.descripcion_actividad || 'Sin detalles'}
                                      </p>
                                    </td>

                                    {/* Estado */}
                                    <td className="py-3 px-4 whitespace-nowrap text-center">
                                      <span
                                        className={`inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold ${
                                          reporte.estado === 'Completado' || reporte.estado === 'Resuelto'
                                            ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                                            : reporte.estado === 'En Proceso'
                                            ? 'bg-blue-500/10 text-blue-600 border border-blue-500/20'
                                            : reporte.estado === 'Pendiente'
                                            ? 'bg-amber-500/10 text-amber-600 border border-amber-500/20'
                                            : 'bg-rose-500/10 text-rose-600 border border-rose-500/20'
                                        }`}
                                      >
                                        {reporte.estado}
                                      </span>
                                    </td>

                                    {/* Acciones */}
                                    <td className="py-3 px-4 whitespace-nowrap text-right">
                                      <div className="flex items-center justify-end gap-1.5">
                                        <button
                                          onClick={() => {
                                            setPreviewReporte(reporte);
                                            setIsPreviewOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-brand-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                          title="Ver detalle"
                                        >
                                          <FileText className="w-4 h-4" />
                                        </button>
                                        <button
                                          onClick={() => {
                                            setEditingReporte(reporte);
                                            setIsModalOpen(true);
                                          }}
                                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
                                          title="Editar reporte"
                                        >
                                          <Wrench className="w-4 h-4" />
                                        </button>
                                      </div>
                                    </td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 5: CLIENTES (SOLO ADMIN)                           */}
        {/* ======================================================== */}
        {activeTab === 'clientes' && userSession?.rol?.includes('Administrador') && (
          <ClientManagement />
        )}

        {/* ======================================================== */}
        {/* VISTA 6: GESTIÓN DE CONTRASEÑAS                          */}
        {/* ======================================================== */}
        {activeTab === 'contrasenas' && (
          <PasswordManagement />
        )}
      </main>

      {/* NAVEGACIÓN MÓVIL FIJA CON EMOTICONES */}
      <BottomNav
        activeTab={activeTab}
        onSelectTab={(tab) => {
          if (tab === 'crear') {
            setEditingReporte(null);
            setIsModalOpen(true);
          } else {
            handleTabChange(tab);
          }
        }}
        onOpenNuevoReporte={() => {
          setEditingReporte(null);
          setIsModalOpen(true);
        }}
        pendingFollowUpsCount={pendingFollowUps.length}
        userSession={userSession}
      />

      {/* MODAL FORMULARIO DINÁMICO */}
      <ReportFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveReporte}
        editingReporte={editingReporte}
      />

      <ReportPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => setIsPreviewOpen(false)}
        reporte={previewReporte}
        onEdit={(r) => {
          setEditingReporte(r);
          setIsModalOpen(true);
        }}
      />

      {/* MODAL EXPORTAR PDF */}
      <PDFExportModal
        isOpen={isPDFModalOpen}
        onClose={() => setIsPDFModalOpen(false)}
        reportes={reportes}
        semana={semana}
        año={año}
      />

      {/* MODAL INICIO DE SESIÓN (LOGIN) */}
      <LoginScreen
        isOpen={isLoginOpen}
        onLoginSuccess={(session) => {
          setUserSession(session);
          setIsLoginOpen(false);
        }}
        onClose={() => setIsLoginOpen(false)}
      />
    </div>
  );
}

export default function DashboardPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950">
        <div className="animate-spin w-8 h-8 border-4 border-brand-500 border-t-transparent rounded-full"></div>
      </div>
    }>
      <DashboardContent />
    </Suspense>
  );
}
