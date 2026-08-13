import { NextResponse } from 'next/server';
import { searchClientesActivos } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const query = searchParams.get('q');
    
    if (!query || query.trim().length < 2) {
      return NextResponse.json({ results: [] });
    }

    const results = await searchClientesActivos(query.trim());
    
    return NextResponse.json({ results });
  } catch (error: any) {
    console.error('Error searching clients:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
