import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import RecursosList from "../components/ui/RecursosList";
import RecursosFilters from "../components/ui/RecursosFilters";
import { actualizarParametro, filtrarRecursos, obtenerCategorias } from "../recursos/filtros";
import { getRecursos } from "../services/recursos";
import "../styles/Recursos.css";

export default function Recursos() {
  const [state, setState] = useState({ recursos: [], loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);
  const [searchParams, setSearchParams] = useSearchParams();
  const q = searchParams.get("q") || "";
  const categoria = searchParams.get("categoria") || "";
  const categorias = obtenerCategorias(state.recursos);
  const filtrados = filtrarRecursos(state.recursos, q, categoria);

  function actualizarFiltro(nombre, value) {
    setSearchParams((actuales) => actualizarParametro(actuales, nombre, value));
  }

  useEffect(() => {
    const controller = new AbortController();
    getRecursos(controller.signal).then((recursos) => {
      if (!controller.signal.aborted) setState({ recursos, loading: false, error: "" });
    }).catch((error) => {
      if (!controller.signal.aborted) setState({ recursos: [], loading: false, error: error.message });
    });
    return () => controller.abort();
  }, [attempt]);

  function retry() {
    setState({ recursos: [], loading: true, error: "" });
    setAttempt((current) => current + 1);
  }

  return (
    <main className="recursos" aria-labelledby="recursos-title">
      <h1 id="recursos-title">Buscar recursos</h1>
      <p className="recursos__intro">Consulta los recursos disponibles de Isleta Ayuda.</p>
      <RecursosFilters q={q} categoria={categoria} categorias={categorias}
        disabled={state.loading || Boolean(state.error)}
        onCategoria={(value) => actualizarFiltro("categoria", value)}
        onClearSearch={() => actualizarFiltro("q", "")}
        onClearCategoria={() => actualizarFiltro("categoria", "")} />
      <RecursosList {...state} recursos={filtrados} total={state.recursos.length}
        filtered={Boolean(q.trim() || categoria)} onRetry={retry} />
    </main>
  );
}
