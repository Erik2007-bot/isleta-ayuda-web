import test, { before, after, afterEach } from "node:test";
import assert from "node:assert/strict";
import { createElement, act } from "react";
import { JSDOM, VirtualConsole } from "jsdom";
import { createServer } from "vite";
import { actualizarParametro, filtrarRecursos, obtenerCategorias } from "../src/recursos/filtros.js";

const alimentacion = { id: 1, nombre: "Alimentación", slug: "alimentacion" };
const formacion = { id: 2, nombre: "Formación", slug: "formacion" };
const datos = [
  { id: 1, nombre: "Comedor", descripcion: "Comida y orientación", categorias: [alimentacion] },
  { id: 2, nombre: "Orientación laboral", descripcion: "Talleres", categorias: [formacion] },
  { id: 3, nombre: "Apoyo", descripcion: "Comida", categorias: [alimentacion, formacion] },
  { id: 4, nombre: "Información", descripcion: null, categorias: [] },
];

let server;
let dom;
let Recursos;
let SearchBar;
let createRoot;
let createMemoryRouter;
let RouterProvider;
let root;
let router;
let container;
const erroresDom = [];
const formDataOriginal = globalThis.FormData;

before(async () => {
  dom = new JSDOM("<!doctype html><html><body></body></html>", {
    url: "http://localhost/recursos",
    virtualConsole: new VirtualConsole().on("jsdomError", (error) => erroresDom.push(error)),
  });
  globalThis.window = dom.window;
  globalThis.document = dom.window.document;
  globalThis.FormData = dom.window.FormData;
  globalThis.IS_REACT_ACT_ENVIRONMENT = true;
  ({ createRoot } = await import("react-dom/client"));
  ({ createMemoryRouter, RouterProvider } = await import("react-router-dom"));
  server = await createServer({ server: { middlewareMode: true, hmr: false, watch: null } });
  Recursos = (await server.ssrLoadModule("/src/pages/Recursos.jsx")).default;
  SearchBar = (await server.ssrLoadModule("/src/components/ui/SearchBar.jsx")).default;
});

afterEach(async () => {
  if (root) await act(async () => root.unmount());
  router?.dispose();
  container?.remove();
  root = null;
  assert.deepEqual(erroresDom.splice(0), []);
});

after(async () => {
  await server?.close();
  dom?.window.close();
  delete globalThis.window;
  delete globalThis.document;
  globalThis.FormData = formDataOriginal;
  delete globalThis.IS_REACT_ACT_ENVIRONMENT;
});

async function montar(t, path = "/recursos", recursos = datos) {
  const fetch = t.mock.method(globalThis, "fetch", async () => new Response(JSON.stringify(recursos)));
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  router = createMemoryRouter([
    { path: "/", element: createElement(SearchBar) },
    { path: "/recursos", element: createElement(Recursos) },
  ], { initialEntries: [path] });
  await act(async () => root.render(createElement(RouterProvider, { router })));
  return fetch;
}

async function escribir(value) {
  const input = container.querySelector('input[name="q"]');
  await act(async () => {
    Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set.call(input, value);
    input.dispatchEvent(new dom.window.Event("input", { bubbles: true }));
  });
}

async function buscar(value) {
  await escribir(value);
  await act(async () => container.querySelector("form").dispatchEvent(
    new dom.window.Event("submit", { bubbles: true, cancelable: true }),
  ));
}

async function seleccionar(value) {
  await act(async () => {
    const select = container.querySelector("select");
    select.value = value;
    select.dispatchEvent(new dom.window.Event("change", { bubbles: true }));
  });
}

async function limpiar(texto) {
  const button = [...container.querySelectorAll("button")].find((item) => item.textContent.startsWith(texto));
  assert.ok(button);
  await act(async () => button.click());
}

function ids(recursos) { return recursos.map((recurso) => recurso.id); }
function parametros() { return new URLSearchParams(router.state.location.search); }
function nombres() { return [...container.querySelectorAll("article h2")].map((item) => item.textContent); }

test("busca por nombre o descripción ignorando mayúsculas, acentos y espacios", () => {
  assert.deepEqual(ids(filtrarRecursos(datos, "  ORIENTACION  ")), [1, 2]);
  assert.deepEqual(ids(filtrarRecursos(datos, "informacion")), [4]);
  assert.deepEqual(ids(filtrarRecursos(datos, "   ")), [1, 2, 3, 4]);
  assert.deepEqual(ids(filtrarRecursos(datos, "<script>")), []);
  assert.deepEqual(ids(filtrarRecursos(datos, "comida", "formacion")), [3]);
});

test("categorías proceden de toda la API, se deduplican y admiten slug, id y nombre", () => {
  assert.deepEqual(obtenerCategorias(datos), [
    { value: "alimentacion", label: "Alimentación" }, { value: "formacion", label: "Formación" },
  ]);
  const recursos = [{ id: 1, nombre: "Ayuda", categorias: [null, {}, { idCategoria: 8, nombre: "Salud" }, "Vivienda"] }];
  assert.deepEqual(obtenerCategorias(recursos), [{ value: "8", label: "Salud" }, { value: "Vivienda", label: "Vivienda" }]);
  assert.deepEqual(ids(filtrarRecursos(recursos, "", "8")), [1]);
  assert.deepEqual(filtrarRecursos(datos, "", "desconocida"), []);
});

