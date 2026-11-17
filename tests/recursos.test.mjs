import test, { after, before } from "node:test";
import assert from "node:assert/strict";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { createServer } from "vite";
import { getRecursos } from "../src/services/recursos.js";

let server;
let RecursosList;
const recurso = {
  idRecurso: 1,
  nombre: "Recurso de prueba",
  descripcion: "Descripción de prueba",
  organizacion: { nombre: "Organización de prueba" },
  categorias: [{ nombre: "Categoría de prueba" }],
};

before(async () => {
  server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null } });
  RecursosList = (await server.ssrLoadModule("/src/components/ui/RecursosList.jsx")).default;
});

after(async () => { await server?.close(); });

function render(props = {}) {
  return renderToStaticMarkup(createElement(RecursosList, {
    recursos: [], loading: false, error: "", onRetry() {}, ...props,
  }));
}

test("listado muestra los datos del recurso y sus categorías", () => {
  const html = render({ recursos: [recurso] });
  for (const value of [recurso.nombre, recurso.descripcion, recurso.organizacion.nombre, recurso.categorias[0].nombre]) {
    assert.ok(html.includes(value));
  }
  assert.match(html, /<article/);
  assert.match(html, /1 recurso disponible/);
  assert.doesNotMatch(html, /No hay recursos|Cargando|Teléfono|Horario|Email|Dirección/);
});

test("solo presenta los datos opcionales existentes y escapa el texto", () => {
  const html = render({ recursos: [{
    ...recurso, nombre: "<script>alert(1)</script>", organizacion: "Entidad",
    categorias: ["Categoría"], telefono: "928000000", direccion: null, horario: "",
  }] });
  assert.match(html, /Entidad/);
  assert.match(html, /928000000/);
  assert.match(html, /&lt;script&gt;/);
  assert.doesNotMatch(html, /<script>|Dirección|Horario|undefined|\[object Object\]/);
});

test("listado vacío tiene un mensaje accesible y no muestra tarjetas", () => {
  const html = render();
  assert.match(html, /role="status"/);
  assert.match(html, /No hay recursos disponibles/);
  assert.doesNotMatch(html, /<article/);
});

test("carga tiene un mensaje accesible y oculta resultados anteriores", () => {
  const html = render({ loading: true, recursos: [recurso] });
  assert.match(html, /aria-busy="true"/);
  assert.match(html, /Cargando recursos/);
  assert.doesNotMatch(html, /No hay recursos|<article/);
});

test("error se anuncia y ofrece reintentar sin mostrar estado vacío", () => {
  const html = render({ error: "No se ha podido conectar con el servidor." });
  assert.match(html, /role="alert"/);
  assert.match(html, /No se ha podido conectar/);
  assert.match(html, /<button type="button">Volver a intentar/);
  assert.doesNotMatch(html, /No hay recursos|<article/);
});

test("GET público usa la configuración existente y no envía credenciales", async (t) => {
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(url, "/api/recursos");
    assert.equal(options.method ?? "GET", "GET");
    assert.equal(options.credentials, "omit");
    assert.deepEqual(options.headers, { Accept: "application/json" });
    return new Response(JSON.stringify([recurso]));
  });
  assert.deepEqual(await getRecursos(), [recurso]);
});

test("servicio admite listado vacío y contenido paginado de Spring", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response("[]"));
  assert.deepEqual(await getRecursos(), []);
  fetch.mock.mockImplementation(async () => new Response(JSON.stringify({ content: [recurso] })));
  assert.deepEqual(await getRecursos(), [recurso]);
});

test("fallo de conexión produce un mensaje comprensible", async (t) => {
  t.mock.method(globalThis, "fetch", async () => { throw new TypeError("detalle interno"); });
  await assert.rejects(getRecursos(), /No se ha podido conectar con el servidor/);
});

test("HTTP de error y respuestas inválidas no exponen detalles internos", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response("detalle interno", { status: 500 }));
  await assert.rejects(getRecursos(), /No se han podido cargar los recursos/);
  for (const body of ["invalid JSON", "{}", '[{"nombre":null}]']) {
    fetch.mock.mockImplementation(async () => new Response(body));
    await assert.rejects(getRecursos(), /listado de recursos no válido/);
  }
});

test("cancelar una petición conserva el motivo de cancelación", async (t) => {
  const controller = new AbortController();
  controller.abort();
  t.mock.method(globalThis, "fetch", async (url, { signal }) => {
    signal.throwIfAborted();
  });
  await assert.rejects(getRecursos(controller.signal), (error) => error === controller.signal.reason);
});
