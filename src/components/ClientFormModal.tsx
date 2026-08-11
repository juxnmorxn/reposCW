'use client';

import React, { useState, useEffect } from 'react';
import { Cliente } from '@/lib/types';
import { X, Check, Loader2, UserPlus, UserCog } from 'lucide-react';

interface ClientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Cliente) => Promise<void>;
  editingClient?: Cliente | null;
}

export const ClientFormModal: React.FC<ClientFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingClient,
}) => {
  const [folio, setFolio] = useState('');
  const [nombre, setNombre] = useState('');
  const [telefono, setTelefono] = useState('');
  const [ip, setIp] = useState('');
  const [router, setRouter] = useState('');
  const [direccion, setDireccion] = useState('');
  const [planInternet, setPlanInternet] = useState('');
  const [esAntena, setEsAntena] = useState(true);
  const [activo, setActivo] = useState(true);

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingClient) {
      setFolio(editingClient.folio || '');
      setNombre(editingClient.nombre || '');
      setTelefono(editingClient.telefono || '');
      setIp(editingClient.ip || '');
      setRouter(editingClient.router || '');
      setDireccion(editingClient.direccion || '');
      setPlanInternet(editingClient.plan_internet || '');
      setEsAntena(editingClient.es_antena ?? true);
      setActivo(editingClient.activo ?? true);
    } else {
      resetForm();
    }
  }, [editingClient, isOpen]);

  const resetForm = () => {
    setFolio('');
    setNombre('');
    setTelefono('');
    setIp('');
    setRouter('');
    setDireccion('');
    setPlanInternet('');
    setEsAntena(true);
    setActivo(true);
  };

  if (!isOpen) return null;

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: Cliente = {
        folio,
        nombre,
        telefono,
        ip,
        router,
        direccion,
        plan_internet: planInternet,
        es_antena: esAntena,
        activo,
      };

      if (editingClient?.id) {
        payload.id = editingClient.id;
      }

      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error enviando cliente:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado Modal */}
        <div className="px-5 py-4 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between bg-slate-50 dark:bg-slate-900/50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
              {editingClient ? <UserCog className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            </div>
            <div>
              <h2 className="font-bold text-slate-900 dark:text-white text-base sm:text-lg">
                {editingClient ? 'Editar Cliente' : 'Nuevo Cliente'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Información de contacto y configuración técnica.
              </p>
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

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-4 flex-1">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Nombre Completo *</label>
              <input
                type="text"
                required
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Folio (Opcional)</label>
              <input
                type="text"
                value={folio}
                onChange={(e) => setFolio(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Teléfono</label>
              <input
                type="text"
                value={telefono}
                onChange={(e) => setTelefono(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Dirección / Ubicación</label>
              <input
                type="text"
                value={direccion}
                onChange={(e) => setDireccion(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div className="sm:col-span-2 border-t border-slate-100 dark:border-slate-800 my-1 pt-3">
              <h3 className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase mb-3">Información Técnica</h3>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Dirección IP</label>
              <input
                type="text"
                value={ip}
                onChange={(e) => setIp(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Router / Equipo</label>
              <input
                type="text"
                value={router}
                onChange={(e) => setRouter(e.target.value)}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Plan de Internet</label>
              <input
                type="text"
                value={planInternet}
                onChange={(e) => setPlanInternet(e.target.value)}
                placeholder="Ej. Plan 20MB"
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-200 mb-1">Tecnología</label>
              <select
                value={esAntena ? 'antena' : 'fibra'}
                onChange={(e) => setEsAntena(e.target.value === 'antena')}
                className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-brand-500"
              >
                <option value="antena">📡 Antena Inalámbrica</option>
                <option value="fibra">🔗 Fibra Óptica (OLT)</option>
              </select>
            </div>

            <div className="sm:col-span-2 mt-2">
              <label className="flex items-center gap-2 cursor-pointer p-3 bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-xl">
                <input
                  type="checkbox"
                  checked={activo}
                  onChange={(e) => setActivo(e.target.checked)}
                  className="w-4 h-4 text-brand-600 rounded border-slate-300 dark:border-slate-700 focus:ring-brand-500"
                />
                <div>
                  <span className="text-sm font-bold text-slate-800 dark:text-slate-100 block leading-none">Cliente Activo</span>
                  <span className="text-xs text-slate-500 dark:text-slate-400">Si se desactiva, no aparecerá en el autocompletado de reportes.</span>
                </div>
              </label>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-4 mt-2 border-t border-slate-200 dark:border-slate-700 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 dark:border-slate-700 text-slate-600 dark:text-slate-300 text-xs sm:text-sm font-semibold hover:bg-slate-100 dark:bg-slate-800 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{editingClient ? 'Guardar Cambios' : 'Añadir Cliente'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
