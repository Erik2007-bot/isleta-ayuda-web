import { useEffect, useState } from "react";
import Header from "./components/layout/Header";
import BottomNavigation from "./components/layout/BottomNavigation";
import ThemeToggle from "./components/ui/ThemeToggle";
import AppRoutes from "./routes/AppRoutes";

function getInitialTheme() {
  try {
    return localStorage.getItem("isleta-theme") === "dark"
      ? "dark"
      : "light";
  } catch {
    return "light";
  }
}

export default function App() {
  const [theme, setTheme] = useState(getInitialTheme);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;

    try {
      localStorage.setItem("isleta-theme", theme);
    } catch {
      // La aplicación sigue funcionando aunque el almacenamiento esté bloqueado.
    }
  }, [theme]);

  function toggleTheme() {
    setTheme((current) => current === "light" ? "dark" : "light");
  }

  return (
    <>
      <Header />
      <div className="theme-toggle-container">
        <ThemeToggle theme={theme} onToggle={toggleTheme} />
      </div>
      <AppRoutes />
      <BottomNavigation />
    </>
  );
}




