export interface UserSession {
  username: string;
  nombre: string;
  rol: string;
  email?: string;
}

const AUTH_STORAGE_KEY = 'repos_isp_active_user_session';

export const DEFAULT_USERS: UserSession[] = [
  {
    username: 'soporte',
    nombre: 'Ingeniero de Soporte ISP',
    rol: 'Ingeniero de Campo',
    email: 'soporte@isp.com',
  },
  {
    username: 'admin',
    nombre: 'Administrador de Redes ISP',
    rol: 'Administrador',
    email: 'admin@isp.com',
  },
];

export function getActiveSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_USERS[0]; // Usuario soporte por defecto
  } catch {
    return DEFAULT_USERS[0];
  }
}

export function setActiveSession(user: UserSession): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(user));
}

export function clearActiveSession(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

export function authenticateUser(username: string, pass: string): UserSession | null {
  // Simulación de verificación segura
  const matched = DEFAULT_USERS.find((u) => u.username.toLowerCase() === username.toLowerCase());
  if (matched && pass.length >= 4) {
    setActiveSession(matched);
    return matched;
  }
  // Si ingresa con cualquier usuario nuevo de prueba
  if (username.trim() && pass.trim()) {
    const customUser: UserSession = {
      username: username.toLowerCase().trim(),
      nombre: `Ing. ${username.charAt(0).toUpperCase() + username.slice(1)}`,
      rol: 'Ingeniero de Soporte',
    };
    setActiveSession(customUser);
    return customUser;
  }
  return null;
}
