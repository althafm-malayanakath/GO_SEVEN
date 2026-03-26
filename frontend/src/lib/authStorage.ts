export const AUTH_CHANGE_EVENT = 'go-seven-auth-change';

export interface StoredAuthUser {
  _id: string;
  name: string;
  email: string;
  phone: string;
  whatsappOptIn: boolean;
  role: string;
  token: string;
}

function canUseStorage() {
  return typeof window !== 'undefined';
}

function emitAuthChange() {
  if (!canUseStorage()) {
    return;
  }

  window.dispatchEvent(new Event(AUTH_CHANGE_EVENT));
}

export function readStoredUser(): StoredAuthUser | null {
  if (!canUseStorage()) {
    return null;
  }

  const stored = window.localStorage.getItem('user');

  if (!stored) {
    return null;
  }

  try {
    return JSON.parse(stored) as StoredAuthUser;
  } catch {
    clearStoredAuth();
    return null;
  }
}

export function getStoredToken() {
  if (!canUseStorage()) {
    return null;
  }

  return window.localStorage.getItem('token');
}

export function persistAuth(user: StoredAuthUser) {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.setItem('user', JSON.stringify(user));
  window.localStorage.setItem('token', user.token);
  emitAuthChange();
}

export function clearStoredAuth() {
  if (!canUseStorage()) {
    return;
  }

  window.localStorage.removeItem('user');
  window.localStorage.removeItem('token');
  emitAuthChange();
}
