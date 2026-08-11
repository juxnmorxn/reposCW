'use client';

import React, { useState } from 'react';
import { Reporte } from '@/lib/types';
import { generateWeeklyReportPDF } from '@/lib/pdf';
import { getLocalDateString } from '@/lib/db';
import { FileDown, X, Calendar, User, FileText, Filter } from 'lucide-react';

interface PDFExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  reportes: Reporte[];
  semana: number;
  año: number;
}

export const PDFExportModal: React.FC<PDFExportModalProps> = ({
  isOpen,
  onClose,
  reportes,
  semana,
  año,
}) => {
  const todayStr = getLocalDateString();
  const sevenDaysAgo = new Date();
  sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
  const sevenDaysAgoStr = getLocalDateString(sevenDaysAgo);

  const [nombreIngeniero, setNombreIngeniero] = useState('Ingeniero de Soporte Técnico');
  const [modoExport, setModoExport] = useState<'semana' | 'rango'>('semana');
  const [fechaDesde, setFechaDesde] = useState(sevenDaysAgoStr);
  const [fechaHasta, setFechaHasta] = useState(todayStr);
  const [isGenerating, setIsGenerating] = useState(false);

  if (!isOpen) return null;

  // Filtrar reportes para el PDF según el modo elegido
  let reportesAExportar = reportes;
  if (modoExport === 'rango') {
    reportesAExportar = reportes.filter(
      (r) => r.fecha_creacion >= fechaDesde && r.fecha_creacion <= fechaHasta
    );
  }

  const handleExportPDF = () => {
    setIsGenerating(true);
    try {
      generateWeeklyReportPDF(reportesAExportar, semana, año, nombreIngeniero);
      onClose();
    } catch (err) {
      console.error('Error generando PDF:', err);
    } finally {
      setIsGenerating(false);
    }
  };

  const totalResueltos = reportesAExportar.filter((r) => r.estado === 'Resuelto').length;
  const totalPendientes = reportesAExportar.filter(
    (r) => r.estado === 'Pendiente' || r.estado === 'En Proceso'
  ).length;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-3xl shadow-modal overflow-hidden">
        {/* Encabezado */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                Exportar Reporte PDF
              </h2>
              <p className="text-xs text-slate-500">
                {modoExport === 'semana'
                  ? `Semana ISO ${semana} (${año})`
                  : `Rango del ${fechaDesde} al ${fechaHasta}`}
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

        <div className="p-5 space-y-4">
          {/* Selector de Modo de Exportación */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
              Rango de Fechas para Exportar
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setModoExport('semana')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  modoExport === 'semana'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                🗓️ Semana ISO {semana}
              </button>
              <button
                type="button"
                onClick={() => setModoExport('rango')}
                className={`py-2 px-3 rounded-xl border text-xs font-bold transition-all ${
                  modoExport === 'rango'
                    ? 'bg-brand-600 text-white border-brand-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                }`}
              >
                📅 Rango Personalizado
              </button>
            </div>
          </div>

          {/* Rango de Fechas Personalizado */}
          {modoExport === 'rango' && (
            <div className="grid grid-cols-2 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Desde</label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Hasta</label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-xs text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* Resumen Estadístico de Actividades */}
          <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-2 text-xs">
            <h3 className="font-bold text-slate-900 flex items-center gap-1.5 text-sm">
              <Calendar className="w-4 h-4 text-brand-600" /> Resumen del Documento
            </h3>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div>
                <span className="font-semibold text-slate-800">Total Registros:</span>{' '}
                {reportesAExportar.length}
              </div>
              <div>
                <span className="font-semibold text-emerald-700">✅ Resueltos:</span> {totalResueltos}
              </div>
              <div>
                <span className="font-semibold text-amber-700">⏳ Pendientes:</span> {totalPendientes}
              </div>
              <div>
                <span className="font-semibold text-slate-800">Exportación:</span> Descarga directa
              </div>
            </div>
          </div>

          {/* Nombre Firma */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Nombre en Pie de Firma del Reporte
            </label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                value={nombreIngeniero}
                onChange={(e) => setNombreIngeniero(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
          </div>

          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              onClick={handleExportPDF}
              disabled={isGenerating || reportesAExportar.length === 0}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              <FileDown className="w-4 h-4" />
              <span>Descargar PDF APDFY</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
