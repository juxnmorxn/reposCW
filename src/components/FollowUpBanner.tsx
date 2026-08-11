'use client';

import React from 'react';
import { Reporte, ResultadoSeguimiento } from '@/lib/types';
import { PhoneCall, CheckCircle2, AlertCircle, HelpCircle, X } from 'lucide-react';

interface FollowUpBannerProps {
  pendingReportes: Reporte[];
  onMarcarSeguimiento: (id: number, resultado: ResultadoSeguimiento) => void;
}

export const FollowUpBanner: React.FC<FollowUpBannerProps> = ({
  pendingReportes,
  onMarcarSeguimiento,
}) => {
  const [dismissed, setDismissed] = React.useState(false);

  if (dismissed || pendingReportes.length === 0) return null;

  return (
    <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-4 shadow-sm mb-6 relative overflow-hidden">
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 shadow-md shadow-amber-500/20">
            <PhoneCall className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
              Recordatorio de Seguimiento a Clientes
              <span className="bg-amber-100 text-amber-800 text-xs px-2 py-0.5 rounded-full border border-amber-300 font-extrabold">
                {pendingReportes.length} pendiente{pendingReportes.length > 1 ? 's' : ''}
              </span>
            </h3>
            <p className="text-xs text-slate-600 mt-0.5">
              {pendingReportes[0].accion_realizada || pendingReportes[0].descripcion_actividad || 'Verificar funcionamiento y conformidad del servicio.'}
            </p>
          </div>
        </div>

        <button
          onClick={() => setDismissed(true)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-amber-100 transition-colors"
          title="Descartar aviso por ahora"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Lista de casos de seguimiento */}
      <div className="mt-3 space-y-2.5">
        {pendingReportes.map((reporte) => (
          <div
            key={reporte.id}
            className="bg-white p-3 rounded-xl border border-amber-200/80 shadow-subtle flex flex-col sm:flex-row sm:items-center justify-between gap-3"
          >
            <div>
              <div className="flex items-center gap-2">
                <span className="font-semibold text-slate-900">{reporte.nombre_cliente || reporte.folio || 'General'}</span>
                <span className="text-slate-400">|</span>
                <span className="text-[10px] text-slate-500 bg-slate-100 px-2 py-0.5 rounded-md">
                  Solucionado: {reporte.fecha_solucion || reporte.fecha_creacion}
                </span>
              </div>
              <p className="text-xs text-slate-600 mt-0.5 line-clamp-1">
                <span className="font-medium text-slate-700">Actividad:</span> {reporte.descripcion_actividad || reporte.accion_realizada || 'N/A'}
              </p>
            </div>

            {/* Botones de Acción de 1-Toque */}
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                onClick={() => reporte.id && onMarcarSeguimiento(reporte.id, 'mejoro')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-300 transition-colors active:scale-95"
              >
                <CheckCircle2 className="w-3.5 h-3.5" />
                Mejoró
              </button>
              <button
                onClick={() => reporte.id && onMarcarSeguimiento(reporte.id, 'sigue_igual')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-300 transition-colors active:scale-95"
              >
                <AlertCircle className="w-3.5 h-3.5" />
                Sigue igual
              </button>
              <button
                onClick={() => reporte.id && onMarcarSeguimiento(reporte.id, 'no_contesto')}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-300 transition-colors active:scale-95"
              >
                <HelpCircle className="w-3.5 h-3.5" />
                No contestó
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
