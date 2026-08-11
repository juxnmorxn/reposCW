import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { action, filterType, filterValue } = data; // action: 'activate' | 'deactivate', filterType: 'todos' | 'antena' | 'fibra' | 'router', filterValue: string (if router)

    if (!action || !filterType) {
      return NextResponse.json({ error: 'Faltan parámetros requeridos' }, { status: 400 });
    }

    const client = getDbClient();
    if (!client) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const activo = action === 'activate' ? 1 : 0;
    
    let sql = 'UPDATE clientes SET activo = ? WHERE 1=1';
    const args: any[] = [activo];

    if (filterType === 'antena') {
      sql += ' AND es_antena = 1';
    } else if (filterType === 'fibra') {
      sql += ' AND es_antena = 0';
    } else if (filterType === 'router') {
      if (!filterValue) return NextResponse.json({ error: 'Falta especificar el Router' }, { status: 400 });
      sql += ' AND router = ?';
      args.push(filterValue);
    }

    const res = await client.execute({ sql, args });

    return NextResponse.json({ success: true, rowsAffected: res.rowsAffected });
  } catch (error: any) {
    console.error('Error in POST /api/clientes/bulk:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
