export type TipoActividad = 'soporte' | 'configuracion' | 'administrativo' | 'seguimiento' | 'otros';

export type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Completado' | 'No Completado';

export type ResultadoSeguimiento = 'mejoro' | 'sigue_igual' | 'no_contesto';

export interface Reporte {
  id?: number;
  fecha_creacion: string; // YYYY-MM-DD
  tipo_actividad: TipoActividad;

  // Campos SOPORTE
  cliente?: string;
  problema?: string;
  fecha_reporte_creado?: string;
  tecnico_asignado?: string;
  fecha_solucion?: string;
  accion_realizada?: string;
  parametros_mejorados?: string;

  // Campos CONFIGURACIÓN
  equipo?: string;
  configuracion_realizada?: string;
  resultado_pruebas?: string;

  // Campos SEGUIMIENTO
  cliente_seguimiento?: string;
  motivo_seguimiento?: string;
  resultado_seguimiento?: ResultadoSeguimiento | string;

  // Campos Generales
  descripcion_actividad?: string;
  estado: EstadoReporte | string;
  evidencia_urls?: string[];
  seguimiento_realizado?: boolean | number;
  fecha_seguimiento?: string;
  comentarios_adicionales?: string;

  // Computed / DB columns
  semana?: number;
  año?: number;
}

export interface StatsSemana {
  total: number;
  completados: number;
  pendientes: number;
  enProceso: number;
  noCompletados: number;
  pendientesSeguimiento: Reporte[];
}

export interface TursoConfig {
  url?: string;
  authToken?: string;
  isLive: boolean;
}
