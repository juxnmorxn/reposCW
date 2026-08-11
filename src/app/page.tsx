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
    if (activeTabParam && ['dashboard', 'crear', 'gestion', 'recordatorios', 'historial', 'clientes'].includes(activeTabParam)) {
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

      if (activeTab === 'historial' || modoFecha === 'todos') {
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
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900/50 flex flex-col pb-20 md:pb-8">
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

      <main className="max-w-7xl w-full mx-auto px-4 sm:px-6 pt-5 space-y-6 flex-1">
        {/* ======================================================== */}
        {/* VISTA 1: DASHBOARD PRINCIPAL                             */}
        {/* ======================================================== */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            {/* Banner de Seguimientos Pendientes */}
            <FollowUpBanner
              pendingReportes={pendingFollowUps}
              onMarcarSeguimiento={handleMarcarSeguimiento}
            />

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
                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Total Actividades</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white mt-1">{total}</h4>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-brand-50 dark:bg-brand-900/30 text-brand-600 flex items-center justify-center shrink-0">
                    <BarChart3 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Completados</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-emerald-600 mt-1">{completados}</h4>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">Pendientes</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-amber-600 mt-1">{pendientes}</h4>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-amber-50 dark:bg-amber-900/30 text-amber-600 flex items-center justify-center shrink-0">
                    <Clock className="w-6 h-6" />
                  </div>
                </div>

                <div className="bg-white dark:bg-slate-900 rounded-2xl p-4 border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold text-slate-500 dark:text-slate-400">No Completados</p>
                    <h4 className="text-xl sm:text-2xl font-extrabold text-rose-600 mt-1">{noCompletados}</h4>
                  </div>
                  <div className="w-11 h-11 rounded-xl bg-rose-50 dark:bg-rose-900/30 text-rose-600 flex items-center justify-center shrink-0">
                    <XCircle className="w-6 h-6" />
                  </div>
                </div>
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
                    <option value="todos">Todas las Categorías</option>
                    <option value="soporte">Soporte Técnico</option>
                    <option value="configuracion">Configuración</option>
                    <option value="seguimiento">Seguimiento</option>
                    <option value="administrativo">Administrativo</option>
                    <option value="otros">Otros</option>
                  </select>
                </div>

                <div className="hidden md:flex items-center gap-1.5 overflow-x-auto pb-0.5 no-scrollbar">
                  {[
                    { id: 'todos', label: 'Todas las Categorías', icon: Layers },
                    { id: 'soporte', label: 'Soporte', icon: Wrench },
                    { id: 'configuracion', label: 'Configuración', icon: Settings },
                    { id: 'seguimiento', label: 'Seguimiento', icon: PhoneCall },
                    { id: 'administrativo', label: 'Administrativo', icon: FileText },
                    { id: 'otros', label: 'Otros', icon: HelpCircle },
                  ].map((cat) => {
                    const IconComp = cat.icon;
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setTipoFiltro(cat.id)}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                          tipoFiltro === cat.id
                            ? 'bg-brand-600 text-white shadow-sm'
                            : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200'
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
        {activeTab === 'historial' && (
          <div className="space-y-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none">
              <div>
                <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                  Historial de Reportes y Exportación PDF
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Consulta reportes por Mes o Semana del Mes y descárgalos en PDF.
                </p>
              </div>

              <button
                onClick={() => setIsPDFModalOpen(true)}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold shadow-md active:scale-95 transition-all"
              >
                <FileDown className="w-4 h-4" />
                <span>Exportar PDF</span>
              </button>
            </div>

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
          </div>
        )}

        {/* ======================================================== */}
        {/* VISTA 5: CLIENTES (SOLO ADMIN)                           */}
        {/* ======================================================== */}
        {activeTab === 'clientes' && userSession?.rol?.includes('Administrador') && (
          <ClientManagement />
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
