import type { ReactNode } from "react";
import { AlertIcon } from "./icons";

type ErrorStateProps = {
  title?: string;
  description?: string;
  action?: ReactNode;
};

const ErrorState = ({
  title = "Something went wrong",
  description = "We couldn't load this content. Please try again.",
  action,
}: ErrorStateProps) => (
  <div
    role="alert"
    className="flex flex-col items-center justify-center rounded-2xl border border-red-200 bg-red-50/60 px-6 py-14 text-center"
  >
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100 text-red-600">
      <AlertIcon width={22} height={22} />
    </div>
    <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
    <p className="mt-1 max-w-sm text-sm text-neutral-600">{description}</p>
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default ErrorState;