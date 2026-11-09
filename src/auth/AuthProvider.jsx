import { useEffect, useState, useSyncExternalStore } from "react";
import { AuthContext } from "./AuthContext";
import { createAuthSession } from "./session";

export default function AuthProvider({ children }) {
  const [session] = useState(createAuthSession);
  const state = useSyncExternalStore(session.subscribe, session.getSnapshot);
  useEffect(() => {
    window.addEventListener("focus", session.checkExpiry);
    document.addEventListener("visibilitychange", session.checkExpiry);
    return () => {
      window.removeEventListener("focus", session.checkExpiry);
      document.removeEventListener("visibilitychange", session.checkExpiry);
    };
  }, [session]);
  return <AuthContext.Provider value={{ ...state, login: session.login, logout: session.logout, refreshProfile: session.refreshProfile }}>{children}</AuthContext.Provider>;
}
