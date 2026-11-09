import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../styles/Auth.css";

export default function Perfil() {
  const { user, logout, refreshProfile } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const heading = useRef(null);
  useEffect(() => {
    heading.current?.focus();
    let active = true;
    refreshProfile().catch((failure) => {
      if (active) setError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshProfile]);
  return (
    <main className="auth" aria-labelledby="profile-title">
      <section className="auth__panel">
        <h1 id="profile-title" ref={heading} tabIndex={-1}>Mi perfil</h1>
        <p role="status">{loading ? "Actualizando perfil…" : ""}</p>
        <p role="alert" className="auth__error">{error}</p>
        <dl className="auth__profile">
          <dt>Nombre</dt><dd>{user.nombre}</dd>
          <dt>Email</dt><dd>{user.email}</dd>
          <dt>Rol</dt><dd>{user.rol}</dd>
        </dl>
        <button className="auth__submit" onClick={() => logout("Has cerrado sesión.")}>Cerrar sesión</button>
      </section>
    </main>
  );
}
