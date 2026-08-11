export type TipoActividad = 'soporte' | 'libre';

export type EstadoReporte = 'Pendiente' | 'En Proceso' | 'Completado' | 'No Completado';

export type ResultadoSeguimiento = 'mejoro' | 'sigue_igual' | 'no_contesto';

export interface Reporte {
  id?: number;
  fecha_creacion: string; // YYYY-MM-DD
  tipo_actividad: TipoActividad;

  // Campos SOPORTE
  folio?: string;
  nombre_cliente?: string;
  ip_cliente?: string;
  telefono_cliente?: string;
  abonados_con_senal_degradada?: string | number;
  parametros_actuales?: string;
  equipo_de_rx?: string;
  fecha_reporte_creado?: string;
  fecha_solucion?: string;
  parametros_mejorados?: string;
  accion_realizada?: string;

  // Campos SEGUIMIENTO
  cliente_seguimiento?: string;
  motivo_seguimiento?: string;
  resultado_seguimiento?: ResultadoSeguimiento | string;

  // Campos Generales
  descripcion_actividad?: string; // Usado para "libre" u "otros"
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
