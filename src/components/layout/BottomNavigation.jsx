import { NavLink } from "react-router-dom";
import "../../styles/BottomNavigation.css";

export default function BottomNavigation() {
  return (
    <nav
      className="bottom-nav"
      aria-label="Navegación móvil"
    >
      <NavLink to="/" end>
        <span aria-hidden="true">⌂</span>
        <span>Inicio</span>
      </NavLink>

      <NavLink to="/recursos">
        <span aria-hidden="true">⌕</span>
        <span>Recursos</span>
      </NavLink>

      <NavLink to="/ayuda">
        <span aria-hidden="true">?</span>
        <span>Ayuda</span>
      </NavLink>

      <NavLink to="/login">
        <span aria-hidden="true">♙</span>
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
}
