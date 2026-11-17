function text(value) {
  return typeof value === "string" ? value.trim() : "";
}

export default function RecursoCard({ recurso }) {
  const organizacion = text(recurso.organizacion?.nombre)
    || text(recurso.organizacion) || text(recurso.nombreOrganizacion);
  const categorias = Array.isArray(recurso.categorias)
    ? recurso.categorias.map((categoria) => text(categoria?.nombre) || text(categoria)).filter(Boolean)
    : [];
  const details = [
    ["Organización", organizacion],
    ["Dirección", text(recurso.direccion)],
    ["Teléfono", text(recurso.telefono)],
    ["Email", text(recurso.email)],
    ["Horario", text(recurso.horario)],
    ["Web", text(recurso.web)],
  ].filter(([, value]) => value);

  return (
    <article className="recurso-card">
      <h2>{recurso.nombre}</h2>
      {text(recurso.descripcion) && <p className="recurso-card__description">{recurso.descripcion}</p>}
      {details.length > 0 && (
        <dl className="recurso-card__details">
          {details.map(([label, value]) => (
            <div key={label}><dt>{label}</dt><dd>{value}</dd></div>
          ))}
        </dl>
      )}
      {categorias.length > 0 && (
        <ul className="recurso-card__categories" aria-label="Categorías">
          {categorias.map((categoria, index) => <li key={`${categoria}-${index}`}>{categoria}</li>)}
        </ul>
      )}
    </article>
  );
}
