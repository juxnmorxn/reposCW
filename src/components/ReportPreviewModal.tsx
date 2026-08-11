'use client';

import React from 'react';
import { Reporte } from '@/lib/types';
import { X, Edit, Calendar, Info, Wrench, FileText, CheckCircle2 } from 'lucide-react';

interface ReportPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  reporte: Reporte | null;
  onEdit: (reporte: Reporte) => void;
}

export const ReportPreviewModal: React.FC<ReportPreviewModalProps> = ({
  isOpen,
  onClose,
  reporte,
  onEdit,
}) => {
  if (!isOpen || !reporte) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
              <Info className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                Detalle del Reporte
              </h2>
              <p className="text-xs text-slate-500 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {reporte.fecha_creacion}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-700 p-1.5 rounded-xl hover:bg-slate-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 overflow-y-auto space-y-5">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold ${
                reporte.estado === 'Completado'
                  ? 'bg-emerald-100 text-emerald-700'
                  : 'bg-amber-100 text-amber-700'
              }`}
            >
              {reporte.estado}
            </span>
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 text-slate-600 text-xs font-bold uppercase tracking-wider">
              {reporte.tipo_actividad === 'soporte' ? <Wrench className="w-3.5 h-3.5" /> : <FileText className="w-3.5 h-3.5" />}
              {reporte.tipo_actividad}
            </span>
          </div>

          {reporte.tipo_actividad === 'soporte' && (
            <div className="space-y-4">
              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Datos del Cliente</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Folio</span>
                    <span className="text-sm font-semibold text-slate-800">{reporte.folio || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Teléfono</span>
                    <span className="text-sm font-semibold text-slate-800">{reporte.telefono_cliente || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Nombre / Ubicación</span>
                    <span className="text-sm font-semibold text-slate-800">{reporte.nombre_cliente || '-'}</span>
                  </div>
                </div>
              </div>

              <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100 space-y-3">
                <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Detalles Técnicos</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Abonados Degradados</span>
                    <span className="text-sm font-semibold text-slate-800">{reporte.abonados_con_senal_degradada || '-'}</span>
                  </div>
                  <div>
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Equipo RX</span>
                    <span className="text-sm font-semibold text-slate-800">{reporte.equipo_de_rx || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Parámetros Actuales</span>
                    <span className="text-sm font-semibold text-slate-800">{reporte.parametros_actuales || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Acción Realizada</span>
                    <span className="text-sm text-slate-700">{reporte.accion_realizada || '-'}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="block text-[10px] text-slate-500 uppercase font-bold">Parámetros Mejorados</span>
                    <span className="text-sm font-semibold text-emerald-600 flex items-center gap-1">
                      {reporte.parametros_mejorados ? (
                        <><CheckCircle2 className="w-4 h-4"/> {reporte.parametros_mejorados}</>
                      ) : '-'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {reporte.tipo_actividad === 'libre' && (
            <div className="bg-slate-50 rounded-2xl p-4 border border-slate-100">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Descripción de la Actividad</h3>
              <p className="text-sm text-slate-700 whitespace-pre-wrap">{reporte.descripcion_actividad || '-'}</p>
            </div>
          )}

          {reporte.evidencia_urls && reporte.evidencia_urls.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Evidencias ({reporte.evidencia_urls.length})</h3>
              <div className="grid grid-cols-3 gap-2">
                {reporte.evidencia_urls.map((url, idx) => (
                  <div key={idx} className="aspect-square rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                    <img src={url} alt={`Evidencia ${idx}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

          {reporte.comentarios_adicionales && (
            <div className="bg-amber-50 rounded-xl p-3 border border-amber-100">
              <h3 className="text-[10px] font-bold text-amber-600 uppercase tracking-wider mb-1">Comentarios Adicionales</h3>
              <p className="text-xs text-amber-900">{reporte.comentarios_adicionales}</p>
            </div>
          )}
        </div>

        <div className="px-5 py-4 border-t border-slate-100 flex justify-end gap-3 bg-white">
          <button
            onClick={onClose}
            className="px-5 py-2.5 rounded-xl border border-slate-200 text-slate-600 text-sm font-semibold hover:bg-slate-50 transition-colors"
          >
            Cerrar
          </button>
          <button
            onClick={() => {
              onClose();
              onEdit(reporte);
            }}
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-sm font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all"
          >
            <Edit className="w-4 h-4" />
            Editar Reporte
          </button>
        </div>
      </div>
    </div>
  );
};
