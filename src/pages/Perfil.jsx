import { useEffect, useRef, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import "../styles/Auth.css";

export default function Perfil() {
  const { user, logout, refreshProfile, saveProfileName, savingName } = useAuth();
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [draft, setDraft] = useState(null);
  const [nameError, setNameError] = useState("");
  const [saved, setSaved] = useState(false);
  const heading = useRef(null);
  const nameInput = useRef(null);
  const nombre = draft ?? user.nombre;

  useEffect(() => {
    heading.current?.focus();
    let active = true;
    refreshProfile().catch((failure) => {
      if (active) setError(failure.message);
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [refreshProfile]);

  function handleChange(event) {
    setDraft(event.target.value);
    setNameError("");
    setSaved(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (loading || savingName) return;
    setError("");
    setSaved(false);

    const trimmedName = nombre.trim();
    let validationError = "";
    if (!trimmedName) validationError = "Introduce tu nombre.";
    else if (nombre.length > 100) validationError = "El nombre no puede tener más de 100 caracteres.";
    setNameError(validationError);
    if (validationError) {
      nameInput.current.focus();
      return;
    }

    try {
      const updated = await saveProfileName(trimmedName);
      if (updated) {
        setDraft(null);
        setSaved(true);
      }
    } catch (failure) {
      setError(failure.message);
    }
  }

  return (
    <main className="auth" aria-labelledby="profile-title">
      <section className="auth__panel">
        <h1 id="profile-title" ref={heading} tabIndex={-1}>Mi perfil</h1>
        <p role="status">{loading ? "Actualizando perfil…" : ""}</p>
        <dl className="auth__profile">
          <dt>Nombre</dt><dd>{user.nombre}</dd>
          <dt>Email</dt><dd>{user.email}</dd>
          <dt>Rol</dt><dd>{user.rol}</dd>
        </dl>
        <form className="auth__profile-form" onSubmit={handleSubmit} noValidate aria-busy={savingName}>
          <fieldset className="auth__fields" disabled={loading || savingName}>
            <div className="auth__field">
              <label htmlFor="profile-name">Nombre</label>
              <input id="profile-name" name="nombre" type="text" autoComplete="name" required
                ref={nameInput} value={nombre} onChange={handleChange} aria-invalid={Boolean(nameError)}
                aria-describedby={nameError ? "profile-name-error" : undefined} />
              <p id="profile-name-error" role="alert" className="auth__error">{nameError}</p>
            </div>
            <button className="auth__submit" type="submit">
              {savingName ? "Guardando…" : "Guardar nombre"}
            </button>
          </fieldset>
          <p role="alert" className="auth__error">{error}</p>
          <div className="auth__feedback auth__feedback--success">
            <p role="status">{saved ? "Tu nombre se ha guardado correctamente." : ""}</p>
          </div>
        </form>
        <button className="auth__submit" type="button" onClick={() => logout("Has cerrado sesión.")}>Cerrar sesión</button>
      </section>
    </main>
  );
}
