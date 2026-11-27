import test, { before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { act, createElement } from "react";
import { JSDOM } from "jsdom";
import { createServer } from "vite";

const user = { idUsuario: 1, nombre: "Ana", email: "ana@example.com", rol: "USER" };
let dom;
let server;
let createRoot;
let Perfil;
let AuthProvider;
let useAuth;
let root;
let auth;

before(async () => {
  dom = new JSDOM("<!doctype html><div id=\"root\"></div>", { url: "http://localhost/perfil" });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  ({ createRoot } = await import("react-dom/client"));
  server = await createServer({ server: { middlewareMode: true, ws: false, watch: null } });
  Perfil = (await server.ssrLoadModule("/src/pages/Perfil.jsx")).default;
  AuthProvider = (await server.ssrLoadModule("/src/auth/AuthProvider.jsx")).default;
  ({ useAuth } = await server.ssrLoadModule("/src/auth/AuthContext.js"));
});

afterEach(async () => {
  await act(async () => {
    auth?.logout();
    root?.unmount();
  });
});

after(async () => {
  await server?.close();
  dom?.window.close();
  delete globalThis.window;
  delete globalThis.document;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

function AppDePrueba() {
  auth = useAuth();
  return auth.user ? createElement(Perfil) : null;
}

async function montar(t, guardar) {
  const put = t.mock.fn(guardar);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    if (url === "/api/auth/login") {
      return Response.json({ token: "test-token", expiresIn: 60 });
    }
    if (url === "/api/auth/me" && !options.method) return Response.json(user);
    return put(url, options);
  });
  root = createRoot(document.getElementById("root"));
  await act(async () => root.render(createElement(AuthProvider, null, createElement(AppDePrueba))));
  await act(async () => auth.login({ email: user.email, password: "clave de prueba" }));
  return put;
}

function campoNombre() {
  return document.querySelector('input[name="nombre"]');
}

async function escribirNombre(nombre) {
  const input = campoNombre();
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, nombre);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
}

function enviarFormulario() {
  document.querySelector("form").dispatchEvent(new dom.window.Event("submit", { bubbles: true, cancelable: true }));
}

test("muestra el nombre y lo guarda con JWT sin duplicar peticiones", async (t) => {
  let resolverGuardado;
  const put = await montar(t, () => new Promise((resolve) => { resolverGuardado = resolve; }));
  const guardar = document.querySelector('button[type="submit"]');
  assert.equal(campoNombre().value, "Ana");
  assert.equal(document.querySelector(".auth__profile dd").textContent, "Ana");
  assert.equal(document.querySelector("label").htmlFor, campoNombre().id);

  await escribirNombre("  Ana María  ");
  await act(async () => {
    enviarFormulario();
    enviarFormulario();
  });
  assert.equal(put.mock.callCount(), 1);
  assert.equal(guardar.matches(":disabled"), true);
  const [url, options] = put.mock.calls[0].arguments;
  assert.equal(url, "/api/auth/me/nombre");
  assert.equal(options.method, "PUT");
  assert.equal(options.headers.Authorization, "Bearer test-token");
  assert.deepEqual(JSON.parse(options.body), { nombre: "Ana María" });

  await act(async () => resolverGuardado(Response.json({ ...user, nombre: "Ana María" })));
  assert.equal(guardar.matches(":disabled"), false);
  assert.equal(document.querySelector(".auth__profile dd").textContent, "Ana María");
  assert.equal(campoNombre().value, "Ana María");
  assert.equal(auth.user.nombre, "Ana María");
  assert.match(document.querySelector("form [role=status]").textContent, /guardado correctamente/);

  await act(async () => document.querySelector('button[type="button"]').click());
  assert.equal(auth.user, null);
});

test("rechaza nombres vacíos, en blanco o de más de 100 caracteres", async (t) => {
  const put = await montar(t);
  for (const [nombre, mensaje] of [
    ["", /Introduce tu nombre/],
    ["   ", /Introduce tu nombre/],
    ["a".repeat(101), /100 caracteres/],
  ]) {
    await escribirNombre(nombre);
    await act(async () => enviarFormulario());
    const input = campoNombre();
    const error = document.getElementById(input.getAttribute("aria-describedby"));
    assert.equal(input.getAttribute("aria-invalid"), "true");
    assert.equal(document.activeElement, input);
    assert.equal(error.getAttribute("role"), "alert");
    assert.match(error.textContent, mensaje);
  }
  assert.equal(put.mock.callCount(), 0);
  assert.equal(auth.user.nombre, "Ana");
});

test("anuncia un fallo de guardado y permite reintentar", async (t) => {
  const nombre = "a".repeat(100);
  let falla = true;
  const put = await montar(t, () => falla
    ? new Response(null, { status: 500 })
    : Response.json({ ...user, nombre }));

  await escribirNombre(nombre);
  await act(async () => enviarFormulario());
  assert.match(document.querySelector("form > [role=alert]").textContent, /No se ha podido guardar/);
  assert.equal(campoNombre().value, nombre);
  assert.equal(auth.user.nombre, "Ana");
  assert.equal(document.querySelector('button[type="submit"]').matches(":disabled"), false);

  falla = false;
  await act(async () => enviarFormulario());
  assert.equal(put.mock.callCount(), 2);
  assert.equal(auth.user.nombre, nombre);
  assert.equal(document.querySelector("form > [role=alert]").textContent, "");
});
