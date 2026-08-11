import { createClient, Client } from '@libsql/client';
import { Reporte, ResultadoSeguimiento } from './types';

let dbClient: Client | null = null;

// Inicializa el cliente de Turso si las variables de entorno están presentes
export function getDbClient(): Client | null {
  if (dbClient) return dbClient;

  const url = process.env.TURSO_DATABASE_URL || process.env.NEXT_PUBLIC_TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN || process.env.NEXT_PUBLIC_TURSO_AUTH_TOKEN;

  if (url && authToken) {
    try {
      dbClient = createClient({
        url,
        authToken,
      });
      return dbClient;
    } catch (err) {
      console.error('Error inicializando cliente de Turso:', err);
      return null;
    }
  }
  return null;
}

// Estructura de tabla según el Brief de la aplicación
const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS reportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_creacion DATE NOT NULL,
    tipo_actividad TEXT NOT NULL,
    
    -- Campos SOPORTE
    cliente TEXT,
    problema TEXT,
    fecha_reporte_creado DATE,
    tecnico_asignado TEXT,
    fecha_solucion DATE,
    accion_realizada TEXT,
    parametros_mejorados TEXT,
    
    -- Campos CONFIGURACIÓN
    equipo TEXT,
    configuracion_realizada TEXT,
    resultado_pruebas TEXT,
    
    -- Campos SEGUIMIENTO
    cliente_seguimiento TEXT,
    motivo_seguimiento TEXT,
    resultado_seguimiento TEXT,
    
    -- Campos generales
    descripcion_actividad TEXT,
    estado TEXT DEFAULT 'Pendiente',
    evidencia_urls TEXT,
    seguimiento_realizado BOOLEAN DEFAULT 0,
    fecha_seguimiento DATE,
    comentarios_adicionales TEXT,
    
    -- Metadatos de semana y año
    semana INTEGER,
    año INTEGER
);

CREATE INDEX IF NOT EXISTS idx_semana ON reportes(semana, año);
CREATE INDEX IF NOT EXISTS idx_estado ON reportes(estado);
CREATE INDEX IF NOT EXISTS idx_cliente ON reportes(cliente);

