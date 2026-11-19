# React + Vite

## PWA de Isleta Ayuda

La versión de producción incluye un manifest en español, iconos PNG de 192 y
512 píxeles y un icono maskable de 512 píxeles, generados desde
`public/images/logo-isleta-ayuda.png`. Conservan la proporción del original;
el maskable tiene fondo opaco y el logo completo dentro del círculo seguro
central del 80 % del diámetro.

`vite-plugin-pwa` genera el Service Worker con Workbox y registra `/sw.js`
mediante `registerSW.js`. Solo se precargan el HTML de la aplicación, sus
assets compilados, el logo y los iconos. Las rutas de React Router reciben
el HTML precargado al navegar sin conexión, incluidos sus parámetros de búsqueda.
La navegación a `/api`, `/auth` y al prefijo de `VITE_API_URL` queda excluida
de ese fallback. El servidor de producción debe servir la interfaz con fallback
a `index.html`, sin aplicar ese fallback a la API, y permitir actualizar `sw.js`.

Las peticiones de API usan la red y `cache: "no-store"`. No se almacenan
respuestas de recursos, autenticación, perfiles ni JWT en Cache Storage.
La sesión continúa únicamente en memoria y desaparece al recargar.
El modo oscuro conserva su preferencia local como antes.

El funcionamiento offline requiere haber abierto antes la aplicación con conexión
y haber completado la instalación del Service Worker. Permite cargar y navegar
por la interfaz estática; **no garantiza acceso sin conexión a los recursos de
MariaDB ni al perfil**. Se muestra un aviso accesible cuando el navegador detecta
la desconexión y un error con opción de reintento si falla la API, aunque el
navegador indique que hay conexión. Una lista ya cargada en memoria no constituye
almacenamiento offline y desaparece al recargar.

El Service Worker está desactivado en `npm run dev`. Para comprobar la PWA real:

```sh
npm run lint
npm run build
npm test
npm run test:pwa
npm run preview -- --host localhost --port 4173 --strictPort
```

`test:pwa` usa Playwright con el Chrome instalado, construye la aplicación y abre
su propio servidor en `http://localhost:4173`; deja ese puerto libre antes de
ejecutarlo. Comprueba registro, manifest, decodificación de iconos, zona segura
maskable, navegación offline, errores accesibles, modo oscuro, filtros, móvil
y ausencia de datos privados en caché. La autenticación de esa prueba utiliza
respuestas simuladas, sin crear cuentas ni modificar la base de datos.
En un equipo sin Chrome, instálalo antes de ejecutar la prueba.

### Verificación desde Chrome DevTools

1. Abre `http://localhost:4173` en Chrome. Localhost permite probar el Service
   Worker; el despliegue público requiere HTTPS. Con backend disponible, el
   proxy de preview usa `/api` como en desarrollo. Para otro origen configura
   `VITE_API_URL` antes del build y el CORS correspondiente en el backend.
2. En **Application → Manifest**, comprueba nombre, idioma, colores, modo
   standalone, tamaños de iconos y la vista de zona segura del icono maskable.
   Usa la opción de instalación de Chrome si está disponible.
3. En **Application → Service Workers**, espera a que `/sw.js` esté activado.
   Recarga una vez para que controle la pestaña. Desmarca **Bypass for network**.
4. En **Application → Cache Storage**, revisa la precaché de `isleta-ayuda`:
   debe contener solo archivos estáticos, sin `/api`, datos del perfil ni tokens.
   Inicia sesión con una cuenta de pruebas y vuelve a comprobarlo; el JWT no debe
   aparecer tampoco en Local Storage o Session Storage.
5. Activa **Offline** en **Network**. Abre directamente
   `/recursos?q=ayuda&categoria=alimentacion` y recarga. Deben aparecer la
   interfaz, los filtros y su limpieza individual, el aviso de desconexión y el
   error de API con **Volver a intentar**. No deben aparecer recursos inventados
   ni datos recuperados desde una caché de la API.
