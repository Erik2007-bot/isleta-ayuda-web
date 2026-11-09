# React + Vite

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

Comprobaciones: `npm run lint`, `npm run build` y `npm test` (Node Test Runner,
sin dependencias adicionales). En PowerShell puede usarse `npm.cmd` si la
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