CREATE TABLE IF NOT EXISTS configuracion_app (
    clave TEXT PRIMARY KEY,
    valor TEXT,
    actualizado DATE
);
`;

export async function initDb(): Promise<boolean> {
  const client = getDbClient();
  if (!client) {
    console.log('Modo Híbrido: Turso no está configurado. Usando almacenamiento local.');
    return false;
  }

  try {
    const statements = SCHEMA_SQL.split(';').filter((s) => s.trim().length > 0);
    for (const stmt of statements) {
      await client.execute(stmt);
    }
    console.log('Base de datos Turso inicializada con éxito.');
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos Turso:', error);
    return false;
  }
}

// Helper para obtener la fecha YYYY-MM-DD en la zona horaria local (ej. Actopan, Hidalgo UTC-6)
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper para obtener el mes amigable (ej. Agosto) y la semana del mes (Semana 1..4)
export function getMonthAndWeekLabel(dateStr?: string): {
  mesNombre: string;
  semanaMes: number;
  año: number;
  labelCompleto: string;
} {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const meses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];
  const mesNombre = meses[d.getMonth()] || 'Agosto';
  const dia = d.getDate();
  const semanaMes = Math.min(4, Math.ceil(dia / 7));
  const año = d.getFullYear();
  return {
    mesNombre,
    semanaMes,
    año,
    labelCompleto: `${mesNombre} - Semana ${semanaMes} (${año})`,
  };
}

// Helper para calcular la semana ISO
export function getWeekAndYear(dateStr: string): { semana: number; año: number } {
  const d = dateStr ? new Date(dateStr + 'T12:00:00') : new Date();
  const target = new Date(d.valueOf());
  const dayNr = (d.getDay() + 6) % 7;
  target.setDate(target.getDate() - dayNr + 3);
  const firstThursday = target.valueOf();
  target.setMonth(0, 1);
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay() + 7) % 7));
  }
  const semana = 1 + Math.round((firstThursday - target.valueOf()) / 604800000);
  const año = d.getFullYear();
  return { semana, año };
}

// -------------------------------------------------------------
// OPERACIONES DE REPORTES (TURSO + FALLBACK LOCAL)
// -------------------------------------------------------------

const LOCAL_STORAGE_KEY = 'reportes_soporte_local_db';

function getLocalReports(): Reporte[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    return data ? JSON.parse(data) : getSeedReports();
  } catch {
    return getSeedReports();
  }
}

function saveLocalReports(reports: Reporte[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(reports));
}

// Datos semilla de demostración profesional para primera carga
function getSeedReports(): Reporte[] {
  const today = new Date();
  const todayStr = getLocalDateString(today);
  const twoDaysAgo = new Date(today);
  twoDaysAgo.setDate(today.getDate() - 2);
  const twoDaysAgoStr = getLocalDateString(twoDaysAgo);

  const { semana, año } = getWeekAndYear(todayStr);

  const seeds: Reporte[] = [
    {
      id: 1,
      fecha_creacion: todayStr,
      tipo_actividad: 'soporte',
      cliente: 'Hospital Central - Quirófano 3',
      problema: 'Pérdida intermitente de señal en telemetría de monitores.',
      fecha_reporte_creado: todayStr,
      tecnico_asignado: 'Ing. Soporte (Tú)',
      fecha_solucion: todayStr,
      accion_realizada: 'Reconfiguración de canal de frecuencia y reemplazo de conector RJ45 blindado.',
      parametros_mejorados: 'Latencia reducida de 120ms a 14ms. Cero pérdidas de paquetes en 2 horas de prueba.',
      descripcion_actividad: 'Atención prioritaria de soporte técnico en sitio.',
      estado: 'Completado',
      evidencia_urls: [],
      seguimiento_realizado: 0,
      semana,
      año,
    },
    {
      id: 2,
      fecha_creacion: twoDaysAgoStr,
      tipo_actividad: 'soporte',
      cliente: 'Clínica Santa María - Diagnóstico',
      problema: 'Ruido electromagnético en sistema de electrocardiógrafo.',
      fecha_reporte_creado: twoDaysAgoStr,
      tecnico_asignado: 'Ing. Soporte (Tú)',
      fecha_solucion: twoDaysAgoStr,
      accion_realizada: 'Calibración de tierra física y ajuste de filtro P-Pass a 60Hz.',
      parametros_mejorados: 'Señal limpia SNR > 45dB.',
      descripcion_actividad: 'Calibración técnica de equipo.',
      estado: 'Completado',
      evidencia_urls: [],
      seguimiento_realizado: 0, // Pendiente de seguimiento (hace 2 días)
      semana,
      año,
    },
    {
      id: 3,
      fecha_creacion: todayStr,
      tipo_actividad: 'configuracion',
      equipo: 'Servidor PACS General',
      configuracion_realizada: 'Actualización de firmware v4.2.1 y habilitación de compresión DICOM sin pérdidas.',
      resultado_pruebas: 'Transferencia de imágenes médicas 35% más rápida. Pruebas superadas al 100%.',
      descripcion_actividad: 'Mantenimiento programado de firmware.',
      estado: 'Completado',
      evidencia_urls: [],
      seguimiento_realizado: 1,
      semana,
      año,
    },
    {
      id: 4,
      fecha_creacion: todayStr,
      tipo_actividad: 'seguimiento',
      cliente_seguimiento: 'Laboratorio Biomedic',
      motivo_seguimiento: 'Verificación post-reparación de centrífuga de alta velocidad.',
      resultado_seguimiento: 'mejoro',
      descripcion_actividad: 'Llamada de control de calidad.',
      estado: 'Completado',
      evidencia_urls: [],
      seguimiento_realizado: 1,
      semana,
      año,
    },
  ];

  return seeds;
}

export async function fetchReportes(filters?: {
  semana?: number;
  año?: number;
  tipo?: string;
  estado?: string;
  busqueda?: string;
  fechaExacta?: string;
  fechaDesde?: string;
  fechaHasta?: string;
}): Promise<Reporte[]> {
  const client = getDbClient();

  if (client) {
    let query = 'SELECT * FROM reportes WHERE 1=1';
    const args: any[] = [];
    try {
      if (filters?.fechaExacta) {
        query += ' AND fecha_creacion = ?';
        args.push(filters.fechaExacta);
      }
      if (filters?.fechaDesde) {
        query += ' AND fecha_creacion >= ?';
        args.push(filters.fechaDesde);
      }
      if (filters?.fechaHasta) {
        query += ' AND fecha_creacion <= ?';
        args.push(filters.fechaHasta);
      }
      if (filters?.semana && !filters.fechaExacta && !filters.fechaDesde) {
        query += ' AND semana = ?';
        args.push(filters.semana);
      }
      if (filters?.año && !filters.fechaExacta && !filters.fechaDesde) {
        query += ' AND año = ?';
        args.push(filters.año);
      }
      if (filters?.tipo && filters.tipo !== 'todos') {
        query += ' AND tipo_actividad = ?';
        args.push(filters.tipo);
      }
      if (filters?.estado && filters.estado !== 'todos') {
        query += ' AND estado = ?';
        args.push(filters.estado);
      }
      if (filters?.busqueda) {
        query += ' AND (cliente LIKE ? OR problema LIKE ? OR descripcion_actividad LIKE ? OR equipo LIKE ?)';
        const term = `%${filters.busqueda}%`;
        args.push(term, term, term, term);
      }

      query += ' ORDER BY fecha_creacion DESC, id DESC';

      const result = await client.execute({ sql: query, args });
      return result.rows.map((row) => parseReporteRow(row));
    } catch (err: any) {
      if (err?.message?.includes('no such table') || err?.cause?.message?.includes('no such table')) {
        console.log('Tabla reportes no existe en Turso. Creando esquema automáticamente...');
        await initDb();
        try {
          const retryResult = await client.execute({ sql: query, args });
          return retryResult.rows.map((row) => parseReporteRow(row));
        } catch (retryErr) {
          console.error('Error re-ejecutando en Turso DB:', retryErr);
        }
      } else {
        console.error('Error fetching from Turso DB:', err);
      }
    }
  }

  // Fallback a almacenamiento local
  let list = getLocalReports();

  if (filters?.fechaExacta) {
    list = list.filter((r) => r.fecha_creacion === filters.fechaExacta);
  }
  if (filters?.fechaDesde) {
    list = list.filter((r) => r.fecha_creacion >= filters.fechaDesde!);
  }
  if (filters?.fechaHasta) {
    list = list.filter((r) => r.fecha_creacion <= filters.fechaHasta!);
  }
  if (filters?.semana && !filters.fechaExacta && !filters.fechaDesde) {
    list = list.filter((r) => r.semana === filters.semana);
  }
  if (filters?.año && !filters.fechaExacta && !filters.fechaDesde) {
    list = list.filter((r) => r.año === filters.año);
  }
  if (filters?.tipo && filters.tipo !== 'todos') {
    list = list.filter((r) => r.tipo_actividad === filters.tipo);
  }
  if (filters?.estado && filters.estado !== 'todos') {
    list = list.filter((r) => r.estado === filters.estado);
  }
  if (filters?.busqueda) {
    const q = filters.busqueda.toLowerCase();
    list = list.filter(
      (r) =>
        r.cliente?.toLowerCase().includes(q) ||
        r.problema?.toLowerCase().includes(q) ||
        r.descripcion_actividad?.toLowerCase().includes(q) ||
        r.equipo?.toLowerCase().includes(q) ||
        r.tecnico_asignado?.toLowerCase().includes(q)
    );
  }

  return list.sort((a, b) => new Date(b.fecha_creacion).getTime() - new Date(a.fecha_creacion).getTime());
}

export async function insertReporte(data: Omit<Reporte, 'id'>): Promise<Reporte> {
  const { semana, año } = getWeekAndYear(data.fecha_creacion);
  const reporteFinal: Reporte = {
    ...data,
    semana: data.semana || semana,
    año: data.año || año,
    evidencia_urls: data.evidencia_urls || [],
    seguimiento_realizado: data.seguimiento_realizado ? 1 : 0,
  };

  const client = getDbClient();
  if (client) {
    try {
      const sql = `
        INSERT INTO reportes (
          fecha_creacion, tipo_actividad, cliente, problema, fecha_reporte_creado,
          tecnico_asignado, fecha_solucion, accion_realizada, parametros_mejorados,
          equipo, configuracion_realizada, resultado_pruebas, cliente_seguimiento,
          motivo_seguimiento, resultado_seguimiento, descripcion_actividad, estado,
          evidencia_urls, seguimiento_realizado, fecha_seguimiento, comentarios_adicionales,
          semana, año
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const args: any[] = [
        reporteFinal.fecha_creacion,
        reporteFinal.tipo_actividad,
        reporteFinal.cliente ?? null,
        reporteFinal.problema ?? null,
        reporteFinal.fecha_reporte_creado ?? null,
        reporteFinal.tecnico_asignado ?? null,
        reporteFinal.fecha_solucion ?? null,
        reporteFinal.accion_realizada ?? null,
        reporteFinal.parametros_mejorados ?? null,
        reporteFinal.equipo ?? null,
        reporteFinal.configuracion_realizada ?? null,
        reporteFinal.resultado_pruebas ?? null,
        reporteFinal.cliente_seguimiento ?? null,
        reporteFinal.motivo_seguimiento ?? null,
        reporteFinal.resultado_seguimiento ?? null,
        reporteFinal.descripcion_actividad ?? null,
        reporteFinal.estado || 'Pendiente',
        JSON.stringify(reporteFinal.evidencia_urls || []),
        reporteFinal.seguimiento_realizado ? 1 : 0,
        reporteFinal.fecha_seguimiento ?? null,
        reporteFinal.comentarios_adicionales ?? null,
        reporteFinal.semana ?? semana,
        reporteFinal.año ?? año,
      ];

      try {
        const res = await client.execute({ sql, args });
        reporteFinal.id = Number(res.lastInsertRowid);
        return reporteFinal;
      } catch (err: any) {
        if (err?.message?.includes('no such table') || err?.cause?.message?.includes('no such table')) {
          await initDb();
          const retryRes = await client.execute({ sql, args });
          reporteFinal.id = Number(retryRes.lastInsertRowid);
          return reporteFinal;
        }
        console.error('Error insertando en Turso DB:', err);
      }
    } catch (err) {
      console.error('Error general en insertReporte:', err);
    }
  }

  // Fallback Local
  const localList = getLocalReports();
  const nextId = localList.length > 0 ? Math.max(...localList.map((r) => r.id || 0)) + 1 : 1;
  reporteFinal.id = nextId;
  localList.unshift(reporteFinal);
  saveLocalReports(localList);
  return reporteFinal;
}

