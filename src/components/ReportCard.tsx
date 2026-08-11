'use client';

import React, { useState } from 'react';
import { Reporte } from '@/lib/types';
import {
  Wrench,
  Settings,
  PhoneCall,
  FileText,
  HelpCircle,
  Calendar,
  User,
  CheckCircle2,
  Clock,
  AlertOctagon,
  XCircle,
  Edit2,
  Trash2,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface ReportCardProps {
  reporte: Reporte;
  onEdit?: (reporte: Reporte) => void;
  onDelete?: (id: number) => void;
  onQuickStatusChange?: (id: number, nuevoEstado: any) => void;
}

export const ReportCard: React.FC<ReportCardProps> = ({
  reporte,
  onEdit,
  onDelete,
  onQuickStatusChange,
}) => {
  const [expanded, setExpanded] = useState(false);

  // Icono según actividad
  const getActivityIcon = () => {
    switch (reporte.tipo_actividad) {
      case 'soporte':
        return <Wrench className="w-5 h-5 text-brand-600" />;
      case 'configuracion':
        return <Settings className="w-5 h-5 text-indigo-600" />;
      case 'seguimiento':
        return <PhoneCall className="w-5 h-5 text-amber-600" />;
      case 'administrativo':
        return <FileText className="w-5 h-5 text-slate-600" />;
      default:
        return <HelpCircle className="w-5 h-5 text-teal-600" />;
    }
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
    reporte.cliente ||
    reporte.equipo ||
    reporte.cliente_seguimiento ||
    `Actividad ${reporte.tipo_actividad.toUpperCase()}`;

  const subtitle =
    reporte.problema ||
    reporte.configuracion_realizada ||
    reporte.motivo_seguimiento ||
    reporte.descripcion_actividad ||
    '';

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-4 shadow-card hover:shadow-md transition-shadow">
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

      {/* Detalles desplegables */}
      {expanded && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-2 text-xs text-slate-700 bg-slate-50/70 p-3 rounded-xl">
          {reporte.tecnico_asignado && (
            <p className="flex items-center gap-1.5">
              <User className="w-3.5 h-3.5 text-slate-400" />
              <span className="font-semibold text-slate-900">Técnico:</span> {reporte.tecnico_asignado}
            </p>
          )}

          {reporte.accion_realizada && (
            <div>
              <span className="font-semibold text-slate-900 block">Acción Realizada:</span>
              <p className="text-slate-600 mt-0.5">{reporte.accion_realizada}</p>
            </div>
          )}

          {reporte.parametros_mejorados && (
            <div>
              <span className="font-semibold text-slate-900 block">Parámetros Mejorados:</span>
              <p className="text-emerald-700 font-medium mt-0.5">{reporte.parametros_mejorados}</p>
            </div>
          )}

          {reporte.resultado_pruebas && (
            <div>
              <span className="font-semibold text-slate-900 block">Pruebas:</span>
              <p className="text-slate-600 mt-0.5">{reporte.resultado_pruebas}</p>
            </div>
          )}

          {reporte.resultado_seguimiento && (
            <div>
              <span className="font-semibold text-slate-900 block">Resultado de Seguimiento:</span>
              <span className="inline-block mt-0.5 px-2 py-0.5 bg-amber-100 text-amber-800 font-bold rounded-md">
                {reporte.resultado_seguimiento}
              </span>
            </div>
          )}

          {reporte.comentarios_adicionales && (
            <div>
              <span className="font-semibold text-slate-900 block">Comentarios:</span>
              <p className="text-slate-600 italic mt-0.5">{reporte.comentarios_adicionales}</p>
            </div>
          )}

          {/* Galería de Evidencias */}
          {reporte.evidencia_urls && reporte.evidencia_urls.length > 0 && (
            <div className="pt-2">
              <span className="font-semibold text-slate-900 flex items-center gap-1 mb-1.5">
                <ImageIcon className="w-3.5 h-3.5 text-brand-600" />
                Evidencias Fotograficas ({reporte.evidencia_urls.length}):
              </span>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {reporte.evidencia_urls.map((imgUrl, i) => (
                  <a
                    key={i}
                    href={imgUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="w-16 h-16 rounded-lg overflow-hidden border border-slate-200 shrink-0 hover:opacity-90"
                  >
                    <img src={imgUrl} alt="Evidencia" className="w-full h-full object-cover" />
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Acciones de la Tarjeta */}
      <div className="mt-3 flex items-center justify-between gap-2 pt-2 border-t border-slate-100">
        <button
          onClick={() => setExpanded(!expanded)}
          className="text-xs font-semibold text-brand-600 hover:text-brand-700 flex items-center gap-1 py-1 px-2 rounded-lg hover:bg-brand-50"
        >
          {expanded ? (
            <>
              Ocultar detalles <ChevronUp className="w-3.5 h-3.5" />
            </>
          ) : (
            <>
              Ver detalles completos <ChevronDown className="w-3.5 h-3.5" />
            </>
          )}
        </button>

        <div className="flex items-center gap-1.5">
          {onEdit && (
            <button
              onClick={() => onEdit(reporte)}
              className="p-1.5 text-slate-500 hover:text-brand-600 hover:bg-slate-100 rounded-lg transition-colors"
              title="Editar Reporte"
            >
              <Edit2 className="w-4 h-4" />
            </button>
          )}
          {onDelete && reporte.id && (
            <button
              onClick={() => onDelete(reporte.id!)}
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
