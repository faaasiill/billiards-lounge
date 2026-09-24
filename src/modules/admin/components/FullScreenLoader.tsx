import Spinner from "./Spinner";

const FullScreenLoader = ({ label = "Loading…" }: { label?: string }) => (
  <div
    role="status"
    aria-live="polite"
    className="flex h-dvh w-full flex-col items-center justify-center gap-3 bg-neutral-50 text-neutral-500"
  >
    <Spinner className="h-6 w-6" />
    <span className="text-sm">{label}</span>
  </div>
);

export default FullScreenLoader;