export async function updateReporte(id: number, data: Partial<Reporte>): Promise<boolean> {
  const client = getDbClient();
  if (client) {
    try {
      const keys = Object.keys(data).filter((k) => k !== 'id');
      if (keys.length === 0) return true;

      const setClauses: string[] = [];
      const args: any[] = [];

      keys.forEach((key) => {
        setClauses.push(`${key} = ?`);
        let val = (data as any)[key];
        if (key === 'evidencia_urls' && Array.isArray(val)) {
          val = JSON.stringify(val);
        }
        if (key === 'seguimiento_realizado') {
          val = val ? 1 : 0;
        }
        args.push(val);
      });

      args.push(id);
      const sql = `UPDATE reportes SET ${setClauses.join(', ')} WHERE id = ?`;
      await client.execute({ sql, args });
      return true;
    } catch (err) {
      console.error('Error actualizando en Turso DB:', err);
    }
  }

  // Fallback Local
  const localList = getLocalReports();
  const index = localList.findIndex((r) => r.id === id);
  if (index !== -1) {
    localList[index] = { ...localList[index], ...data };
    saveLocalReports(localList);
    return true;
  }
  return false;
}

export async function updateSeguimiento(id: number, resultado: ResultadoSeguimiento): Promise<boolean> {
  const fechaSeg = getLocalDateString();
  return updateReporte(id, {
    seguimiento_realizado: 1,
    fecha_seguimiento: fechaSeg,
    resultado_seguimiento: resultado,
  });
}

