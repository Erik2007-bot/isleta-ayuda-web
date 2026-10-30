import { Link } from "react-router-dom";
import "../../styles/CategoryCard.css";

export default function CategoryCard({ nombre, icono: Icono, categoria }) {
  return (
    <Link
      to={`/recursos?categoria=${encodeURIComponent(categoria)}`}
      className="category-card"
    >
      <Icono
        className="category-card__icon"
        size={30}
        strokeWidth={1.8}
        aria-hidden="true"
      />
      <span className="category-card__name">{nombre}</span>
    </Link>
  );
}

