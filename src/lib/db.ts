import { createClient, Client } from '@libsql/client';
import { Reporte, ResultadoSeguimiento, Cliente } from './types';

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
CREATE TABLE IF NOT EXISTS clientes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    folio TEXT UNIQUE,
    nombre TEXT NOT NULL,
    telefono TEXT,
    ip TEXT,
    router TEXT,
    direccion TEXT,
    plan_internet TEXT,
    es_antena BOOLEAN DEFAULT 1,
    activo BOOLEAN DEFAULT 1,
    fecha_registro DATE
);

CREATE TABLE IF NOT EXISTS reportes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    fecha_creacion DATE NOT NULL,
    tipo_actividad TEXT NOT NULL,
    
    -- Campos SOPORTE
    folio TEXT,
    nombre_cliente TEXT,
    ip_cliente TEXT,
    telefono_cliente TEXT,
    abonados_con_senal_degradada TEXT,
    parametros_actuales TEXT,
    equipo_de_rx TEXT,
    fecha_reporte_creado DATE,
    fecha_solucion DATE,
    parametros_mejorados TEXT,
    accion_realizada TEXT,
    
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
CREATE INDEX IF NOT EXISTS idx_cliente_nombre ON reportes(nombre_cliente);

CREATE TABLE IF NOT EXISTS configuracion_app (
    clave TEXT PRIMARY KEY,
    valor TEXT,
    actualizado DATE
);

CREATE TABLE IF NOT EXISTS usuarios (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    nombre TEXT NOT NULL,
    rol TEXT NOT NULL,
    fecha_creacion DATE
);

CREATE TABLE IF NOT EXISTS grupos_contrasenas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    nombre TEXT NOT NULL,
    fecha_creacion DATE
);

