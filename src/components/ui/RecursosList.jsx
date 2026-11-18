import RecursoCard from "./RecursoCard";

export default function RecursosList({ recursos, loading, error, onRetry, total = recursos.length, filtered = false }) {
  const contador = filtered
    ? `${recursos.length} de ${total} recursos coinciden con los filtros.`
    : recursos.length === 1 ? "1 recurso disponible." : `${recursos.length} recursos disponibles.`;
  const vacio = filtered && total > 0
    ? "No se encontraron recursos con esta búsqueda y categoría. Prueba otros filtros o limpia los actuales."
    : "No hay recursos disponibles en este momento.";

  return (
    <section id="recursos-resultados" className="recursos__results" aria-label="Listado de recursos" aria-busy={loading}>
      <p role="status" aria-atomic="true">
        {loading ? "Cargando recursos…" : !error ? contador : ""}
      </p>
      {!loading && !error && recursos.length === 0 && <p className="recursos__empty">{vacio}</p>}
      {error && (
        <div className="recursos__error">
          <p role="alert">{error}</p>
          <button type="button" onClick={onRetry}>Volver a intentar</button>
        </div>
      )}
      {!loading && !error && recursos.length > 0 && (
        <>
          <ul className="recursos__grid" aria-label="Recursos disponibles">
            {recursos.map((recurso, index) => (
              <li key={recurso.idRecurso ?? recurso.id ?? index}><RecursoCard recurso={recurso} /></li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
