import { getProfile, submitAuth } from "../services/auth.js";

export function createAuthSession(api = { getProfile, submitAuth }) {
  let snapshot = { user: null, expiresAt: null, message: "" };
  let token = null;
  let generation = 0;
  let timer;
  const listeners = new Set();
  const publish = (next) => {
    snapshot = next;
    listeners.forEach((listener) => listener());
  };
  function logout(message = "") {
    generation++;
    clearTimeout(timer);
    token = null;
    publish({ user: null, expiresAt: null, message });
  }
  function checkExpiry() {
    clearTimeout(timer);
    if (!token) return;
    const remaining = snapshot.expiresAt - Date.now();
    if (remaining <= 0) {
      logout("Tu sesión ha caducado. Inicia sesión de nuevo.");
    } else {
      timer = setTimeout(checkExpiry, Math.min(remaining, 2147483647));
    }
  }
  async function login(values) {
    logout();
    const attempt = generation;
    const data = await api.submitAuth("login", values);
    const deadlines = [];
    if (data.expiresAt) deadlines.push(Date.parse(data.expiresAt));
    if (Number.isFinite(data.expiresIn) && data.expiresIn > 0) deadlines.push(Date.now() + data.expiresIn * 1000);
    const expiresAt = Math.min(...deadlines.filter(Number.isFinite));
    if (!Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
      throw new Error("La sesión recibida ha caducado. Inicia sesión de nuevo.");
    }
    const user = await api.getProfile(data.token);
    if (attempt !== generation) throw new Error("El inicio de sesión se ha cancelado.");
    if (expiresAt <= Date.now()) throw new Error("La sesión recibida ha caducado. Inicia sesión de nuevo.");
    token = data.token;
    publish({ user, expiresAt, message: "" });
    checkExpiry();
  }
  async function refreshProfile() {
    checkExpiry();
    if (!token) return;
    const attempt = generation;
    try {
      const user = await api.getProfile(token);
      checkExpiry();
      if (attempt === generation) publish({ ...snapshot, user });
    } catch (error) {
      if (attempt !== generation) return;
      if (error.status === 401) logout("Tu sesión ha caducado. Inicia sesión de nuevo.");
      throw error;
    }
  }
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => snapshot,
    login, logout, refreshProfile, checkExpiry,
  };
}
