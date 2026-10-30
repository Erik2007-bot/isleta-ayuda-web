import SearchBar from "../components/ui/SearchBar";
import CategoryCard from "../components/ui/CategoryCard";
import { Utensils, BriefcaseBusiness, GraduationCap, HandHeart } from "lucide-react";
import "../styles/Inicio.css";
import { Link } from "react-router-dom";

const categorias = [
    { nombre: "Alimentación", icono: Utensils, categoria: "alimentacion" },
    { nombre: "Empleo", icono: BriefcaseBusiness, categoria: "empleo" },
    { nombre: "Formación", icono: GraduationCap, categoria: "formacion" },
    { nombre: "Ayuda social", icono: HandHeart, categoria: "ayuda-social" }
];


export default function Inicio() {
    return (
        <main className="inicio">

            <div className="inicio__branding">
                <img
                    src="/images/logo-isleta-ayuda.png"
                    alt=""
                    className="inicio__logo"
                />
                <h1>Isleta Ayuda</h1>
            </div>

            <p className="inicio__slogan">
                Tu comunidad, más cerca.
            </p>


            <SearchBar />

            <section className="categories" aria-labelledby="categorias-titulo">
                <h2 id="categorias-titulo">Explora por categoría</h2>

                <div className="categories__grid">
                    {categorias.map((categoria) => (
                        <CategoryCard key={categoria.categoria} {...categoria} />
                    ))}
                </div>
                <div className="inicio__actions">
                    <Link to="/recursos" className="inicio__button">
                        Ver todos los recursos
                    </Link>
                </div>
            </section>
        </main>
    );
}


