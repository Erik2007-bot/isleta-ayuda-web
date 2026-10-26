import { Routes, Route } from "react-router-dom";
import Inicio from "../pages/Inicio";
import Recursos from "../pages/Recursos";
import DetalleRecurso from "../pages/DetalleRecurso";
import Login from "../pages/Login";
import Registro from "../pages/Registro";
import Ayuda from "../pages/Ayuda";
import Error404 from "../pages/Error404";

export default function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Inicio />} />
      <Route path="/recursos" element={<Recursos />} />
      <Route path="/recursos/:id" element={<DetalleRecurso />} />
      <Route path="/login" element={<Login />} />
      <Route path="/registro" element={<Registro />} />
      <Route path="/ayuda" element={<Ayuda />} />
      <Route path="*" element={<Error404 />} />
    </Routes>
  );
}
