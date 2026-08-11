'use client';

import React, { useState, useEffect } from 'react';
import { Reporte, TipoActividad, EstadoReporte } from '@/lib/types';
import { uploadEvidenceFile } from '@/lib/drive';
import { getLocalDateString } from '@/lib/db';
import {
  X,
  Plus,
  Upload,
  Image as ImageIcon,
  Wrench,
  Settings,
  PhoneCall,
  FileText,
  HelpCircle,
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

  // Soporte
  const [cliente, setCliente] = useState('');
  const [problema, setProblema] = useState('');
  const [fechaReporteCreado, setFechaReporteCreado] = useState(todayStr);
  const [tecnicoAsignado, setTecnicoAsignado] = useState('Ingeniero de Soporte');
  const [fechaSolucion, setFechaSolucion] = useState('');
  const [accionRealizada, setAccionRealizada] = useState('');
  const [parametrosMejorados, setParametrosMejorados] = useState('');

  // Configuración
  const [equipo, setEquipo] = useState('');
  const [configuracionRealizada, setConfiguracionRealizada] = useState('');
  const [resultadoPruebas, setResultadoPruebas] = useState('');

  // Seguimiento
  const [clienteSeguimiento, setClienteSeguimiento] = useState('');
  const [motivoSeguimiento, setMotivoSeguimiento] = useState('');
  const [resultadoSeguimiento, setResultadoSeguimiento] = useState('mejoro');

  // General / Otros
  const [descripcionActividad, setDescripcionActividad] = useState('');
  const [comentariosAdicionales, setComentariosAdicionales] = useState('');

  // Evidencias
  const [evidenciaUrls, setEvidenciaUrls] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (editingReporte) {
      setTipoActividad(editingReporte.tipo_actividad || 'soporte');
      setFechaCreacion(editingReporte.fecha_creacion || todayStr);
      setEstado((editingReporte.estado as EstadoReporte) || 'Pendiente');
      setCliente(editingReporte.cliente || '');
      setProblema(editingReporte.problema || '');
      setFechaReporteCreado(editingReporte.fecha_reporte_creado || todayStr);
      setTecnicoAsignado(editingReporte.tecnico_asignado || 'Ingeniero de Soporte');
      setFechaSolucion(editingReporte.fecha_solucion || '');
      setAccionRealizada(editingReporte.accion_realizada || '');
      setParametrosMejorados(editingReporte.parametros_mejorados || '');
      setEquipo(editingReporte.equipo || '');
      setConfiguracionRealizada(editingReporte.configuracion_realizada || '');
      setResultadoPruebas(editingReporte.resultado_pruebas || '');
      setClienteSeguimiento(editingReporte.cliente_seguimiento || '');
      setMotivoSeguimiento(editingReporte.motivo_seguimiento || '');
      setResultadoSeguimiento(editingReporte.resultado_seguimiento || 'mejoro');
      setDescripcionActividad(editingReporte.descripcion_actividad || '');
      setComentariosAdicionales(editingReporte.comentarios_adicionales || '');
      setEvidenciaUrls(editingReporte.evidencia_urls || []);
    } else {
      resetForm();
    }
  }, [editingReporte, isOpen]);

  const resetForm = () => {
    setTipoActividad('soporte');
    setFechaCreacion(todayStr);
    setEstado('Pendiente');
    setCliente('');
    setProblema('');
    setFechaReporteCreado(todayStr);
    setTecnicoAsignado('Ingeniero de Soporte');
    setFechaSolucion('');
    setAccionRealizada('');
    setParametrosMejorados('');
    setEquipo('');
    setConfiguracionRealizada('');
    setResultadoPruebas('');
    setClienteSeguimiento('');
    setMotivoSeguimiento('');
    setResultadoSeguimiento('mejoro');
    setDescripcionActividad('');
    setComentariosAdicionales('');
    setEvidenciaUrls([]);
  };

  if (!isOpen) return null;

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    const files = Array.from(e.target.files);
    setIsUploading(true);

    try {
      const uploadedResults = await Promise.all(
        files.map((file) => uploadEvidenceFile(file, cliente || equipo || 'Evidencia'))
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
        comentarios_adicionales: comentariosAdicionales,
      };

      if (editingReporte?.id) {
        payload.id = editingReporte.id;
      }

      if (tipoActividad === 'soporte') {
        payload.cliente = cliente;
        payload.problema = problema;
        payload.fecha_reporte_creado = fechaReporteCreado;
        payload.tecnico_asignado = tecnicoAsignado;
        payload.fecha_solucion = fechaSolucion || (estado === 'Completado' ? fechaCreacion : null);
        payload.accion_realizada = accionRealizada;
        payload.parametros_mejorados = parametrosMejorados;
      } else if (tipoActividad === 'configuracion') {
        payload.equipo = equipo;
        payload.configuracion_realizada = configuracionRealizada;
        payload.resultado_pruebas = resultadoPruebas;
      } else if (tipoActividad === 'seguimiento') {
        payload.cliente_seguimiento = clienteSeguimiento;
        payload.motivo_seguimiento = motivoSeguimiento;
        payload.resultado_seguimiento = resultadoSeguimiento;
        payload.seguimiento_realizado = 1;
        payload.fecha_seguimiento = fechaCreacion;
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
      <div className="bg-white w-full max-w-2xl rounded-3xl shadow-modal overflow-hidden flex flex-col max-h-[90vh] my-auto">
        {/* Encabezado Modal */}
        <div className="px-5 py-4 border-b border-slate-200 flex items-center justify-between bg-slate-50">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-100 text-brand-600 flex items-center justify-center font-bold">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-base sm:text-lg">
                {editingReporte ? 'Editar Reporte de Actividad' : 'Nuevo Reporte Diario'}
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
            <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
              {[
                { id: 'soporte', label: 'Soporte', icon: Wrench },
                { id: 'configuracion', label: 'Config.', icon: Settings },
                { id: 'seguimiento', label: 'Seguimiento', icon: PhoneCall },
                { id: 'administrativo', label: 'Admin', icon: FileText },
                { id: 'otros', label: 'Otros', icon: HelpCircle },
              ].map((item) => {
                const IconComp = item.icon;
                const isSelected = tipoActividad === item.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setTipoActividad(item.id as TipoActividad)}
                    className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl border text-xs font-bold transition-all ${
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
                <Wrench className="w-4 h-4" /> Datos de Soporte Técnico
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Cliente / Ubicación</label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Hospital Central - Quirófano 2"
                    value={cliente}
                    onChange={(e) => setCliente(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Técnico Asignado</label>
                  <input
                    type="text"
                    placeholder="Tú / Nombre del técnico"
                    value={tecnicoAsignado}
                    onChange={(e) => setTecnicoAsignado(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Problema Reportado</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Describe la falla reportada por el cliente..."
                  value={problema}
                  onChange={(e) => setProblema(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Creación Orden</label>
                  <input
                    type="date"
                    value={fechaReporteCreado}
                    onChange={(e) => setFechaReporteCreado(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-700 mb-1">Fecha Solución (Cierre)</label>
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
                  placeholder="Ej. Latencia de red <15ms, SNR >40dB, impedancia corregida"
                  value={parametrosMejorados}
                  onChange={(e) => setParametrosMejorados(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {tipoActividad === 'configuracion' && (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1.5">
                <Settings className="w-4 h-4" /> Datos de Configuración
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Equipo / Sistema</label>
                <input
                  type="text"
                  required
                  placeholder="Ej. Servidor PACS, Router Cisco C1100, Switch Nivel 3"
                  value={equipo}
                  onChange={(e) => setEquipo(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Configuración Realizada</label>
                <textarea
                  rows={2}
                  required
                  placeholder="Parámetros modificados, actualización de firmware o reglas aplicadas..."
                  value={configuracionRealizada}
                  onChange={(e) => setConfiguracionRealizada(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resultado de Pruebas</label>
                <textarea
                  rows={2}
                  placeholder="Resultados obtenidas en las pruebas de verificación..."
                  value={resultadoPruebas}
                  onChange={(e) => setResultadoPruebas(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
            </div>
          )}

          {tipoActividad === 'seguimiento' && (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1.5">
                <PhoneCall className="w-4 h-4" /> Datos de Seguimiento
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Cliente a Contactar</label>
                <input
                  type="text"
                  required
                  placeholder="Nombre del cliente o entidad"
                  value={clienteSeguimiento}
                  onChange={(e) => setClienteSeguimiento(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Motivo de Seguimiento</label>
                <textarea
                  rows={2}
                  placeholder="Motivo de la llamada o caso a verificar..."
                  value={motivoSeguimiento}
                  onChange={(e) => setMotivoSeguimiento(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Resultado del Seguimiento</label>
                <select
                  value={resultadoSeguimiento}
                  onChange={(e) => setResultadoSeguimiento(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
                >
                  <option value="mejoro">✅ Mejoró / Funcionamiento Correcto</option>
                  <option value="sigue_igual">⚠️ Sigue igual / Requiere nueva visita</option>
                  <option value="no_contesto">📵 No contestó</option>
                </select>
              </div>
            </div>
          )}

          {(tipoActividad === 'administrativo' || tipoActividad === 'otros') && (
            <div className="space-y-4 bg-slate-50/80 p-4 rounded-2xl border border-slate-200">
              <h3 className="text-xs font-bold text-brand-700 uppercase tracking-wider flex items-center gap-1.5">
                <FileText className="w-4 h-4" /> Descripción de Actividad
              </h3>
              <div>
                <label className="block text-xs font-medium text-slate-700 mb-1">Detalle de Actividad</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Reunión administrativa, elaboración de informes, inventario de componentes..."
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
              Evidencias Fotográficas (Google Drive)
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

          {/* Comentarios Adicionales */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Comentarios u Observaciones Adicionales
            </label>
            <input
              type="text"
              placeholder="Cualquier nota extra relevante para el informe semanal..."
              value={comentariosAdicionales}
              onChange={(e) => setComentariosAdicionales(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs sm:text-sm text-slate-800 focus:ring-2 focus:ring-brand-500"
            />
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
