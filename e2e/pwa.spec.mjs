import { test, expect } from "@playwright/test";

test.beforeEach(async ({ page }) => {
  await page.goto("/");
  await page.evaluate(() => navigator.serviceWorker.ready.then(() => true));
  await page.reload();
  await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
});

test("manifest, registro e iconos instalables en localhost", async ({ page, request }) => {
  await expect(page).toHaveTitle("Isleta Ayuda");
  await expect(page.locator("html")).toHaveAttribute("lang", "es");
  const manifestUrl = await page.locator('link[rel="manifest"]').getAttribute("href");
  const response = await request.get(manifestUrl);
  expect(response.ok()).toBe(true);
  const manifest = await response.json();
  expect(manifest).toMatchObject({
    name: "Isleta Ayuda", short_name: "Isleta Ayuda", lang: "es", start_url: "/", scope: "/",
    display: "standalone", theme_color: "#176B55", background_color: "#F7F5EF",
  });
  expect(manifest.description).toBeTruthy();
  expect(manifest.icons.map((icon) => icon.sizes)).toEqual(["192x192", "512x512", "512x512"]);
  for (const icon of manifest.icons) {
    const dimensions = await page.evaluate(async ({ src }) => {
      const image = await createImageBitmap(await (await fetch(src)).blob());
      const result = [image.width, image.height];
      image.close();
      return result;
    }, icon);
    expect(dimensions.join("x")).toBe(icon.sizes);
  }
  const maskable = manifest.icons.find((icon) => icon.purpose === "maskable");
  const safe = await page.evaluate(async ({ src }) => {
    const image = await createImageBitmap(await (await fetch(src)).blob());
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 512;
    const context = canvas.getContext("2d");
    context.drawImage(image, 0, 0);
    const { data } = context.getImageData(0, 0, 512, 512);
    for (let y = 0; y < 512; y++) {
      for (let x = 0; x < 512; x++) {
        const index = (y * 512 + x) * 4;
        if (data[index + 3] !== 255) return false;
        if (Math.hypot(x - 255.5, y - 255.5) > 204.8
          && (data[index] !== 247 || data[index + 1] !== 245 || data[index + 2] !== 239)) return false;
      }
    }
    return true;
  }, maskable);
  expect(safe).toBe(true);
  const staticFiles = await page.evaluate(async () => {
    const required = [...document.querySelectorAll('script[src], link[rel="stylesheet"]')]
      .map((element) => element.src || element.href);
    const cached = [];
    for (const name of await caches.keys()) {
      for (const request of await (await caches.open(name)).keys()) cached.push(new URL(request.url).pathname);
    }
    return { required: required.map((url) => new URL(url).pathname), cached };
  });
  for (const pathname of staticFiles.required) expect(staticFiles.cached).toContain(pathname);
});

test("navegación offline conserva URL, tema, interfaz responsive y error accesible de API", async ({ page, context }, testInfo) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await page.getByRole("button", { name: "Activar modo oscuro" }).click();
  await context.setOffline(true);
  await page.goto("/recursos?q=ayuda&categoria=alimentacion");
  await expect(page.getByRole("heading", { name: "Buscar recursos" })).toBeVisible();
  await expect(page.getByRole("searchbox")).toHaveValue("ayuda");
  await expect(page.getByLabel("Filtrar por categoría")).toHaveValue("alimentacion");
  await expect(page.locator("html")).toHaveAttribute("data-theme", "dark");
  await expect(page.locator(".connection-status")).toContainText("Estás sin conexión");
  await expect(page.locator(".connection-status")).toHaveAttribute("role", "status");
  await expect(page.getByRole("alert")).toContainText("No se ha podido conectar con el servidor");
  await expect(page.locator("article")).toHaveCount(0);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  expect(await page.locator(".header__image").evaluate((image) => image.complete && image.naturalWidth > 0)).toBe(true);
  await page.getByRole("button", { name: /Limpiar búsqueda/ }).click();
  await expect(page.getByRole("searchbox")).toHaveValue("");
  await expect(page).toHaveURL(/categoria=alimentacion/);
  await page.getByRole("button", { name: /Limpiar categoría/ }).click();
  await expect(page.getByLabel("Filtrar por categoría")).toHaveValue("");
  await page.screenshot({ path: testInfo.outputPath("offline-mobile-dark.png"), fullPage: true });
  await page.goto("/ayuda");
  await expect(page.locator("main")).toBeVisible();
  await context.setOffline(false);
  await expect(page.locator(".connection-status")).toBeEmpty();
});

