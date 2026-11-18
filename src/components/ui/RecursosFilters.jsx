import SearchBar from "./SearchBar";

export default function RecursosFilters({ q, categoria, categorias, disabled, onCategoria, onClearSearch, onClearCategoria }) {
  const categoriaActual = categorias.find((opcion) => opcion.value === categoria);

  return (
    <section className="recursos__filters" aria-label="Buscar y filtrar recursos">
      <SearchBar />
      <div className="recursos__category">
        <label htmlFor="categoria-recursos">Filtrar por categoría</label>
        <select id="categoria-recursos" name="categoria" value={categoria} disabled={disabled}
          onChange={(event) => onCategoria(event.target.value)} aria-controls="recursos-resultados">
          <option value="">Todas las categorías</option>
          {categoria && !categoriaActual && <option value={categoria}>Categoría no disponible: {categoria}</option>}
          {categorias.map((opcion) => <option key={opcion.value} value={opcion.value}>{opcion.label}</option>)}
        </select>
      </div>
      {(q || categoria) && (
        <div className="recursos__active-filters" aria-label="Filtros activos">
          {q && <button type="button" onClick={onClearSearch}>Limpiar búsqueda: <span>{q}</span></button>}
          {categoria && <button type="button" onClick={onClearCategoria}>Limpiar categoría: <span>{categoriaActual?.label || categoria}</span></button>}
        </div>
      )}
    </section>
  );
}
