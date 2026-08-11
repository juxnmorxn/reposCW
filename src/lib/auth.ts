export interface UserSession {
  username: string;
  nombre: string;
  rol: string;
  email?: string;
}

const AUTH_STORAGE_KEY = 'repos_isp_active_user_session';

export const DEFAULT_USER: UserSession = {
  username: 'jux',
  nombre: 'Ing. JUX',
  rol: 'Administrador & Soporte ISP',
  email: 'jux@isp.com',
};

export function getActiveSession(): UserSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const data = localStorage.getItem(AUTH_STORAGE_KEY);
    return data ? JSON.parse(data) : DEFAULT_USER;
  } catch {
    return DEFAULT_USER;
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

export async function authenticateUser(username: string, pass: string): Promise<UserSession | null> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password: pass }),
    });

    if (res.ok) {
      const json = await res.json();
      if (json.success && json.user) {
        setActiveSession(json.user);
        return json.user;
      }
    }
  } catch (err) {
    console.error('Error invocando API login:', err);
  }

  // Fallback local
  if (username.toLowerCase() === 'jux' && pass === 'Juan1200') {
    setActiveSession(DEFAULT_USER);
    return DEFAULT_USER;
  }
  return null;
}
