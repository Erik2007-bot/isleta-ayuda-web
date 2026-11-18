function texto(value) {
  return typeof value === "string" ? value.trim() : "";
}

function normalizar(value) {
  return texto(value).normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("es");
}

function categoriaOpcion(categoria) {
  const label = texto(categoria?.nombre) || texto(categoria);
  const value = texto(categoria?.slug)
    || String(categoria?.id ?? categoria?.idCategoria ?? label);
  return label && value ? { value, label } : null;
}

export function obtenerCategorias(recursos) {
  const opciones = new Map();
  for (const recurso of recursos) {
    for (const categoria of Array.isArray(recurso.categorias) ? recurso.categorias : []) {
      const opcion = categoriaOpcion(categoria);
      if (opcion && !opciones.has(opcion.value)) opciones.set(opcion.value, opcion);
    }
  }
  return [...opciones.values()].sort((a, b) => a.label.localeCompare(b.label, "es")
    || a.value.localeCompare(b.value, "es"));
}

export function filtrarRecursos(recursos, q = "", categoria = "") {
  const termino = normalizar(q);
  return recursos.filter((recurso) => {
    const coincideTexto = !termino || [recurso.nombre, recurso.descripcion]
      .some((value) => normalizar(value).includes(termino));
    const coincideCategoria = !categoria || (Array.isArray(recurso.categorias) && recurso.categorias
      .some((value) => categoriaOpcion(value)?.value === categoria));
    return coincideTexto && coincideCategoria;
  });
}

export function actualizarParametro(searchParams, nombre, value) {
  const siguientes = new URLSearchParams(searchParams);
  const valor = texto(value);
  if (valor) siguientes.set(nombre, valor);
  else siguientes.delete(nombre);
  return siguientes;
}
