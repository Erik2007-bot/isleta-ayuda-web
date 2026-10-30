import { useParams } from "react-router-dom";

export default function DetalleRecurso() {
  const { id } = useParams();

  return (
    <main>
      <h1>Detalle del recurso</h1>
      <p>Identificador del recurso: {id}</p>
    </main>
  );
}
