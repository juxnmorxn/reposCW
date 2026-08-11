'use client';

import React, { useState, useEffect } from 'react';
import { Cliente } from '@/lib/types';
import { CSVUploader } from './CSVUploader';
import { ClientFormModal } from './ClientFormModal';
import { ClientBulkModal } from './ClientBulkModal';
import { 
  Search, 
  UserPlus, 
  Edit3, 
  Trash2, 
  RefreshCw, 
  Users,
  Wifi,
  RadioTower,
  ShieldCheck,
  ShieldAlert,
  Loader2,
  Zap,
  Power
} from 'lucide-react';

export const ClientManagement: React.FC = () => {
  const [clientes, setClientes] = useState<Cliente[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);

  const [busqueda, setBusqueda] = useState('');
  const [tipoFiltro, setTipoFiltro] = useState<'todos' | 'antena' | 'fibra'>('todos');
  const [routerFiltro, setRouterFiltro] = useState<string>('todos');
  const [page, setPage] = useState(1);
  const limit = 50;

  const [routersDisponibles, setRoutersDisponibles] = useState<string[]>([]);
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isBulkModalOpen, setIsBulkModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Cliente | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const offset = (page - 1) * limit;
      let queryUrl = `/api/clientes?busqueda=${encodeURIComponent(busqueda)}&tipo=${tipoFiltro}&limit=${limit}&offset=${offset}`;
      if (routerFiltro !== 'todos') {
        queryUrl += `&router=${encodeURIComponent(routerFiltro)}`;
      }
      
      const res = await fetch(queryUrl);
      if (res.ok) {
        const json = await res.json();
        setClientes(json.data || []);
        setTotal(json.total || 0);
      }
    } catch (err) {
      console.error('Error loading clients:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchRouters = async () => {
    try {
      const res = await fetch('/api/clientes/routers');
      if (res.ok) {
        const json = await res.json();
        setRoutersDisponibles(json.routers || []);
      }
    } catch (err) {
      console.error('Error fetching routers', err);
    }
  };

  useEffect(() => {
    fetchRouters();
  }, []);

  useEffect(() => {
    setPage(1); // Reset page on new search/filter
  }, [busqueda, tipoFiltro, routerFiltro]);

  useEffect(() => {
    loadData();
  }, [busqueda, tipoFiltro, routerFiltro, page]);

  const handleSaveClient = async (data: Cliente) => {
    try {
      const method = data.id ? 'PUT' : 'POST';
      const res = await fetch('/api/clientes', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });

      if (res.ok) {
        await loadData();
      } else {
        const errData = await res.json();
        alert(`Error al guardar cliente: ${errData.error}`);
      }
    } catch (err) {
      console.error('Error saving client:', err);
      alert('Error de red al guardar cliente.');
    }
  };

  const handleDeleteClient = async (id: number) => {
    if (!confirm('¿Estás seguro de eliminar permanentemente a este cliente?')) return;
    
    try {
      const res = await fetch(`/api/clientes?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        await loadData();
      } else {
        alert('Error al eliminar el cliente');
      }
    } catch (err) {
      console.error('Error deleting client:', err);
    }
  };

  const handleToggleStatus = async (cliente: Cliente) => {
    try {
      const res = await fetch('/api/clientes', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...cliente, activo: !cliente.activo }),
      });
      if (res.ok) {
        setClientes(clientes.map(c => c.id === cliente.id ? { ...c, activo: !c.activo } : c));
      }
    } catch (err) {
      console.error('Error toggling client status:', err);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Header del módulo */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none">
        <div>
          <h2 className="font-bold text-slate-900 dark:text-white text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-brand-600" />
            Gestión de Clientes
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Administra el catálogo completo de clientes para uso en reportes.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
          <CSVUploader onUploadSuccess={loadData} />
          
          <button
            onClick={() => setIsBulkModalOpen(true)}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-black text-white text-xs font-bold shadow-md shadow-slate-900/20 active:scale-95 transition-all"
          >
            <Zap className="w-4 h-4 text-amber-400" />
            <span>Acciones Masivas</span>
          </button>

          <button
            onClick={() => {
              setEditingClient(null);
              setIsModalOpen(true);
            }}
            className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <UserPlus className="w-4 h-4" />
            <span>Nuevo Cliente</span>
          </button>
        </div>
      </div>

      {/* Barra de Búsqueda y Filtros */}
      <div className="bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none space-y-3">
        <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mt-6 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="relative flex-1 w-full xl:max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Buscar por nombre, folio, IP o teléfono..."
              value={busqueda}
              onChange={(e) => setBusqueda(e.target.value)}
              className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl pl-9 pr-3 py-2.5 text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-brand-500 transition-all"
            />
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <select
              value={routerFiltro}
              onChange={(e) => setRouterFiltro(e.target.value)}
              className="bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-800 rounded-xl px-3 py-2.5 text-xs sm:text-sm font-bold text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="todos">Todos los Equipos</option>
              {routersDisponibles.map((rb) => (
                <option key={rb} value={rb}>{rb}</option>
              ))}
            </select>

            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl shrink-0 w-full sm:w-auto">
            <button
              onClick={() => setTipoFiltro('todos')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${tipoFiltro === 'todos' ? 'bg-white dark:bg-slate-900 shadow text-slate-800 dark:text-slate-100' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setTipoFiltro('antena')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tipoFiltro === 'antena' ? 'bg-white dark:bg-slate-900 shadow text-brand-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
            >
              <RadioTower className="w-3.5 h-3.5" /> Antena
            </button>
            <button
              onClick={() => setTipoFiltro('fibra')}
              className={`flex-1 sm:flex-none px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${tipoFiltro === 'fibra' ? 'bg-white dark:bg-slate-900 shadow text-violet-700' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'}`}
            >
              <Wifi className="w-3.5 h-3.5" /> Fibra
            </button>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de Clientes */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-card dark:shadow-none overflow-hidden">
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50/50">
          <h3 className="text-xs font-bold text-slate-700 dark:text-slate-200 uppercase tracking-wider">
            Catálogo de Clientes ({total})
          </h3>
          <button
            onClick={loadData}
            className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            Actualizar
          </button>
        </div>

        {loading ? (
          <div className="p-10 text-center">
            <Loader2 className="w-6 h-6 text-brand-600 animate-spin mx-auto" />
            <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 mt-2">Cargando clientes...</p>
          </div>
        ) : clientes.length === 0 ? (
          <div className="p-10 text-center">
            <Users className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-bold text-slate-800 dark:text-slate-100">No se encontraron clientes</p>
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Ajusta los filtros o intenta importar un archivo CSV.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-900/50 text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider border-b border-slate-200 dark:border-slate-700">
                <tr>
                  <th className="px-4 py-3">Cliente</th>
                  <th className="px-4 py-3">Contacto</th>
                  <th className="px-4 py-3">Tecnología</th>
                  <th className="px-4 py-3">Estado</th>
                  <th className="px-4 py-3 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {clientes.map((cliente) => (
                  <tr key={cliente.id} className="hover:bg-slate-50 dark:bg-slate-900/50/80 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className="font-bold text-slate-900 dark:text-white">{cliente.nombre}</span>
                        {cliente.folio && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-medium">Folio: {cliente.folio}</span>
                        )}
                        {cliente.direccion && (
                          <span className="text-[11px] text-slate-400 mt-0.5 truncate max-w-[200px]" title={cliente.direccion}>
                            {cliente.direccion}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col text-xs">
                        {cliente.ip ? (
                          <span className="font-semibold text-brand-700">{cliente.ip}</span>
                        ) : (
                          <span className="text-slate-400 italic">Sin IP</span>
                        )}
                        {cliente.telefono ? (
                          <span className="text-slate-600 dark:text-slate-300 mt-0.5">{cliente.telefono}</span>
                        ) : (
                          <span className="text-slate-400 mt-0.5 italic">Sin teléfono</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-col">
                        <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full w-max ${
                          cliente.es_antena 
                            ? 'bg-brand-100 text-brand-700' 
                            : 'bg-violet-100 text-violet-700'
                        }`}>
                          {cliente.es_antena ? <RadioTower className="w-3 h-3" /> : <Wifi className="w-3 h-3" />}
                          {cliente.es_antena ? 'Antena' : 'Fibra (OLT)'}
                        </span>
                        {cliente.router && (
                          <span className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate max-w-[150px]">
                            {cliente.router}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full ${
                        cliente.activo 
                          ? 'bg-emerald-100 text-emerald-700' 
                          : 'bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400'
                      }`}>
                        {cliente.activo ? <ShieldCheck className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                        {cliente.activo ? 'Activo' : 'Inactivo'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => handleToggleStatus(cliente)}
                          className={`p-1.5 rounded-lg transition-colors ${
                            cliente.activo 
                              ? 'text-emerald-600 hover:bg-emerald-50' 
                              : 'text-slate-400 hover:bg-slate-100 dark:bg-slate-800 hover:text-slate-700 dark:text-slate-200'
                          }`}
                          title={cliente.activo ? "Desactivar" : "Activar"}
                        >
                          <Power className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            setEditingClient(cliente);
                            setIsModalOpen(true);
                          }}
                          className="p-1.5 text-slate-400 hover:text-brand-600 hover:bg-brand-50 dark:bg-brand-900/30 rounded-lg transition-colors"
                          title="Editar"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => cliente.id && handleDeleteClient(cliente.id)}
                          className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:bg-rose-900/30 rounded-lg transition-colors"
                          title="Eliminar"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            
            {/* Controles de Paginación */}
            {total > limit && (
              <div className="flex items-center justify-between px-5 py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900/50">
                <span className="text-xs text-slate-500 dark:text-slate-400 font-medium">
                  Mostrando {(page - 1) * limit + 1} a {Math.min(page * limit, total)} de {total}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-50 disabled:hover:bg-white dark:bg-slate-900"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setPage((p) => p + 1)}
                    disabled={page * limit >= total}
                    className="px-3 py-1.5 text-xs font-bold rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:bg-slate-800 disabled:opacity-50 disabled:hover:bg-white dark:bg-slate-900"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <ClientFormModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSubmit={handleSaveClient}
        editingClient={editingClient}
      />

      <ClientBulkModal
        isOpen={isBulkModalOpen}
        onClose={() => setIsBulkModalOpen(false)}
        onSuccess={loadData}
      />
    </div>
  );
};