test("actualizar y limpiar un parámetro conserva el otro y parámetros ajenos", () => {
  const original = new URLSearchParams("q=comida&categoria=alimentacion&origen=inicio");
  assert.equal(actualizarParametro(original, "q", "").toString(), "categoria=alimentacion&origen=inicio");
  assert.equal(actualizarParametro(original, "categoria", "").toString(), "q=comida&origen=inicio");
  assert.equal(actualizarParametro(original, "q", "  ayuda & salud  ").get("q"), "ayuda & salud");
  assert.equal(original.get("q"), "comida");
});

test("enlace directo restaura controles, combina filtros y anuncia el contador", async (t) => {
  await montar(t, "/recursos?q=COMIDA&categoria=formacion");
  assert.equal(container.querySelector("input").value, "COMIDA");
  assert.equal(container.querySelector("select").value, "formacion");
  assert.deepEqual(nombres(), ["Apoyo"]);
  assert.match(container.querySelector('[role="status"]').textContent, /1 de 4 recursos/);
  assert.equal(container.querySelectorAll("select option").length, 3);
  const input = container.querySelector("input");
  assert.equal(container.querySelector("label").htmlFor, input.id);
  assert.equal(container.querySelector("select").getAttribute("aria-controls"), "recursos-resultados");
});

test("la barra de inicio sigue navegando a recursos con q en la URL", async (t) => {
  const fetch = await montar(t, "/");
  assert.equal(fetch.mock.callCount(), 0);
  await buscar("orientación");
  assert.equal(router.state.location.pathname, "/recursos");
  assert.equal(parametros().get("q"), "orientación");
  assert.equal(container.querySelector("input").value, "orientación");
  assert.deepEqual(nombres(), ["Comedor", "Orientación laboral"]);
  assert.equal(fetch.mock.callCount(), 1);
});

test("buscar conserva categoría y parámetros, permite un carácter y búsqueda vacía", async (t) => {
  const fetch = await montar(t, "/recursos?categoria=alimentacion&origen=inicio");
  await buscar("  orientación  ");
  assert.equal(parametros().get("q"), "orientación");
  assert.equal(parametros().get("categoria"), "alimentacion");
  assert.equal(parametros().get("origen"), "inicio");
  assert.deepEqual(nombres(), ["Comedor"]);
  await buscar("a");
  assert.equal(parametros().get("q"), "a");
  await buscar("");
  assert.equal(parametros().has("q"), false);
  assert.equal(parametros().get("categoria"), "alimentacion");
  assert.deepEqual(nombres(), ["Comedor", "Apoyo"]);
  assert.equal(fetch.mock.callCount(), 1);
});

test("cambiar categoría y limpiar cada filtro conserva el filtro restante", async (t) => {
  await montar(t, "/recursos?q=orientacion");
  await seleccionar("formacion");
  assert.equal(parametros().get("q"), "orientacion");
  assert.deepEqual(nombres(), ["Orientación laboral"]);
  await limpiar("Limpiar búsqueda");
  assert.equal(container.querySelector("input").value, "");
  assert.equal(parametros().get("categoria"), "formacion");
  assert.deepEqual(nombres(), ["Orientación laboral", "Apoyo"]);
  await buscar("comida");
  await limpiar("Limpiar categoría");
  assert.equal(parametros().get("q"), "comida");
  assert.equal(container.querySelector("select").value, "");
  assert.deepEqual(nombres(), ["Comedor", "Apoyo"]);
});

test("atrás y adelante restauran controles y resultados sin volver a consultar la API", async (t) => {
  const fetch = await montar(t, "/recursos?q=comida");
  await seleccionar("formacion");
  await buscar("talleres");
  await escribir("borrador sin enviar");
  await act(async () => router.navigate(-1));
  assert.equal(container.querySelector("input").value, "comida");
  assert.equal(container.querySelector("select").value, "formacion");
  assert.deepEqual(nombres(), ["Apoyo"]);
  await act(async () => router.navigate(-1));
  assert.equal(container.querySelector("select").value, "");
  assert.deepEqual(nombres(), ["Comedor", "Apoyo"]);
  await act(async () => router.navigate(1));
  await act(async () => router.navigate(1));
  assert.equal(container.querySelector("input").value, "talleres");
  assert.deepEqual(nombres(), ["Orientación laboral"]);
  assert.equal(fetch.mock.callCount(), 1);
});

test("sin coincidencias muestra contador cero y permite limpiar una categoría desconocida", async (t) => {
  await montar(t, "/recursos?categoria=inexistente");
  assert.equal(container.querySelector("select").value, "inexistente");
  assert.match(container.querySelector('[role="status"]').textContent, /0 de 4 recursos/);
  assert.match(container.textContent, /No se encontraron recursos/);
  assert.deepEqual(nombres(), []);
  await limpiar("Limpiar categoría");
  assert.equal(nombres().length, 4);
  assert.match(container.querySelector('[role="status"]').textContent, /4 recursos disponibles/);
});

test("API vacía conserva los controles de limpieza y anuncia disponibilidad", async (t) => {
  await montar(t, "/recursos?q=ayuda", []);
  assert.match(container.textContent, /No hay recursos disponibles/);
  assert.match(container.querySelector('[role="status"]').textContent, /0 de 0 recursos/);
  await limpiar("Limpiar búsqueda");
  assert.equal(parametros().has("q"), false);
});
