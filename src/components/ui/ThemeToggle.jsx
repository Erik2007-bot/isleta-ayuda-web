import { Moon, Sun } from "lucide-react";
import "../../styles/ThemeToggle.css";

export default function ThemeToggle({ theme, onToggle }) {
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={
        isDark ? "Activar modo claro" : "Activar modo oscuro"
      }
      title={
        isDark ? "Activar modo claro" : "Activar modo oscuro"
      }
    >
      {isDark ? (
        <Sun size={22} aria-hidden="true" />
      ) : (
        <Moon size={22} aria-hidden="true" />
      )}
    </button>
  );
}
