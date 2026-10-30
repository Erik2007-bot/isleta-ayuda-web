import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "../../styles/SearchBar.css";

export default function SearchBar() {
  const [busqueda, setBusqueda] = useState("");
  const navigate = useNavigate();

  function handleSubmit(event) {
    event.preventDefault();

    const termino = busqueda.trim();

    if (!termino) {
      return;
    }

    navigate(`/recursos?q=${encodeURIComponent(termino)}`);
  }

  return (
    <form className="search-bar" onSubmit={handleSubmit} role="search">
      <label htmlFor="buscar-recursos">
        Buscar recursos
      </label>

      <div className="search-bar__controls">
        <input
          id="buscar-recursos"
          type="search"
          placeholder="¿Qué recurso necesitas?"
          value={busqueda}
          onChange={(event) => setBusqueda(event.target.value)}
          required
          minLength={2}
        />

        <button type="submit">
          Buscar
        </button>
      </div>
    </form>
  );
}
