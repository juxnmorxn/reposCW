import { NextRequest, NextResponse } from 'next/server';
import { fetchContrasenas, insertContrasena, updateContrasena, deleteContrasena } from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const grupo_id = searchParams.get('grupo_id') ? Number(searchParams.get('grupo_id')) : undefined;

    const data = await fetchContrasenas(grupo_id);
    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error('Error GET /api/contrasenas:', error);
    return NextResponse.json({ success: false, error: 'Error al consultar contraseñas' }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    if (!body.grupo_id || !body.titulo) {
      return NextResponse.json({ error: 'Campos obligatorios requeridos (grupo_id, titulo)' }, { status: 400 });
    }

    const nuevaContrasena = await insertContrasena(body);
    if (nuevaContrasena) {
      return NextResponse.json({ success: true, data: nuevaContrasena });
    } else {
      return NextResponse.json({ success: false, error: 'No se pudo crear la contraseña' }, { status: 500 });
    }
  } catch (error) {
    console.error('Error POST /api/contrasenas:', error);
    return NextResponse.json({ success: false, error: 'Error al guardar la contraseña' }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const body = await req.json();
    const { id, ...data } = body;
    if (!id) {
      return NextResponse.json({ error: 'ID de contraseña requerido' }, { status: 400 });
    }

    const success = await updateContrasena(id, data);
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error PUT /api/contrasenas:', error);
    return NextResponse.json({ success: false, error: 'Error al actualizar la contraseña' }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) {
      return NextResponse.json({ error: 'ID de contraseña requerido' }, { status: 400 });
    }

    const success = await deleteContrasena(Number(id));
    return NextResponse.json({ success });
  } catch (error) {
    console.error('Error DELETE /api/contrasenas:', error);
    return NextResponse.json({ success: false, error: 'Error al eliminar la contraseña' }, { status: 500 });
  }
}