export async function deleteReporte(id: number): Promise<boolean> {
  const client = getDbClient();
  if (client) {
    try {
      await client.execute({ sql: 'DELETE FROM reportes WHERE id = ?', args: [id] });
      return true;
    } catch (err) {
      console.error('Error eliminando en Turso DB:', err);
    }
  }

  // Fallback Local
  const localList = getLocalReports();
  const filtered = localList.filter((r) => r.id !== id);
  saveLocalReports(filtered);
  return true;
}

function parseReporteRow(row: any): Reporte {
  let evidencias: string[] = [];
  if (row.evidencia_urls) {
    try {
      evidencias = typeof row.evidencia_urls === 'string' ? JSON.parse(row.evidencia_urls) : row.evidencia_urls;
    } catch {
      evidencias = [];
    }
  }

  let estadoNormalizado = row.estado || 'Pendiente';
  if (estadoNormalizado === 'Resuelto') estadoNormalizado = 'Completado';
  if (estadoNormalizado === 'Rechazado') estadoNormalizado = 'No Completado';

  return {
    id: Number(row.id),
    fecha_creacion: String(row.fecha_creacion || ''),
    tipo_actividad: row.tipo_actividad,
    cliente: row.cliente || undefined,
    problema: row.problema || undefined,
    fecha_reporte_creado: row.fecha_reporte_creado || undefined,
    tecnico_asignado: row.tecnico_asignado || undefined,
    fecha_solucion: row.fecha_solucion || undefined,
    accion_realizada: row.accion_realizada || undefined,
    parametros_mejorados: row.parametros_mejorados || undefined,
    equipo: row.equipo || undefined,
    configuracion_realizada: row.configuracion_realizada || undefined,
    resultado_pruebas: row.resultado_pruebas || undefined,
    cliente_seguimiento: row.cliente_seguimiento || undefined,
    motivo_seguimiento: row.motivo_seguimiento || undefined,
    resultado_seguimiento: row.resultado_seguimiento || undefined,
    descripcion_actividad: row.descripcion_actividad || undefined,
    estado: estadoNormalizado,
    evidencia_urls: evidencias,
    seguimiento_realizado: Boolean(row.seguimiento_realizado),
    fecha_seguimiento: row.fecha_seguimiento || undefined,
    comentarios_adicionales: row.comentarios_adicionales || undefined,
    semana: Number(row.semana || 0),
    año: Number(row.año || 0),
  };
}
