import { useSyncExternalStore } from "react";
import "../../styles/ConnectionStatus.css";

function subscribe(callback) {
  window.addEventListener("online", callback);
  window.addEventListener("offline", callback);
  return () => {
    window.removeEventListener("online", callback);
    window.removeEventListener("offline", callback);
  };
}

export default function ConnectionStatus() {
  const online = useSyncExternalStore(subscribe, () => navigator.onLine, () => true);

  return (
    <p className="connection-status" role="status" aria-live="polite" aria-atomic="true">
      {!online && "Estás sin conexión. Puedes navegar por la interfaz guardada. Para consultar recursos, iniciar sesión o consultar tu perfil necesitas conexión con el servidor."}
    </p>
  );
}
