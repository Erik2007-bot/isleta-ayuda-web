import { Link } from "react-router-dom";

export default function Error404() {
  return (
    <main>
      <h1>Error 404</h1>
      <p>La página que buscas no existe.</p>
      <Link to="/">Volver al inicio</Link>
    </main>
  );
}