test("login y perfil funcionan sin guardar API, JWT ni datos privados en Cache Storage", async ({ page, context }) => {
  const token = "pwa-token-solo-para-pruebas";
  const email = "pwa-privado@example.invalid";
  await context.route("**/api/**", async (route) => {
    const pathname = new URL(route.request().url()).pathname;
    const body = pathname.endsWith("/login")
      ? { token, expiresIn: 900 }
      : pathname.endsWith("/me")
        ? { idUsuario: 1, nombre: "Perfil de prueba PWA", email, rol: "USER" }
        : [];
    await route.fulfill({ json: body, headers: { "Cache-Control": "public, max-age=3600" } });
  });
  await page.goto("/login");
  await page.getByLabel("Email", { exact: true }).fill(email);
  await page.getByLabel("Contraseña", { exact: true }).fill("clave-de-prueba-pwa");
  await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Mi perfil" })).toBeVisible();
  await expect(page.locator("main")).toContainText(email);
  await page.evaluate(() => fetch("/api/recursos", { cache: "no-store" }).then((response) => response.json()));
  const stored = await page.evaluate(async () => {
    const entries = [];
    for (const name of await caches.keys()) {
      const cache = await caches.open(name);
      for (const request of await cache.keys()) {
        const response = await cache.match(request);
        entries.push({ url: request.url, authorization: request.headers.get("Authorization"), body: await response.text() });
      }
    }
    return { entries, local: { ...localStorage }, session: { ...sessionStorage } };
  });
  expect(stored.entries.length).toBeGreaterThan(0);
  expect(stored.entries.some((entry) => new URL(entry.url).pathname.startsWith("/api/"))).toBe(false);
  expect(stored.entries.some((entry) => entry.authorization)).toBe(false);
  expect(JSON.stringify(stored)).not.toContain(token);
  expect(JSON.stringify(stored)).not.toContain(email);
  await context.unrouteAll();
  await context.setOffline(true);
  const results = await page.evaluate(async () => {
    const options = [
      ["/api/recursos", {}],
      ["/api/auth/me", { headers: { Authorization: "Bearer pwa-token-solo-para-pruebas" } }],
      ["/api/auth/login", { method: "POST", body: "{}" }],
    ];
    return Promise.all(options.map(async ([url, init]) => {
      try { await fetch(url, init); return "respuesta"; }
      catch { return "sin conexión"; }
    }));
  });
  expect(results).toEqual(["sin conexión", "sin conexión", "sin conexión"]);
  await page.reload();
  await expect(page).toHaveURL(/\/login$/);
  await expect(page.locator("main")).not.toContainText(email);
});

test("API caída muestra error y una navegación a la API no recibe el HTML offline", async ({ page, context }) => {
  await context.route("**/api/**", (route) => route.abort("connectionfailed"));
  await page.goto("/recursos?q=ayuda");
  await expect(page.getByRole("alert")).toContainText("No se ha podido conectar con el servidor");
  await expect(page.getByRole("button", { name: "Volver a intentar" })).toBeVisible();
  await expect(page.locator(".connection-status")).toBeEmpty();
  await context.unrouteAll();
  await context.setOffline(true);
  for (const path of ["/api/auth/me", "/api?consulta=prueba", "/auth?consulta=prueba"]) {
    await expect(page.goto(path)).rejects.toThrow();
  }
});
