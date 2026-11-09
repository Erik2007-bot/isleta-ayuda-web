const API_URL = (import.meta.env?.VITE_API_URL || "/api").replace(/\/+$/, "");

export async function submitAuth(mode, values) {
  let response;
  try {
    response = await fetch(`${API_URL}/auth/${mode}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      credentials: "omit",
      body: JSON.stringify(values),
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("No se ha podido conectar con el servidor. Inténtalo de nuevo.");
  }
  if (!response.ok) {
    const messages = {
      400: "Los datos no son válidos. Revisa los campos e inténtalo de nuevo.",
      401: mode === "login" ? "El email o la contraseña no son correctos." : "No se ha podido completar el registro.",
      409: mode === "registro" ? "No se puede registrar este email. Si ya tienes una cuenta, inicia sesión." : "No se ha podido iniciar sesión. Inténtalo de nuevo.",
    };
    throw new Error(messages[response.status] || "El servicio no está disponible. Inténtalo más tarde.");
  }
  if (mode === "login") {
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("El servidor ha devuelto una respuesta no válida. Inténtalo de nuevo.");
    }
    if (typeof data?.token !== "string" || !data.token.trim()) {
      throw new Error("No se ha podido confirmar el acceso. Inténtalo de nuevo.");
    }
    return data;
  }
}

export async function getProfile(token) {
  let response;
  try {
    response = await fetch(`${API_URL}/auth/me`, {
      headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
      credentials: "omit",
      signal: AbortSignal.timeout(15000),
    });
  } catch {
    throw new Error("No se ha podido conectar con el servidor. Inténtalo de nuevo.");
  }
  if (response.status === 401) {
    const error = new Error("Tu sesión ha caducado. Inicia sesión de nuevo.");
    error.status = 401;
    throw error;
  }
  if (!response.ok) throw new Error("No se ha podido consultar tu perfil. Inténtalo de nuevo.");
  try {
    const user = await response.json();
    if (user?.idUsuario == null || typeof user.nombre !== "string" || typeof user.email !== "string" || typeof user.rol !== "string") {
      throw new Error();
    }
    return { idUsuario: user.idUsuario, nombre: user.nombre, email: user.email, rol: user.rol };
  } catch {
    throw new Error("El servidor ha devuelto un perfil no válido.");
  }
}