CREATE TABLE IF NOT EXISTS contrasenas (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    grupo_id INTEGER NOT NULL,
    titulo TEXT NOT NULL,
    usuario TEXT NOT NULL,
    contrasena TEXT NOT NULL,
    descripcion TEXT,
    fecha_creacion DATE,
    FOREIGN KEY(grupo_id) REFERENCES grupos_contrasenas(id) ON DELETE CASCADE
);
`;

export async function initDb(): Promise<boolean> {
  const client = getDbClient();
  if (!client) {
    console.log('Modo Híbrido: Turso no está configurado. Usando almacenamiento local.');
    return false;
  }

  try {
    // Limpiamos tabla reportes para aplicar nuevos campos al migrar
    await client.execute('DROP TABLE IF EXISTS reportes;'); 
    await client.execute('DROP TABLE IF EXISTS clientes;');

    const statements = SCHEMA_SQL.split(';').filter((s) => s.trim().length > 0);
    for (const stmt of statements) {
      await client.execute(stmt);
    }

    // Insertar usuario por defecto 'jux' / 'Juan1200' si no existe
    await client.execute({
      sql: `INSERT OR IGNORE INTO usuarios (username, password, nombre, rol, fecha_creacion) VALUES (?, ?, ?, ?, ?)`,
      args: ['jux', 'Juan1200', 'Ing. JUX', 'Administrador & Soporte ISP', getLocalDateString()],
    });

    console.log('Base de datos Turso e tablas inicializadas con éxito.');
    return true;
  } catch (error) {
    console.error('Error al inicializar la base de datos Turso:', error);
    return false;
  }
}

// Helper para obtener la fecha YYYY-MM-DD en la zona horaria local
export function getLocalDateString(d: Date = new Date()): string {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Helper para obtener el mes amigable y la semana del mes
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
  const todayStr = getLocalDateString(new Date());
  const { semana, año } = getWeekAndYear(todayStr);

  const seeds: Reporte[] = [
    {
      id: 1,
      fecha_creacion: todayStr,
      tipo_actividad: 'soporte',
      folio: 'F-1001',
      nombre_cliente: 'Hospital Central',
      ip_cliente: '192.168.1.100',
      telefono_cliente: '555-0123',
      abonados_con_senal_degradada: 12,
      parametros_actuales: 'Latencia 150ms, Tx: -28dBm',
      equipo_de_rx: 'OLT Huawei MA5800',
      fecha_reporte_creado: todayStr,
      fecha_solucion: todayStr,
      accion_realizada: 'Ajuste de empalme y cambio de conector',
      parametros_mejorados: 'Latencia 12ms, Tx: -19dBm',
      descripcion_actividad: 'Reparación de fibra óptica',
      estado: 'Completado',
      evidencia_urls: [],
      seguimiento_realizado: 0,
      semana,
      año,
    }
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
        query += ' AND (nombre_cliente LIKE ? OR folio LIKE ? OR descripcion_actividad LIKE ?)';
        const term = `%${filters.busqueda}%`;
        args.push(term, term, term);
      }

      query += ' ORDER BY fecha_creacion DESC, id DESC';

      const result = await client.execute({ sql: query, args });
      return result.rows.map((row) => parseReporteRow(row));
    } catch (err: any) {
      if (err?.message?.includes('no such table') || err?.cause?.message?.includes('no such table')) {
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
        r.nombre_cliente?.toLowerCase().includes(q) ||
        r.folio?.toLowerCase().includes(q) ||
        r.descripcion_actividad?.toLowerCase().includes(q)
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
          fecha_creacion, tipo_actividad, folio, nombre_cliente, ip_cliente, telefono_cliente, 
          abonados_con_senal_degradada, parametros_actuales, equipo_de_rx, 
          fecha_reporte_creado, fecha_solucion, parametros_mejorados, accion_realizada,
          cliente_seguimiento, motivo_seguimiento, resultado_seguimiento, 
          descripcion_actividad, estado, evidencia_urls, seguimiento_realizado, 
          fecha_seguimiento, comentarios_adicionales, semana, año
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      const args: any[] = [
        reporteFinal.fecha_creacion,
        reporteFinal.tipo_actividad,
        reporteFinal.folio ?? null,
        reporteFinal.nombre_cliente ?? null,
        reporteFinal.ip_cliente ?? null,
        reporteFinal.telefono_cliente ?? null,
        reporteFinal.abonados_con_senal_degradada ?? null,
        reporteFinal.parametros_actuales ?? null,
        reporteFinal.equipo_de_rx ?? null,
        reporteFinal.fecha_reporte_creado ?? null,
        reporteFinal.fecha_solucion ?? null,
        reporteFinal.parametros_mejorados ?? null,
        reporteFinal.accion_realizada ?? null,
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

      // Insertar o actualizar el cliente en la tabla clientes
      if (reporteFinal.nombre_cliente) {
        await client.execute({
          sql: `INSERT OR IGNORE INTO clientes (folio, nombre, telefono, ip, fecha_registro, es_antena, activo) VALUES (?, ?, ?, ?, ?, 1, 1)`,
          args: [
            reporteFinal.folio ?? null, 
            reporteFinal.nombre_cliente, 
            reporteFinal.telefono_cliente ?? null, 
            reporteFinal.ip_cliente ?? null, 
            getLocalDateString()
          ]
        });
      }

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
    tipo_actividad: row.tipo_actividad as any,
    folio: row.folio || undefined,
    nombre_cliente: row.nombre_cliente || undefined,
    ip_cliente: row.ip_cliente || undefined,
    telefono_cliente: row.telefono_cliente || undefined,
    abonados_con_senal_degradada: row.abonados_con_senal_degradada || undefined,
    parametros_actuales: row.parametros_actuales || undefined,
    equipo_de_rx: row.equipo_de_rx || undefined,
    fecha_reporte_creado: row.fecha_reporte_creado || undefined,
    fecha_solucion: row.fecha_solucion || undefined,
    parametros_mejorados: row.parametros_mejorados || undefined,
    accion_realizada: row.accion_realizada || undefined,
    
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

// -------------------------------------------------------------
// OPERACIONES DE CLIENTES
// -------------------------------------------------------------

export async function upsertClientesMasivo(clientes: Cliente[]): Promise<{ insertados: number; actualizados: number }> {
  const client = getDbClient();
  if (!client) {
    console.log('No Turso connection to upsert clients.');
    return { insertados: 0, actualizados: 0 };
  }

  let insertados = 0;
  let actualizados = 0;

  for (const c of clientes) {
    try {
      const exists = await client.execute({
        sql: `SELECT id FROM clientes WHERE folio = ? OR (nombre = ? AND ip = ?)`,
        args: [c.folio || null, c.nombre, c.ip || null]
      });

      if (exists.rows && exists.rows.length > 0) {
        // Update
        await client.execute({
          sql: `UPDATE clientes SET nombre=?, telefono=?, ip=?, router=?, direccion=?, plan_internet=?, es_antena=?, activo=? WHERE id=?`,
          args: [
            c.nombre, c.telefono || null, c.ip || null, c.router || null, c.direccion || null, 
            c.plan_internet || null, c.es_antena ? 1 : 0, c.activo ? 1 : 0, 
            exists.rows[0].id
          ]
        });
        actualizados++;
      } else {
        // Insert
        await client.execute({
          sql: `INSERT INTO clientes (folio, nombre, telefono, ip, router, direccion, plan_internet, es_antena, activo, fecha_registro) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [
            c.folio || null, c.nombre, c.telefono || null, c.ip || null, c.router || null, 
            c.direccion || null, c.plan_internet || null, c.es_antena ? 1 : 0, c.activo ? 1 : 0, 
            getLocalDateString()
          ]
        });
        insertados++;
      }
    } catch (err) {
      console.error('Error upserting cliente:', c.nombre, err);
    }
  }

  return { insertados, actualizados };
}

