import { useId, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { actualizarParametro } from "../../recursos/filtros";
import "../../styles/SearchBar.css";

export default function SearchBar() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  function buscar(termino) {
    const siguientes = actualizarParametro(searchParams, "q", termino);
    navigate({ pathname: "/recursos", search: siguientes.toString() });
  }

  return <SearchForm key={searchParams.toString()} initialValue={searchParams.get("q") || ""} onSearch={buscar} />;
}

function SearchForm({ initialValue, onSearch }) {
  const [busqueda, setBusqueda] = useState(initialValue);
  const inputId = useId();

  function handleSubmit(event) {
    event.preventDefault();

    setBusqueda(busqueda.trim());
    onSearch(busqueda.trim());
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <label htmlFor={inputId}>
        Buscar recursos
      </label>

      <div className="search-bar__controls">
        <input
          id={inputId}
          name="q"
          type="search"
          placeholder="¿Qué recurso necesitas?"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
        />

        <button type="submit">
          Buscar
        </button>
      </div>
    </form>
  );
}
