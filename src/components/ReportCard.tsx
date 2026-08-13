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
  const getActivityIcon = () => {
    if (reporte.tipo_actividad === 'soporte') {
      return <Wrench className="w-5 h-5 text-brand-500" />;
    }
    return <FileText className="w-5 h-5 text-slate-500 dark:text-slate-400" />;
  };

  const getStatusBadge = () => {
    switch (reporte.estado) {
      case 'Completado':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-500/10 text-emerald-500 border border-emerald-500/20">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Completado
          </span>
        );
      case 'En Proceso':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
            <Clock className="w-3.5 h-3.5 animate-spin" />
            En Proceso
          </span>
        );
      case 'Pendiente':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <AlertOctagon className="w-3.5 h-3.5" />
            Pendiente
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-rose-500/10 text-rose-400 border border-rose-500/20">
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

  const numFotos = Array.isArray(reporte.evidencia_urls) ? reporte.evidencia_urls.length : 0;

  const handleCopyText = (e: React.MouseEvent, text?: string) => {
    e.stopPropagation();
    if (!text) return;
    navigator.clipboard.writeText(text);
  };

  return (
    <div
      className="group relative bg-white dark:bg-[#1a1d27] rounded-2xl border border-slate-200 dark:border-[#2d3147] p-4 shadow-sm hover:shadow-md dark:hover:shadow-none dark:hover:border-[#3a3f5c] transition-all cursor-pointer"
      onClick={() => onClick && onClick(reporte)}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          {/* Activity Icon */}
          <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-[#222535] flex items-center justify-center shrink-0">
            {getActivityIcon()}
          </div>

          <div className="min-w-0">
            {/* Type badge & Evidencias badge */}
            <div className="flex items-center gap-1.5 mb-1 flex-wrap">
              <span className="inline-flex items-center text-[10px] font-extrabold uppercase tracking-wider text-brand-500 bg-brand-500/10 px-2 py-0.5 rounded-md">
                {reporte.tipo_actividad}
              </span>
              {numFotos > 0 && (
                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-md">
                  📷 {numFotos} foto{numFotos > 1 ? 's' : ''}
                </span>
              )}
            </div>

            {/* Title */}
            <h3 className="font-bold text-slate-900 dark:text-white text-sm leading-tight truncate">
              {title}
            </h3>

            {/* Folio, IP y Teléfono con 1-clic copy */}
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
              {reporte.folio && <span>Folio: {reporte.folio}</span>}
              {reporte.ip_cliente && (
                <button
                  type="button"
                  onClick={(e) => handleCopyText(e, reporte.ip_cliente)}
                  className="font-mono text-brand-600 font-semibold hover:underline flex items-center gap-0.5"
                  title="Clic para copiar IP"
                >
                  <span>{reporte.ip_cliente}</span>
                  <span className="text-[9px] opacity-70">📋</span>
                </button>
              )}
              {reporte.telefono_cliente && (
                <button
                  type="button"
                  onClick={(e) => handleCopyText(e, reporte.telefono_cliente)}
                  className="hover:text-brand-600 flex items-center gap-0.5"
                  title="Clic para copiar Teléfono"
                >
                  <span>📞 {reporte.telefono_cliente}</span>
                  <span className="text-[9px] opacity-70">📋</span>
                </button>
              )}
            </div>

            {/* Subtitle */}
            {subtitle && (
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2">
                {subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Status */}
        <div className="shrink-0">{getStatusBadge()}</div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between mt-3 pt-3 border-t border-slate-100 dark:border-[#2d3147]">
        <div className="flex items-center gap-1 text-[11px] text-slate-400 dark:text-slate-500">
          <Calendar className="w-3.5 h-3.5" />
          <span>{reporte.fecha_creacion}</span>
        </div>

        <div className="flex items-center gap-1 opacity-90 sm:opacity-0 group-hover:opacity-100 transition-opacity">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(reporte); }}
              className="p-1.5 rounded-lg text-slate-500 hover:text-brand-500 hover:bg-brand-500/10 transition-colors"
              title="Editar"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && reporte.id && (
            <button
              onClick={(e) => { e.stopPropagation(); onDelete(reporte.id!); }}
              className="p-1.5 rounded-lg text-slate-400 hover:text-rose-500 hover:bg-rose-500/10 transition-colors"
              title="Eliminar"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
