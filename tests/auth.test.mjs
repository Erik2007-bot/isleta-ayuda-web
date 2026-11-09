import test from "node:test";
import assert from "node:assert/strict";
import { createAuthSession } from "../src/auth/session.js";
import { getProfile, submitAuth } from "../src/services/auth.js";

const user = { idUsuario: 1, nombre: "Ana", email: "ana@example.com", rol: "USUARIO" };
const credentials = { email: user.email, password: "test password" };
const response = () => ({ token: "test-token", expiresIn: 60, expiresAt: new Date(Date.now() + 60000).toISOString() });
const api = (overrides = {}) => ({ submitAuth: async () => response(), getProfile: async () => user, ...overrides });

test("login consulta el perfil con el token y logout elimina la sesión", async () => {
  const session = createAuthSession(api({
    submitAuth: async (mode, values) => { assert.equal(mode, "login"); assert.deepEqual(values, credentials); return response(); },
    getProfile: async (token) => { assert.equal(token, "test-token"); return user; },
  }));
  let notifications = 0;
  const unsubscribe = session.subscribe(() => notifications++);
  try {
    assert.equal(session.getSnapshot().user, null);
    await session.login(credentials);
    assert.deepEqual(session.getSnapshot().user, user);
    assert.equal("token" in session.getSnapshot(), false);
    assert.equal(createAuthSession(api()).getSnapshot().user, null);
    session.logout();
    assert.equal(session.getSnapshot().user, null);
    assert.equal(session.getSnapshot().expiresAt, null);
    assert.ok(notifications >= 3);
  } finally { unsubscribe(); session.logout(); }
});

test("un 401 al consultar /me invalida la sesión", async () => {
  let unauthorized = false;
  const session = createAuthSession(api({ getProfile: async () => {
    if (unauthorized) throw Object.assign(new Error("Unauthorized"), { status: 401 });
    return user;
  } }));
  try {
    await session.login(credentials);
    unauthorized = true;
    await assert.rejects(session.refreshProfile());
    assert.equal(session.getSnapshot().user, null);
    assert.match(session.getSnapshot().message, /caducado/);
  } finally { session.logout(); }
});

test("un fallo de red no se confunde con un 401", async () => {
  let offline = false;
  const session = createAuthSession(api({ getProfile: async () => {
    if (offline) throw new Error("No se ha podido conectar");
    return user;
  } }));
  try {
    await session.login(credentials);
    offline = true;
    await assert.rejects(session.refreshProfile());
    assert.deepEqual(session.getSnapshot().user, user);
  } finally { session.logout(); }
});

test("caducidad automática elimina la sesión", async () => {
  const session = createAuthSession(api({ submitAuth: async () => ({ token: "test-token", expiresIn: 0.03 }) }));
  try {
    await session.login(credentials);
    await new Promise((resolve) => setTimeout(resolve, 70));
    assert.equal(session.getSnapshot().user, null);
    assert.match(session.getSnapshot().message, /caducado/);
  } finally { session.logout(); }
});

test("rechaza sesiones caducadas o sin fecha utilizable", async () => {
  for (const data of [{ token: "x", expiresAt: "2020-01-01" }, { token: "x" }]) {
    const session = createAuthSession(api({ submitAuth: async () => data }));
    await assert.rejects(session.login(credentials), /caducado/);
    assert.equal(session.getSnapshot().user, null);
  }
});

test("cerrar sesión durante el login impide restaurarla con una respuesta tardía", async () => {
  let resolveProfile;
  const session = createAuthSession(api({ getProfile: () => new Promise((resolve) => { resolveProfile = resolve; }) }));
  const login = session.login(credentials);
  await Promise.resolve();
  session.logout();
  resolveProfile(user);
  await assert.rejects(login, /cancelado/);
  assert.equal(session.getSnapshot().user, null);
});

test("un 401 tardío de una sesión anterior no cierra una sesión nueva", async () => {
  let rejectProfile;
  let calls = 0;
  const session = createAuthSession(api({ getProfile: async () => {
    calls++;
    if (calls === 2) return new Promise((resolve, reject) => { rejectProfile = reject; });
    return user;
  } }));
  try {
    await session.login(credentials);
    const refresh = session.refreshProfile();
    await session.login(credentials);
    rejectProfile(Object.assign(new Error("Unauthorized"), { status: 401 }));
    await refresh;
    assert.deepEqual(session.getSnapshot().user, user);
  } finally { session.logout(); }
});

test("servicio envía Bearer y no expone respuestas sensibles", async () => {
  const originalFetch = globalThis.fetch;
  try {
    globalThis.fetch = async (url, options) => {
      assert.equal(url, "/api/auth/me");
      assert.equal(options.headers.Authorization, "Bearer test-token");
      assert.equal(options.credentials, "omit");
      return new Response(JSON.stringify({ ...user, password: "sensitive" }));
    };
    assert.deepEqual(await getProfile("test-token"), user);
    globalThis.fetch = async () => new Response("sensitive", { status: 401 });
    await assert.rejects(getProfile("test-token"), (error) => error.status === 401 && !error.message.includes("sensitive"));
    for (const status of [400, 401, 409, 500]) {
      globalThis.fetch = async () => new Response("sensitive", { status });
      await assert.rejects(submitAuth("login", credentials), (error) => !error.message.includes("sensitive"));
    }
    globalThis.fetch = async () => new Response(JSON.stringify(response()));
    assert.equal((await submitAuth("login", credentials)).token, "test-token");
    globalThis.fetch = async () => new Response("{}");
    await assert.rejects(getProfile("test-token"), /no válido/);
    await assert.rejects(submitAuth("login", credentials), /confirmar/);
  } finally { globalThis.fetch = originalFetch; }
});
