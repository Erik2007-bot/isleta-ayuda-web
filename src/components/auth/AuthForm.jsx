import { useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../../auth/AuthContext";
import { submitAuth } from "../../services/auth";
import "../../styles/Auth.css";

export default function AuthForm({ mode }) {
  const isRegistration = mode === "registro";
  const auth = useAuth();
  const navigate = useNavigate();
  const [values, setValues] = useState({ nombre: "", email: "", password: "" });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [success, setSuccess] = useState(false);
  const pending = useRef(false);
  const formRef = useRef(null);
  const feedbackRef = useRef(null);

  function handleChange(event) {
    const { name, value } = event.target;
    setValues((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: undefined }));
    setMessage("");
    setSuccess(false);
  }

  async function handleSubmit(event) {
    event.preventDefault();
    if (pending.current) return;
    const nextErrors = {};
    if (isRegistration && !values.nombre.trim()) nextErrors.nombre = "Introduce tu nombre.";
    if (!values.email.trim()) {
      nextErrors.email = "Introduce tu email.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim())) {
      nextErrors.email = "Introduce un email válido.";
    }
    if (!values.password.trim()) nextErrors.password = "Introduce tu contraseña.";
    setErrors(nextErrors);
    setMessage("");
    setSuccess(false);
    const firstInvalid = Object.keys(nextErrors)[0];
    if (firstInvalid) {
      formRef.current.elements.namedItem(firstInvalid).focus();
      return;
    }
    pending.current = true;
    setLoading(true);
    try {
      const payload = { email: values.email.trim(), password: values.password };
      if (isRegistration) payload.nombre = values.nombre.trim();
      if (isRegistration) {
        await submitAuth(mode, payload);
      } else {
        await auth.login(payload);
        navigate("/perfil", { replace: true });
        return;
      }
      setValues({ nombre: "", email: "", password: "" });
      setSuccess(true);
      setMessage("Tu cuenta se ha creado correctamente. Ya puedes iniciar sesión.");
    } catch (error) {
      setMessage(error.message);
      setValues((current) => ({ ...current, password: "" }));
    } finally {
      pending.current = false;
      setLoading(false);
      feedbackRef.current?.focus();
    }
  }

  const fields = [
    ...(isRegistration ? [{ name: "nombre", label: "Nombre", type: "text", autoComplete: "name" }] : []),
    { name: "email", label: "Email", type: "email", autoComplete: "username" },
    { name: "password", label: "Contraseña", type: "password", autoComplete: isRegistration ? "new-password" : "current-password" },
  ];

  return (
    <main className="auth" aria-labelledby="auth-title">
      <section className="auth__panel">
        <h1 id="auth-title">{isRegistration ? "Crear cuenta" : "Iniciar sesión"}</h1>
        <p className="auth__intro">{isRegistration ? "Regístrate en Isleta Ayuda." : "Accede a tu cuenta de Isleta Ayuda."}</p>
        {!isRegistration && auth.message && <p role="status" className="auth__intro">{auth.message}</p>}
        <form ref={formRef} onSubmit={handleSubmit} noValidate aria-busy={loading}>
          <fieldset disabled={loading} className="auth__fields">
            <legend className="auth__legend">{isRegistration ? "Datos de registro" : "Datos de acceso"}</legend>
            {fields.map(({ name, label, type, autoComplete }) => (
              <div className="auth__field" key={name}>
                <label htmlFor={`auth-${name}`}>{label}</label>
                <input id={`auth-${name}`} name={name} type={type} autoComplete={autoComplete}
                  autoCapitalize={name === "nombre" ? "words" : "none"} spellCheck={false} required
                  value={values[name]} onChange={handleChange} aria-invalid={Boolean(errors[name])}
                  aria-describedby={errors[name] ? `auth-${name}-error` : undefined} />
                {errors[name] && <p className="auth__error" id={`auth-${name}-error`}>{errors[name]}</p>}
              </div>
            ))}
            <button className="auth__submit" type="submit">
              {loading ? "Enviando…" : isRegistration ? "Crear cuenta" : "Iniciar sesión"}
            </button>
          </fieldset>
        </form>
        <div ref={feedbackRef} tabIndex={-1} className={`auth__feedback${success ? " auth__feedback--success" : ""}`}>
          <p role="status" aria-live="polite" aria-atomic="true">{message}</p>
        </div>
        <p className="auth__switch">
          {isRegistration ? "¿Ya tienes una cuenta? " : "¿No tienes una cuenta? "}
          <Link to={isRegistration ? "/login" : "/registro"}>{isRegistration ? "Inicia sesión" : "Regístrate"}</Link>
        </p>
      </section>
    </main>
  );
}