6. Cambia de ruta, activa el modo oscuro y usa la barra de dispositivos con
   ancho móvil. Comprueba Tab/Enter y los mensajes `status`/`alert` en el árbol
   de accesibilidad. Recargar `/perfil` elimina la sesión y lleva al login.
7. Desactiva **Offline** y reintenta con el backend disponible. Para comprobar
   una caída de API manteniendo conexión, bloquea `*/api/*` en **Network request
   blocking**: debe mostrarse un error, sin una falsa respuesta HTML o datos viejos.
8. Las actualizaciones no fuerzan una recarga durante una sesión: una nueva
   versión del Service Worker espera hasta cerrar todas las pestañas de la app.
   Para repetir desde cero usa **Unregister** y **Clear site data**; después
   vuelve a entrar con conexión antes de probar offline.

Configuración de referencia: [registro del Service Worker](https://vite-pwa-org.netlify.app/guide/register-service-worker)
y [precaché de archivos estáticos](https://vite-pwa-org.netlify.app/guide/static-assets).

## Autenticación: fases 1 y 2

Los formularios de `/registro` y `/login` envían JSON a la API. Validan los
campos obligatorios y el formato del email; las reglas adicionales de contraseña
las valida el backend. No se recorta ni transforma la contraseña enviada.

La URL base se configura con `VITE_API_URL` (incluye `/api`, sin `/auth`).
Puedes copiar `.env.example` a `.env.local`. El valor predeterminado es `/api`:
en desarrollo Vite redirige esas peticiones a `http://localhost:8080`.
Reinicia Vite después de modificar la configuración o las variables de entorno.
Las variables `VITE_` son públicas: no deben contener secretos.

Para desplegar, configura un proxy de `/api` hacia el backend o define
`VITE_API_URL` con la URL pública de la API antes de ejecutar `npm run build`.
Si la API está en otro origen, debe permitir el origen del frontend mediante CORS.

El registro confirma la creación y ofrece un enlace al login. El login recibe
el JWT y consulta `/api/auth/me` con `Authorization: Bearer <token>` antes de
abrir `/perfil`. El proveedor comparte el usuario; el token vive únicamente en
una variable en memoria. Recargar o cerrar la pestaña elimina la sesión.

`/perfil` requiere autenticación y muestra nombre, email y rol. Las demás rutas
siguen siendo públicas. La navegación móvil lleva al perfil, y sin sesión
redirige a `/login`. El botón «Cerrar sesión» borra el token y el usuario.

La caducidad utiliza el plazo más corto entre `expiresAt` (fecha ISO) y
`expiresIn` (segundos). Se comprueba con un temporizador y al recuperar el foco
o cambiar la visibilidad. Un `401` de `/me` también elimina la sesión; los
fallos de conexión muestran un error y permiten volver a entrar al perfil para
reintentar. No hay renovación automática del token.

Comprobaciones: `npm run lint`, `npm run build` y `npm test` (Node Test Runner
con jsdom para las pruebas de interfaz). En PowerShell puede usarse `npm.cmd` si la
política de ejecución bloquea `npm.ps1`.

### Comprobar desde el navegador

1. Con backend y Vite arrancados, abre `/perfil` sin sesión: debe ir a `/login`.
2. Registra una cuenta o usa una existente e inicia sesión. En Red deben aparecer
   `POST /api/auth/login` y `GET /api/auth/me` con cabecera Bearer. No compartas el token.
3. Comprueba los datos de `/perfil`, cambia de ruta y regresa desde la navegación.
4. Cierra sesión: vuelve al login, y `/perfil` deja de ser accesible.
5. Inicia sesión y recarga la página: volverá al login, sin persistencia.
6. Espera a `expiresAt`: la sesión debe borrarse y, estando en perfil, redirigir
   al login con un mensaje. Para comprobar un `401` sin cambiar el backend,
   intercepta `/api/auth/me` en una herramienta de pruebas de navegador y devuelve
   ese estado; vuelve a entrar al perfil para provocar la consulta.
7. Repite en móvil, modo oscuro y con Tab/Enter; comprueba también un login incorrecto.

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
