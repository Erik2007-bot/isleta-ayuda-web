import { useEffect, useState } from "react";
import RecursosList from "../components/ui/RecursosList";
import { getRecursos } from "../services/recursos";
import "../styles/Recursos.css";

export default function Recursos() {
  const [state, setState] = useState({ recursos: [], loading: true, error: "" });
  const [attempt, setAttempt] = useState(0);

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
      <RecursosList {...state} onRetry={retry} />
    </main>
  );
}
