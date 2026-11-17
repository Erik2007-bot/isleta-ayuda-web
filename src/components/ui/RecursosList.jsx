import RecursoCard from "./RecursoCard";

export default function RecursosList({ recursos, loading, error, onRetry }) {
  return (
    <section className="recursos__results" aria-label="Listado de recursos" aria-busy={loading}>
      <p role="status" aria-atomic="true">
        {loading ? "Cargando recursos…" : !error && recursos.length === 0 ? "No hay recursos disponibles en este momento." : ""}
      </p>
      {error && (
        <div className="recursos__error">
          <p role="alert">{error}</p>
          <button type="button" onClick={onRetry}>Volver a intentar</button>
        </div>
      )}
      {!loading && !error && recursos.length > 0 && (
        <>
          <p role="status">{recursos.length === 1 ? "1 recurso disponible." : `${recursos.length} recursos disponibles.`}</p>
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
