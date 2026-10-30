
import { NavLink } from "react-router-dom";
import { House, Search, CircleHelp, UserRound } from "lucide-react";
import "../../styles/BottomNavigation.css";

export default function BottomNavigation() {
  return (
    <nav className="bottom-nav" aria-label="Navegación móvil">
      <NavLink to="/" end>
        <House size={24} strokeWidth={1.8} aria-hidden="true" />
        <span>Inicio</span>
      </NavLink>

      <NavLink to="/recursos">
        <Search size={24} strokeWidth={1.8} aria-hidden="true" />
        <span>Recursos</span>
      </NavLink>

      <NavLink to="/ayuda">
        <CircleHelp size={24} strokeWidth={1.8} aria-hidden="true" />
        <span>Ayuda</span>
      </NavLink>

      <NavLink to="/login">
        <UserRound size={24} strokeWidth={1.8} aria-hidden="true" />
        <span>Perfil</span>
      </NavLink>
    </nav>
  );
}

