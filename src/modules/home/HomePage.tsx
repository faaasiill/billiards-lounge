import Navbar from "./components/Navbar";
import TableCardStack from "./components/TableCardStack";

type HomePageProps = {
  onReserve: () => void;
};

const HomePage = ({ onReserve }: HomePageProps) => {
  return (
    <div className="flex h-dvh w-full justify-center overflow-hidden bg-felt font-sans light:bg-cream">
      <div className="relative flex h-full w-full max-w-md flex-col overflow-hidden ">
        <Navbar onBookNow={onReserve} />

        {/* Hero */}
        <main className="flex flex-1 flex-col items-center justify-center px-6 text-center">
          <h1 className="font-display text-5xl tracking-[-0.12em] text-ivory leading-11 mb-4 light:text-felt-dark">
            Every table, <span className="text-brass ">one tap</span> away.
          </h1>

          <div className="mt-9 w-full">
            <TableCardStack />
          </div>
        </main>

        {/* Footer CTA — a bright pill in dark mode, inverted to a dark pill
            in light mode so it keeps the same "pop" against the page. */}
        <footer className="px-20 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
          <button
            onClick={onReserve}
            className="group flex w-full items-center justify-between rounded-full border border-ivory/10 bg-ivory px-5 py-3.5 text-felt-dark transition-all duration-300 hover:bg-brass active:scale-[0.98] light:border-felt-dark/10 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark"
          >
            <span className="ml-2 font-medium tracking-[-0.04em]">
              Reserve your table
            </span>

            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-felt-dark text-ivory transition-transform duration-300 group-hover:translate-x-0.5 light:bg-ivory light:text-felt-dark">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M5 12h14" />
                <path d="m13 6 6 6-6 6" />
              </svg>
            </span>
          </button>
        </footer>
      </div>
    </div>
  );
};

export default HomePage;