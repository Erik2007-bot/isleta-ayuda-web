const API_URL = (import.meta.env?.VITE_API_URL || "/api").replace(/\/+$/, "");

export async function getRecursos(signal) {
  let response;
  try {
    response = await fetch(`${API_URL}/recursos`, {
      headers: { Accept: "application/json" },
      credentials: "omit",
      signal: signal
        ? AbortSignal.any([signal, AbortSignal.timeout(15000)])
        : AbortSignal.timeout(15000),
    });
  } catch {
    if (signal?.aborted) throw signal.reason;
    throw new Error("No se ha podido conectar con el servidor. Inténtalo de nuevo.");
  }
  if (!response.ok) {
    throw new Error("No se han podido cargar los recursos. Inténtalo más tarde.");
  }
  try {
    const data = await response.json();
    const recursos = Array.isArray(data) ? data : data?.content;
    if (!Array.isArray(recursos) || recursos.some((recurso) =>
      !recurso || typeof recurso !== "object" || typeof recurso.nombre !== "string"
    )) {
      throw new Error();
    }
    return recursos;
  } catch {
    if (signal?.aborted) throw signal.reason;
    throw new Error("El servidor ha devuelto un listado de recursos no válido.");
  }
}
