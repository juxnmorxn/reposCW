import { NextResponse } from 'next/server';
import { validateUserInDb } from '@/lib/db';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, error: 'Usuario y contraseña son requeridos' },
        { status: 400 }
      );
    }

    const user = await validateUserInDb(username, password);

    if (user) {
      return NextResponse.json({ success: true, user });
    } else {
      return NextResponse.json(
        { success: false, error: 'Usuario o contraseña incorrectos' },
        { status: 401 }
      );
    }
  } catch (error) {
    console.error('Error POST /api/auth/login:', error);
    return NextResponse.json(
      { success: false, error: 'Error en el servidor de autenticación' },
      { status: 500 }
    );
  }
}
