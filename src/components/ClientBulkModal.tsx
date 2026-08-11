'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, Loader2, Zap, AlertTriangle } from 'lucide-react';

interface ClientBulkModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ClientBulkModal: React.FC<ClientBulkModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [action, setAction] = useState<'activate' | 'deactivate'>('activate');
  const [filterType, setFilterType] = useState<'todos' | 'antena' | 'fibra' | 'router'>('router');
  const [filterValue, setFilterValue] = useState<string>('');
  
  const [routers, setRouters] = useState<string[]>([]);
  const [isLoadingRouters, setIsLoadingRouters] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      loadRouters();
    }
  }, [isOpen]);

  const loadRouters = async () => {
    setIsLoadingRouters(true);
    try {
      const res = await fetch('/api/clientes/routers');
      if (res.ok) {
        const data = await res.json();
        setRouters(data.routers || []);
        if (data.routers && data.routers.length > 0 && !filterValue) {
          setFilterValue(data.routers[0]);
        }
      }
    } catch (err) {
      console.error('Error loading routers:', err);
    } finally {
      setIsLoadingRouters(false);
    }
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (filterType === 'router' && !filterValue) {
      alert('Por favor selecciona un Router (RB) válido.');
      return;
    }

    if (filterType === 'todos') {
      if (!confirm('⚠️ ESTÁS A PUNTO DE MODIFICAR TODOS LOS CLIENTES DE LA BASE DE DATOS. ¿Estás absolutamente seguro?')) {
        return;
      }
    } else {
      if (!confirm(`¿Estás seguro que deseas ${action === 'activate' ? 'ACTIVAR' : 'DESACTIVAR'} masivamente a los clientes seleccionados?`)) {
        return;
      }
    }

    setIsSubmitting(true);
    try {
      const res = await fetch('/api/clientes/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, filterType, filterValue }),
      });

      if (res.ok) {
        const data = await res.json();
        alert(`¡Éxito! Se actualizaron ${data.rowsAffected} clientes.`);
        onSuccess();
        onClose();
      } else {
        const errData = await res.json();
        alert(`Error: ${errData.error}`);
      }
    } catch (err) {
      console.error('Error executing bulk action:', err);
      alert('Ocurrió un error al ejecutar la acción masiva.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center font-bold">
              <Zap className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">Acciones Masivas</h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">Afecta a múltiples clientes a la vez.</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 dark:text-slate-200 p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Formulario */}
        <form onSubmit={handleSubmit} className="p-5 overflow-y-auto space-y-5">
          
          {/* Acción */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">¿Qué deseas hacer?</label>
            <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setAction('activate')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  action === 'activate' 
                    ? 'bg-emerald-500 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
                }`}
              >
                Activar Clientes
              </button>
              <button
                type="button"
                onClick={() => setAction('deactivate')}
                className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                  action === 'deactivate' 
                    ? 'bg-rose-500 text-white shadow-md' 
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-700 dark:text-slate-200'
                }`}
              >
                Desactivar Clientes
              </button>
            </div>
          </div>

          {/* Filtro */}
          <div>
            <label className="block text-sm font-bold text-slate-800 dark:text-slate-100 mb-2">¿A quiénes aplicar?</label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value as any)}
              className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 mb-3"
            >
              <option value="router">Filtrar por Equipo / Router (RB)</option>
              <option value="antena">Todos los de Tecnología: Antena</option>
              <option value="fibra">Todos los de Tecnología: Fibra (OLT)</option>
              <option value="todos">¡Absolutamente TODOS los clientes!</option>
            </select>

            {filterType === 'router' && (
              <div className="animate-in fade-in slide-in-from-top-2 duration-300">
                <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Selecciona el Equipo (RB)</label>
                <div className="relative">
                  <select
                    value={filterValue}
                    onChange={(e) => setFilterValue(e.target.value)}
                    disabled={isLoadingRouters || routers.length === 0}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500 disabled:opacity-60"
                  >
                    {routers.length === 0 ? (
                      <option value="">No hay routers registrados</option>
                    ) : (
                      routers.map((rb) => (
                        <option key={rb} value={rb}>{rb}</option>
                      ))
                    )}
                  </select>
                  {isLoadingRouters && (
                    <Loader2 className="w-4 h-4 text-brand-600 animate-spin absolute right-3 top-2.5" />
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Alerta */}
          <div className="bg-amber-50 dark:bg-amber-900/30 border border-amber-200 rounded-xl p-3 flex gap-3 items-start">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <p className="text-xs text-amber-800 font-medium">
              Esta acción modificará a todos los clientes que coincidan con la selección de manera inmediata. Los clientes inactivos desaparecerán del autocompletado en la creación de reportes.
            </p>
          </div>

          {/* Botones */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || (filterType === 'router' && !filterValue)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-slate-900 hover:bg-black text-white text-xs sm:text-sm font-bold shadow-md active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>Ejecutar Acción</span>
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
