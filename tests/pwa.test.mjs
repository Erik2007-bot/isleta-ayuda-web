import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { inflateSync } from "node:zlib";
import { submitAuth, getProfile } from "../src/services/auth.js";
import { getRecursos } from "../src/services/recursos.js";

test("los iconos son PNG decodificables con los tamaños del manifest", async () => {
  for (const [name, size] of [["pwa-192.png", 192], ["pwa-512.png", 512], ["pwa-maskable-512.png", 512]]) {
    const png = await readFile(new URL(`../public/icons/${name}`, import.meta.url));
    assert.deepEqual(png.subarray(0, 8), Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]));
    assert.equal(png.readUInt32BE(16), size);
    assert.equal(png.readUInt32BE(20), size);
    assert.equal(png[24], 8);
    assert.equal(png[25], 6);
    const chunks = [];
    for (let offset = 8; offset < png.length;) {
      const length = png.readUInt32BE(offset);
      if (png.toString("ascii", offset + 4, offset + 8) === "IDAT") {
        chunks.push(png.subarray(offset + 8, offset + 8 + length));
      }
      offset += length + 12;
    }
    assert.equal(inflateSync(Buffer.concat(chunks)).length, size * (size * 4 + 1));
  }
});

test("autenticación, perfil y recursos solicitan la red sin caché HTTP", async (t) => {
  const fetch = t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.equal(options.cache, "no-store");
    assert.equal(options.credentials, "omit");
    if (url.endsWith("/auth/login")) return Response.json({ token: "token-de-prueba" });
    if (url.endsWith("/auth/me")) return Response.json({ idUsuario: 1, nombre: "Prueba", email: "pwa@example.invalid", rol: "USER" });
    return Response.json([]);
  });
  await submitAuth("login", { email: "pwa@example.invalid", password: "clave-de-prueba" });
  await getProfile("token-de-prueba");
  await getRecursos();
  assert.equal(fetch.mock.callCount(), 3);
});