export async function searchClientesActivos(query: string): Promise<Cliente[]> {
  const client = getDbClient();
  if (!client) return [];

  const term = `%${query.toLowerCase()}%`;
  
  try {
    const res = await client.execute({
      sql: `SELECT * FROM clientes 
            WHERE es_antena = 1 AND activo = 1 
            AND (LOWER(nombre) LIKE ? OR LOWER(ip) LIKE ? OR LOWER(folio) LIKE ?)
            ORDER BY nombre ASC
            LIMIT 10`,
      args: [term, term, term]
    });

    return res.rows.map(r => ({
      id: Number(r.id),
      folio: r.folio as string,
      nombre: r.nombre as string,
      telefono: r.telefono as string,
      ip: r.ip as string,
      router: r.router as string,
      direccion: r.direccion as string,
      plan_internet: r.plan_internet as string,
      es_antena: Boolean(r.es_antena),
      activo: Boolean(r.activo)
    }));
  } catch (err) {
    console.error('Error searching clients:', err);
    return [];
  }
}

export async function validateUserInDb(
  username: string,
  pass: string
): Promise<{ username: string; nombre: string; rol: string } | null> {
  const client = getDbClient();
  if (client) {
    try {
      await initDb();
      const res = await client.execute({
        sql: `SELECT username, nombre, rol FROM usuarios WHERE username = ? AND password = ?`,
        args: [username, pass],
      });
      if (res.rows && res.rows.length > 0) {
        const r = res.rows[0];
        return {
          username: String(r.username),
          nombre: String(r.nombre),
          rol: String(r.rol),
        };
      }
    } catch (err) {
      console.error('Error validando usuario en Turso DB:', err);
    }
  }

  // Fallback para desarrollo local
  if (username.toLowerCase() === 'jux' && pass === 'Juan1200') {
    return {
      username: 'jux',
      nombre: 'Ing. JUX',
      rol: 'Administrador & Soporte ISP',
    };
  }
  return null;
}

// -------------------------------------------------------------
// OPERACIONES DE GESTIÓN DE CONTRASEÑAS (TURSO)
// -------------------------------------------------------------

import { GrupoContrasena, Contrasena } from './types';

export async function fetchGruposContrasenas(): Promise<GrupoContrasena[]> {
  const client = getDbClient();
  if (!client) return [];
  try {
    const res = await client.execute('SELECT * FROM grupos_contrasenas ORDER BY nombre ASC');
    return res.rows.map(r => ({
      id: Number(r.id),
      nombre: String(r.nombre),
      fecha_creacion: r.fecha_creacion ? String(r.fecha_creacion) : undefined
    }));
  } catch (err) {
    console.error('Error fetching grupos de contraseñas:', err);
    return [];
  }
}

