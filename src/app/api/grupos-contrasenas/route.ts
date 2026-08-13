import { NextRequest, NextResponse } from 'next/server';
import { fetchGruposContrasenas, insertGrupoContrasena, updateGrupoContrasena, deleteGrupoContrasena } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const data = await fetchGruposContrasenas();
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error GET /api/grupos-contrasenas:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar grupos' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.nombre) {
      return NextResponse.json({ error: 'Nombre del grupo requerido' }, { status: 400 });
    }

    const nuevoGrupo = await insertGrupoContrasena(body.nombre);
    if (nuevoGrupo) {
      return NextResponse.json({ success: true, data: nuevoGrupo });
    } else {
      return NextResponse.json({ success: false, error: 'No se pudo crear el grupo' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error POST /api/grupos-contrasenas:', error);
    return NextResponse.json({ success: false, error: 'Error al guardar el grupo' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, nombre } = body;
    if (!id || !nombre) {
      return NextResponse.json({ error: 'ID y nombre requeridos' }, { status: 400 });
    }

    const success = await updateGrupoContrasena(id, nombre);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error PUT /api/grupos-contrasenas:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar el grupo' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID de grupo requerido' }, { status: 400 });
    }

    const success = await deleteGrupoContrasena(Number(id));
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error DELETE /api/grupos-contrasenas:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar el grupo' }, { status: 500 });
  }
}
