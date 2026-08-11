import { NextResponse } from 'next/server';
import { getDbClient } from '@/lib/db';

export async function GET(req: Request) {
  try {
    const client = getDbClient();
    if (!client) {
      return NextResponse.json({ error: 'Database not initialized' }, { status: 500 });
    }

    const res = await client.execute({
      sql: `SELECT DISTINCT router FROM clientes WHERE router IS NOT NULL AND router != '' ORDER BY router ASC`,
      args: []
    });

    const routers = res.rows.map(r => r.router as string);

    return NextResponse.json({ routers });
  } catch (error: any) {
    console.error('Error in GET /api/clientes/routers:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