export async function insertGrupoContrasena(nombre: string): Promise<GrupoContrasena | null> {
  const client = getDbClient();
  if (!client) return null;
  try {
    const fecha = getLocalDateString();
    const res = await client.execute({
      sql: 'INSERT INTO grupos_contrasenas (nombre, fecha_creacion) VALUES (?, ?)',
      args: [nombre, fecha]
    });
    return { id: Number(res.lastInsertRowid), nombre, fecha_creacion: fecha };
  } catch (err) {
    console.error('Error insertando grupo de contraseñas:', err);
    return null;
  }
}

export async function updateGrupoContrasena(id: number, nombre: string): Promise<boolean> {
  const client = getDbClient();
  if (!client) return false;
  try {
    await client.execute({
      sql: 'UPDATE grupos_contrasenas SET nombre = ? WHERE id = ?',
      args: [nombre, id]
    });
    return true;
  } catch (err) {
    console.error('Error actualizando grupo de contraseñas:', err);
    return false;
  }
}

export async function deleteGrupoContrasena(id: number): Promise<boolean> {
  const client = getDbClient();
  if (!client) return false;
  try {
    await client.execute({
      sql: 'DELETE FROM grupos_contrasenas WHERE id = ?',
      args: [id]
    });
    return true;
  } catch (err) {
    console.error('Error eliminando grupo de contraseñas:', err);
    return false;
  }
}

export async function fetchContrasenas(grupo_id?: number): Promise<Contrasena[]> {
  const client = getDbClient();
  if (!client) return [];
  try {
    let sql = 'SELECT * FROM contrasenas';
    const args: any[] = [];
    if (grupo_id) {
      sql += ' WHERE grupo_id = ?';
      args.push(grupo_id);
    }
    sql += ' ORDER BY titulo ASC';
    
    const res = await client.execute({ sql, args });
    return res.rows.map(r => ({
      id: Number(r.id),
      grupo_id: Number(r.grupo_id),
      titulo: String(r.titulo),
      usuario: String(r.usuario),
      contrasena: String(r.contrasena),
      descripcion: r.descripcion ? String(r.descripcion) : undefined,
      fecha_creacion: r.fecha_creacion ? String(r.fecha_creacion) : undefined
    }));
  } catch (err) {
    console.error('Error fetching contraseñas:', err);
    return [];
  }
}

export async function insertContrasena(data: Omit<Contrasena, 'id'>): Promise<Contrasena | null> {
  const client = getDbClient();
  if (!client) return null;
  try {
    const fecha = getLocalDateString();
    const res = await client.execute({
      sql: `INSERT INTO contrasenas (grupo_id, titulo, usuario, contrasena, descripcion, fecha_creacion) 
            VALUES (?, ?, ?, ?, ?, ?)`,
      args: [data.grupo_id, data.titulo, data.usuario, data.contrasena, data.descripcion || null, fecha]
    });
    return { ...data, id: Number(res.lastInsertRowid), fecha_creacion: fecha };
  } catch (err) {
    console.error('Error insertando contraseña:', err);
    return null;
  }
}

export async function updateContrasena(id: number, data: Partial<Contrasena>): Promise<boolean> {
  const client = getDbClient();
  if (!client) return false;
  try {
    const fields = [];
    const args = [];
    if (data.grupo_id !== undefined) { fields.push('grupo_id = ?'); args.push(data.grupo_id); }
    if (data.titulo !== undefined) { fields.push('titulo = ?'); args.push(data.titulo); }
    if (data.usuario !== undefined) { fields.push('usuario = ?'); args.push(data.usuario); }
    if (data.contrasena !== undefined) { fields.push('contrasena = ?'); args.push(data.contrasena); }
    if (data.descripcion !== undefined) { fields.push('descripcion = ?'); args.push(data.descripcion); }
    
    if (fields.length === 0) return true;
    
    args.push(id);
    const sql = `UPDATE contrasenas SET ${fields.join(', ')} WHERE id = ?`;
    await client.execute({ sql, args });
    return true;
  } catch (err) {
    console.error('Error actualizando contraseña:', err);
    return false;
  }
}

export async function deleteContrasena(id: number): Promise<boolean> {
  const client = getDbClient();
  if (!client) return false;
  try {
    await client.execute({ sql: 'DELETE FROM contrasenas WHERE id = ?', args: [id] });
    return true;
  } catch (err) {
    console.error('Error eliminando contraseña:', err);
    return false;
  }
}
