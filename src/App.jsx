import Header from "./components/layout/Header";
import BottomNavigation from "./components/layout/BottomNavigation";
import AppRoutes from "./routes/AppRoutes";

export default function App() {
  return (
    <>
      <Header />
      <AppRoutes />
      <BottomNavigation />
    </>
  );
}



