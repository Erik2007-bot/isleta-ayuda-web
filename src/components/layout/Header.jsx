import { NavLink } from "react-router-dom";
import "../../styles/Header.css";

export default function Header() {
  return (
    <header className="header">
      <NavLink to="/" className="header__logo">
        Isleta Ayuda
      </NavLink>

      <nav aria-label="Navegación principal" className="header__nav">
        <NavLink to="/" end>Inicio</NavLink>
        <NavLink to="/recursos">Recursos</NavLink>
        <NavLink to="/ayuda">Ayuda</NavLink>
        <NavLink to="/login">Iniciar sesión</NavLink>
      </nav>
    </header>
  );
}
