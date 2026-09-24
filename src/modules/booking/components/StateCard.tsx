import type { ReactNode } from "react";

type StateCardProps = {
  icon: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
  compact?: boolean;
};

/**
 * Designed replacement for plain-text notices: icon bubble, title,
 * optional description and optional action button.
 */
const StateCard = ({ icon, title, description, action, compact = false }: StateCardProps) => (
  <div
    className={`flex animate-[fade-slide-up_320ms_ease-out] flex-col items-center text-center ${
      compact ? "gap-2 py-3" : "gap-3 py-6"
    }`}
  >
    <div
      className={`flex items-center justify-center rounded-full bg-ivory/10 text-ivory/60 light:bg-felt-dark/10 light:text-felt-dark/60 ${
        compact ? "h-10 w-10" : "h-12 w-12"
      }`}
    >
      {icon}
    </div>

    <div>
      <p className="text-sm font-medium tracking-tight text-ivory light:text-felt-dark">{title}</p>
      {description && (
        <p className="mx-auto mt-1 max-w-64 text-xs tracking-tight text-ivory/55 light:text-felt-dark/55">
          {description}
        </p>
      )}
    </div>

    {action && (
      <button
        onClick={action.onClick}
        className="mt-1 rounded-full bg-ivory px-5 py-2.5 text-sm font-medium tracking-tight text-felt-dark transition-all duration-200 hover:bg-brass active:scale-95 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark"
      >
        {action.label}
      </button>
    )}
  </div>
);

const iconProps = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.7,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ClockIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 7v5l3 2" />
  </svg>
);

export const AlertIcon = () => (
  <svg {...iconProps}>
    <circle cx="12" cy="12" r="9" />
    <path d="M12 8v5M12 16.5v.01" />
  </svg>
);

export const TableIcon = () => (
  <svg {...iconProps}>
    <rect x="3" y="5" width="18" height="14" rx="2.5" />
    <path d="M3 10h18M9 10v9" />
  </svg>
);

export const HourglassIcon = () => (
  <svg {...iconProps}>
    <path d="M6 3h12M6 21h12M7 3v3.5a5 5 0 0 0 2 4l3 2.5-3 2.5a5 5 0 0 0-2 4V21M17 3v3.5a5 5 0 0 1-2 4L12 13l3 2.5a5 5 0 0 1 2 4V21" />
  </svg>
);

export default StateCard;