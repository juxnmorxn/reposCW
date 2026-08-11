'use client';

import React, { useState, useEffect } from 'react';
import { Reporte, TipoActividad, EstadoReporte, Cliente } from '@/lib/types';
import { uploadEvidenceFile } from '@/lib/drive';
import { getLocalDateString } from '@/lib/db';
import { ClientAutocomplete } from './ClientAutocomplete';
import {
  X,
  Plus,
  Upload,
  Wrench,
  FileText,
  Loader2,
  Check,
} from 'lucide-react';

interface ReportFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: Omit<Reporte, 'id'> | Reporte) => Promise<void>;
  editingReporte?: Reporte | null;
}

export const ReportFormModal: React.FC<ReportFormModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
  editingReporte,
}) => {
  const todayStr = getLocalDateString();

  const [tipoActividad, setTipoActividad] = useState<TipoActividad>('soporte');
  const [fechaCreacion, setFechaCreacion] = useState(todayStr);
  const [estado, setEstado] = useState<EstadoReporte>('Pendiente');

  // Soporte / Cliente
  const [folio, setFolio] = useState('');
  const [nombreCliente, setNombreCliente] = useState('');
  const [ipCliente, setIpCliente] = useState('');
  const [telefonoCliente, setTelefonoCliente] = useState('');

  const [equipoRx, setEquipoRx] = useState('');
  const [parametrosActuales, setParametrosActuales] = useState('');
  const [fechaReporteCreado, setFechaReporteCreado] = useState(todayStr);
  const [fechaSolucion, setFechaSolucion] = useState('');
  const [accionRealizada, setAccionRealizada] = useState('');
  const [parametrosMejorados, setParametrosMejorados] = useState('');

  // General / Libre
  const [descripcionActividad, setDescripcionActividad] = useState('');


  // Evidencias
  const [evidenciaUrls, setEvidenciaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingReporte) {
      setTipoActividad(editingReporte.tipo_actividad || 'soporte');
      setFechaCreacion(editingReporte.fecha_creacion || todayStr);
      setEstado((editingReporte.estado as EstadoReporte) || 'Pendiente');
      setFolio(editingReporte.folio || '');
      setNombreCliente(editingReporte.nombre_cliente || '');
      setIpCliente(editingReporte.ip_cliente || '');
      setTelefonoCliente(editingReporte.telefono_cliente || '');

      setEquipoRx(editingReporte.equipo_de_rx || '');
      setParametrosActuales(editingReporte.parametros_actuales || '');
      setFechaReporteCreado(editingReporte.fecha_reporte_creado || todayStr);
      setFechaSolucion(editingReporte.fecha_solucion || '');
      setAccionRealizada(editingReporte.accion_realizada || '');
      setParametrosMejorados(editingReporte.parametros_mejorados || '');
      setDescripcionActividad(editingReporte.descripcion_actividad || '');

      setEvidenciaUrls(editingReporte.evidencia_urls || []);
    } else {
      resetForm();
    }
  }, [editingReporte, isOpen]);

  const resetForm = () => {
    setTipoActividad('soporte');
    setFechaCreacion(todayStr);
    setEstado('Pendiente');
    setFolio('');
    setNombreCliente('');
    setIpCliente('');
    setTelefonoCliente('');

    setEquipoRx('');
    setParametrosActuales('');
    setFechaReporteCreado(todayStr);
    setFechaSolucion('');
    setAccionRealizada('');
    setParametrosMejorados('');
    setDescripcionActividad('');

    setEvidenciaUrls([]);
  };

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsUploading(true);

    try {
      const uploadedResults = await Promise.all(
        files.map((file) => uploadEvidenceFile(file, nombreCliente || folio || 'Evidencia'))
      );
      const newUrls = uploadedResults.map((res) => res.url);
      setEvidenciaUrls((prev) => [...prev, ...newUrls]);
    } catch (err) {
      console.error('Error subiendo imagen:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleRemoveEvidencia = (index: number) => {
    setEvidenciaUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const payload: any = {
        fecha_creacion: fechaCreacion,
        tipo_actividad: tipoActividad,
        estado,
        evidencia_urls: evidenciaUrls,
      };

      if (editingReporte?.id) {
        payload.id = editingReporte.id;
      }

      if (tipoActividad === 'soporte') {
        payload.folio = folio;
        payload.nombre_cliente = nombreCliente;
        payload.ip_cliente = ipCliente;
        payload.telefono_cliente = telefonoCliente;

        payload.equipo_de_rx = equipoRx;
        payload.parametros_actuales = parametrosActuales;
        payload.fecha_reporte_creado = fechaReporteCreado;
        payload.fecha_solucion = fechaSolucion || (estado === 'Completado' ? fechaCreacion : null);
        payload.accion_realizada = accionRealizada;
        payload.parametros_mejorados = parametrosMejorados;
      } else {
        payload.descripcion_actividad = descripcionActividad;
      }

      await onSubmit(payload);
      resetForm();
      onClose();
    } catch (err) {
      console.error('Error enviando formulario:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-900/60 backdrop-blur-sm overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] my-auto animate-in fade-in zoom-in-95 duration-200">
        {/* Encabezado Modal */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingReporte ? 'Editar Reporte de Actividad' : 'Nuevo Reporte'}
              </h2>
              <p className="text-xs text-slate-500">
                Selecciona la categoría y completa los campos correspondientes.
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

        {/* Cuerpo del Formulario */}
        <form onSubmit={handleSubmitForm} className="p-5 overflow-y-auto space-y-5 flex-1">
          {/* Selector de Tipo de Actividad (Tab Pills) */}
          <div>
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-2">
              Tipo de Actividad
            </label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'soporte', label: 'Soporte', icon: Wrench },
                { id: 'libre', label: 'Libre (Actividades / Otros)', icon: FileText },
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = tipoActividad === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipoActividad(item.id as TipoActividad)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs sm:text-sm font-bold transition-all ${
                      isSelected
                        ? 'bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-500/20'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    <IconComp className="w-4 h-4" />
                    {item.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Fila General: Fecha y Estado */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Fecha de Registro
              </label>
              <input
                type="date"
                required
                value={fechaCreacion}
                onChange={(e) => setFechaCreacion(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Estado</label>
              <select
                value={estado}
                onChange={(e) => setEstado(e.target.value as EstadoReporte)}
                className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="Pendiente">⏳ Pendiente</option>
                <option value="En Proceso">🔄 En Proceso</option>
                <option value="Completado">✅ Completado</option>
                <option value="No Completado">🚫 No Completado</option>
              </select>
            </div>
          </div>

          {/* CAMPOS DINÁMICOS SEGÚN TIPO DE ACTIVIDAD */}
          {tipoActividad === 'soporte' && (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1.5">
                <Wrench className="w-4 h-4" /> Datos del Cliente y Soporte Técnico
              </h3>
              
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Folio</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. F-1234"
                    value={folio}
                    onChange={(e) => setFolio(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div className="sm:col-span-2">
                  <ClientAutocomplete
                    label="Nombre del Cliente / Ubicación"
                    placeholder="Escribe para buscar (Nombre, IP o Folio)..."
                    value={nombreCliente}
                    onChange={(val) => setNombreCliente(val)}
                    onSelectClient={(c) => {
                      setNombreCliente(`${c.nombre} ${c.direccion ? `- ${c.direccion}` : ''}`.trim());
                      if (c.folio) setFolio(c.folio);
                      if (c.ip) setIpCliente(c.ip);
                      if (c.telefono) setTelefonoCliente(c.telefono);
                    }}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    placeholder="Número de contacto"
                    value={telefonoCliente}
                    onChange={(e) => setTelefonoCliente(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Dirección IP</label>
                  <input
                    type="text"
                    placeholder="Ej. 192.168.1.10"
                    value={ipCliente}
                    onChange={(e) => setIpCliente(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Equipo de RX</label>
                  <input
                    type="text"
                    placeholder="Antena, Modem, OLT..."
                    value={equipoRx}
                    onChange={(e) => setEquipoRx(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Parámetros Actuales</label>
                  <input
                    type="text"
                    placeholder="Latencia, DBm, Tx/Rx"
                    value={parametrosActuales}
                    onChange={(e) => setParametrosActuales(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Reporte (Creación de orden)</label>
                  <input
                    type="date"
                    value={fechaReporteCreado}
                    onChange={(e) => setFechaReporteCreado(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Reparación (Solución)</label>
                  <input
                    type="date"
                    value={fechaSolucion}
                    onChange={(e) => setFechaSolucion(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Acción Realizada</label>
                <textarea
                  rows={2}
                  placeholder="Pasos técnicos ejecutados para resolver el problema..."
                  value={accionRealizada}
                  onChange={(e) => setAccionRealizada(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Parámetros Mejorados / Resultados</label>
                <input
                  type="text"
                  placeholder="Nuevos valores de latencia, DBm, etc."
                  value={parametrosMejorados}
                  onChange={(e) => setParametrosMejorados(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {tipoActividad === 'libre' && (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Descripción de Actividad Libre
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detalle de Actividad</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe tus actividades del día (trabajo en campo, mantenimiento general, instalaciones, etc.)..."
                  value={descripcionActividad}
                  onChange={(e) => setDescripcionActividad(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {/* SUBIDA DE EVIDENCIAS FOTOGRÁFICAS (GOOGLE DRIVE) */}
          <div className="space-y-2">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider">
              Evidencias Fotográficas
            </label>
            <div className="flex items-center gap-3">
              <label className="cursor-pointer inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-100 text-slate-700 hover:bg-slate-200 border border-slate-300 text-xs font-semibold transition-colors">
                {isUploading ? (
                  <Loader2 className="w-4 h-4 animate-spin text-brand-600" />
                ) : (
                  <Upload className="w-4 h-4 text-brand-600" />
                )}
                <span>Subir Fotos de Evidencia</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>
              <span className="text-[11px] text-slate-500">
                {evidenciaUrls.length} foto{evidenciaUrls.length !== 1 ? 's' : ''} cargada{evidenciaUrls.length !== 1 ? 's' : ''}
              </span>
            </div>

            {/* Vista previa de imágenes cargadas */}
            {evidenciaUrls.length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2.5 mt-2">
                {evidenciaUrls.map((url, idx) => (
                  <div key={idx} className="relative group rounded-xl overflow-hidden border border-slate-200 aspect-square bg-slate-100">
                    <img
                      src={url}
                      alt={`Evidencia ${idx + 1}`}
                      className="w-full h-full object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveEvidencia(idx)}
                      className="absolute top-1 right-1 bg-slate-900/70 hover:bg-rose-600 text-white p-1 rounded-full opacity-90 transition-all"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>



          {/* Botones de acción */}
          <div className="pt-3 border-t border-slate-200 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-600 text-xs sm:text-sm font-semibold hover:bg-slate-100 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSubmitting || isUploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-brand-500/20 active:scale-95 transition-all disabled:opacity-50"
            >
              {isSubmitting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              <span>{editingReporte ? 'Guardar Cambios' : 'Guardar Reporte'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
