'use client';

import React from 'react';
import { Reporte } from '@/lib/types';
import {
  Wrench,
  FileText,
  Calendar,
  CheckCircle2,
  Clock,
  AlertOctagon,
  XCircle,
  Edit2,
  Trash2,
} from 'lucide-react';

interface ReportCardProps {
  reporte: Reporte;
  onClick?: (reporte: Reporte) => void;
  onEdit?: (reporte: Reporte) => void;
  onDelete?: (id: number) => void;
  onQuickStatusChange?: (id: number, nuevoEstado: any) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  reporte,
  onClick,
  onEdit,
  onDelete,
}) => {
  // Icono según actividad
  const getActivityIcon = () => {
    if (reporte.tipo_actividad === 'soporte') {
      return <Wrench className="w-5 h-5 text-brand-600" />;
    }
    return <FileText className="w-5 h-5 text-slate-600" />;
  };

  // Badges de Estado
  const getStatusBadge = () => {
    switch (reporte.estado) {
      case 'Completado':
      case 'Resuelto':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completado
          </span>
        );
      case 'En Proceso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-700 border border-blue-200">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            En Proceso
          </span>
        );
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-700 border border-amber-200">
            <AlertOctagon className="w-3.5 h-3.5" />
            Pendiente
          </span>
        );
      case 'No Completado':
      case 'Rechazado':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-50 text-rose-700 border border-rose-200">
            <XCircle className="w-3.5 h-3.5" />
            No Completado
          </span>
        );
    }
  };

  const title =
    reporte.nombre_cliente ||
    reporte.folio ||
    `Actividad ${reporte.tipo_actividad.toUpperCase()}`;

  const subtitle =
    reporte.descripcion_actividad ||
    reporte.accion_realizada ||
    '';

  return (
    <div 
      className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick && onClick(reporte)}
    >
      {/* Encabezado de la Tarjeta */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center shrink-0">
            {getActivityIcon()}
          </div>
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-[11px] font-extrabold uppercase tracking-wider text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md border border-brand-100">
                {reporte.tipo_actividad}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="w-3.5 h-3.5" />
                {reporte.fecha_creacion}
              </span>
            </div>
            <h3 className="font-bold text-slate-900 text-sm sm:text-base mt-1 leading-snug">
              {title}
            </h3>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {getStatusBadge()}
        </div>
      </div>

      {/* Descripción Breve / Problema */}
      {subtitle && (
        <p className="text-xs sm:text-sm text-slate-600 mt-2.5 line-clamp-2 leading-relaxed">
          {subtitle}
        </p>
      )}

      {/* Acciones de la Tarjeta */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={(e) => { e.stopPropagation(); onClick && onClick(reporte); }}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-brand-50"
        >
          Previsualizar detalles
        </button>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(reporte); }}
              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Editar Reporte"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && reporte.id && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(reporte.id!); }}
              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
              title="Eliminar Reporte"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
