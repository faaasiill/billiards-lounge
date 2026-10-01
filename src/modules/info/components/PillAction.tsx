import type { ReactNode } from "react";
import { ArrowIcon } from "./icons";

type PillActionProps = {
  label: string;
  /** Secondary line, e.g. the phone number or email being acted on. */
  detail?: string;
  icon?: ReactNode;
  variant?: "primary" | "secondary";
  /** Renders an <a> when set, otherwise a <button>. */
  href?: string;
  /** Opens href in a new tab. */
  external?: boolean;
  onClick?: () => void;
};

const base =
  "group flex w-full items-center justify-between rounded-full px-5 py-3.5 text-left transition-all duration-300 active:scale-[0.98]";

const variants = {
  primary:
    "border border-ivory/10 bg-ivory text-felt-dark hover:bg-brass light:border-felt-dark/10 light:bg-felt-dark light:text-ivory light:hover:text-felt-dark",
  secondary:
    "border border-ivory/15 text-ivory hover:border-ivory/30 active:bg-ivory/10 light:border-felt-dark/15 light:text-felt-dark light:hover:border-felt-dark/30 light:active:bg-felt-dark/10",
};

const circle = {
  primary:
    "bg-felt-dark text-ivory light:bg-ivory light:text-felt-dark",
  secondary:
    "bg-ivory/10 text-ivory light:bg-felt-dark/10 light:text-felt-dark",
};

/**
 * The site's pill button (same shape as "Reserve your table" and the
 * booking bar) as a link or button, with an optional leading icon and a
 * detail line.
 */
const PillAction = ({
  label,
  detail,
  icon,
  variant = "primary",
  href,
  external,
  onClick,
}: PillActionProps) => {
  const className = `${base} ${variants[variant]}`;

  const content = (
    <>
      <span className="ml-1.5 flex min-w-0 items-center gap-2.5">
        {icon && <span className="shrink-0 opacity-80">{icon}</span>}
        <span className="flex min-w-0 flex-col leading-none">
          <span className="text-sm font-medium tracking-[-0.02em]">{label}</span>
          {detail && (
            <span className="mt-1 truncate text-[11px] tracking-tighter opacity-60">{detail}</span>
          )}
        </span>
      </span>

      <span
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-transform duration-300 group-hover:translate-x-0.5 ${circle[variant]}`}
      >
        <ArrowIcon />
      </span>
    </>
  );

  if (href) {
    return (
      <a
        href={href}
        className={className}
        {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {content}
      </a>
    );
  }

  return (
    <button type="button" onClick={onClick} className={className}>
      {content}
    </button>
  );
};

export default PillAction;