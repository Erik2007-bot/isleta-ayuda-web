import { getProfile, submitAuth, updateProfileName } from "../services/auth.js";

export function createAuthSession(api = { getProfile, submitAuth, updateProfileName }) {
  let snapshot = { user: null, expiresAt: null, message: "", savingName: false };
  let token = null;
  let generation = 0;
  let profileVersion = 0;
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
    publish({ user: null, expiresAt: null, message, savingName: false });
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
    publish({ user, expiresAt, message: "", savingName: false });
    checkExpiry();
  }
  function refreshProfile() {
    return requestProfile((currentToken) => api.getProfile(currentToken));
  }
  function saveProfileName(nombre) {
    return requestProfile((currentToken) => api.updateProfileName(currentToken, nombre), { savingName: true });
  }
  async function requestProfile(request, { savingName = false } = {}) {
    checkExpiry();
    if (!token || (savingName && snapshot.savingName)) return;
    const attempt = generation;
    const version = profileVersion;
    const currentToken = token;
    if (savingName) publish({ ...snapshot, savingName: true });
    try {
      const user = await request(currentToken);
      checkExpiry();
      if (attempt !== generation) return;
      if (savingName) profileVersion++;
      if (savingName || version === profileVersion) publish({ ...snapshot, user });
      return user;
    } catch (error) {
      if (attempt !== generation) return;
      if (error.status === 401) logout("Tu sesión ha caducado. Inicia sesión de nuevo.");
      throw error;
    } finally {
      if (savingName && attempt === generation) publish({ ...snapshot, savingName: false });
    }
  }
  return {
    subscribe(listener) { listeners.add(listener); return () => listeners.delete(listener); },
    getSnapshot: () => snapshot,
    login, logout, refreshProfile, saveProfileName, checkExpiry,
  };
}
