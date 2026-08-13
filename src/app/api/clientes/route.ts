import { NextResponse } from 'next/server';
import { getDbClient, getLocalDateString } from '@/lib/db';
import { Cliente } from '@/lib/types';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const busqueda = searchParams.get('busqueda') || '';
    const tipo = searchParams.get('tipo') || 'todos'; // 'todos', 'antena', 'fibra'
    const routerFiltro = searchParams.get('router');
    const limit = parseInt(searchParams.get('limit') || '50', 10);
    const offset = parseInt(searchParams.get('offset') || '0', 10);

    const client = getDbClient();
    if (!client) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    let sql = 'SELECT * FROM clientes WHERE 1=1';
    const args: any[] = [];

    if (busqueda.trim() !== '') {
      const term = `%${busqueda.trim().toLowerCase()}%`;
      sql += ' AND (LOWER(nombre) LIKE ? OR LOWER(ip) LIKE ? OR LOWER(folio) LIKE ? OR LOWER(telefono) LIKE ?)';
      args.push(term, term, term, term);
    }

    if (tipo === 'antena') {
      sql += ' AND es_antena = 1';
    } else if (tipo === 'fibra') {
      sql += ' AND es_antena = 0';
    }

    if (routerFiltro && routerFiltro !== 'todos') {
      sql += ' AND router = ?';
      args.push(routerFiltro);
    }

    sql += ' ORDER BY id DESC LIMIT ? OFFSET ?';
    args.push(limit, offset);

    const res = await client.execute({ sql, args });

    // Contar el total para paginación (con mismos filtros)
    let countSql = 'SELECT COUNT(*) as total FROM clientes WHERE 1=1';
    const countArgs: any[] = [];

    if (busqueda.trim() !== '') {
      const term = `%${busqueda.trim().toLowerCase()}%`;
      countSql += ' AND (LOWER(nombre) LIKE ? OR LOWER(ip) LIKE ? OR LOWER(folio) LIKE ? OR LOWER(telefono) LIKE ?)';
      countArgs.push(term, term, term, term);
    }
    if (tipo === 'antena') {
      countSql += ' AND es_antena = 1';
    } else if (tipo === 'fibra') {
      countSql += ' AND es_antena = 0';
    }
    if (routerFiltro && routerFiltro !== 'todos') {
      countSql += ' AND router = ?';
      countArgs.push(routerFiltro);
    }
    const countRes = await client.execute({ sql: countSql, args: countArgs });
    const totalCount = countRes.rows[0]?.total ? Number(countRes.rows[0].total) : 0;

    const data: Cliente[] = res.rows.map(r => ({
      id: Number(r.id),
      folio: r.folio as string,
      nombre: r.nombre as string,
      telefono: r.telefono as string,
      ip: r.ip as string,
      router: r.router as string,
      direccion: r.direccion as string,
      plan_internet: r.plan_internet as string,
      es_antena: Boolean(r.es_antena),
      activo: Boolean(r.activo),
      fecha_registro: r.fecha_registro as string
    }));

    return NextResponse.json({ data, total: totalCount });
  } catch (error: any) {
    console.error('Error in GET /api/clientes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const data: Cliente = await req.json();
    const client = getDbClient();
    if (!client) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const res = await client.execute({
      sql: `INSERT INTO clientes (folio, nombre, telefono, ip, router, direccion, plan_internet, es_antena, activo, fecha_registro) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        data.folio || null, 
        data.nombre, 
        data.telefono || null, 
        data.ip || null, 
        data.router || null, 
        data.direccion || null, 
        data.plan_internet || null, 
        data.es_antena ? 1 : 0, 
        data.activo ?? 1, 
        getLocalDateString()
      ]
    });

    return NextResponse.json({ success: true, id: res.lastInsertRowid?.toString() });
  } catch (error: any) {
    console.error('Error in POST /api/clientes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const data: Cliente = await req.json();
    if (!data.id) return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });

    const client = getDbClient();
    if (!client) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    await client.execute({
      sql: `UPDATE clientes 
            SET folio=?, nombre=?, telefono=?, ip=?, router=?, direccion=?, plan_internet=?, es_antena=?, activo=?
            WHERE id=?`,
      args: [
        data.folio || null, 
        data.nombre, 
        data.telefono || null, 
        data.ip || null, 
        data.router || null, 
        data.direccion || null, 
        data.plan_internet || null, 
        data.es_antena ? 1 : 0, 
        data.activo ?? 1, 
        data.id
      ]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in PUT /api/clientes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing client ID' }, { status: 400 });

    const client = getDbClient();
    if (!client) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    await client.execute({
      sql: 'DELETE FROM clientes WHERE id = ?',
      args: [id]
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error in DELETE /api/clientes:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
