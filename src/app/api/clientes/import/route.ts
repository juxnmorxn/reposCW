import { NextResponse } from 'next/server';
import { upsertClientesMasivo } from '@/lib/db';
import { Cliente } from '@/lib/types';

export async function POST(req: Request) {
  try {
    const data = await req.json();
    
    if (!Array.isArray(data)) {
      return NextResponse.json({ error: 'Payload must be an array of clients' }, { status: 400 });
    }

    const { insertados, actualizados } = await upsertClientesMasivo(data as Cliente[]);

    return NextResponse.json({
      success: true,
      insertados,
      actualizados,
      total: insertados + actualizados
    });
  } catch (error: any) {
    console.error('Error importing clients:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
