import { NextRequest, NextResponse } from 'next/server';
import { fetchReportes, insertReporte, updateReporte, deleteReporte, initDb } from '@/lib/db';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const semana = searchParams.get('semana') ? Number(searchParams.get('semana')) : undefined;
    const año = searchParams.get('año') ? Number(searchParams.get('año')) : undefined;
    const tipo = searchParams.get('tipo') || undefined;
    const estado = searchParams.get('estado') || undefined;
    const busqueda = searchParams.get('busqueda') || undefined;
    const fechaExacta = searchParams.get('fechaExacta') || undefined;
    const fechaDesde = searchParams.get('fechaDesde') || undefined;
    const fechaHasta = searchParams.get('fechaHasta') || undefined;

    const data = await fetchReportes({ semana, año, tipo, estado, busqueda, fechaExacta, fechaDesde, fechaHasta });
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error GET /api/reportes:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar reportes' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.tipo_actividad || !body.fecha_creacion) {
      return NextResponse.json({ error: 'Campos obligatorios requeridos' }, { status: 400 });
    }

    const nuevoReporte = await insertReporte(body);
    return NextResponse.json({ success: true, data: nuevoReporte });
  } catch (error) {
    console.error('Error POST /api/reportes:', error);
    return NextResponse.json({ success: false, error: 'Error al guardar el reporte' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID de reporte requerido' }, { status: 400 });
    }

    const success = await updateReporte(id, data);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error PUT /api/reportes:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar el reporte' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID de reporte requerido' }, { status: 400 });
    }

    const success = await deleteReporte(Number(id));
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error DELETE /api/reportes:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar el reporte' }, { status: 500 });
  }
}
