import { useState } from "react";
import HomePage from "./modules/home";
import BookingPage from "./modules/booking";
import { ThemeProvider } from "./context/ThemeContext";

type View = "home" | "booking";

const App = () => {
  const [view, setView] = useState<View>("home");

  return (
    <ThemeProvider>
      {view === "home" ? (
        <HomePage onReserve={() => setView("booking")} />
      ) : (
        <BookingPage onExit={() => setView("home")} />
      )}
    </ThemeProvider>
  );
};

export default App;