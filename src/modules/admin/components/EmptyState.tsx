import type { ReactNode } from "react";
import { InboxIcon } from "./icons";

type EmptyStateProps = {
  title: string;
  description?: string;
  icon?: ReactNode;
  action?: ReactNode;
};

const EmptyState = ({ title, description, icon, action }: EmptyStateProps) => (
  <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-neutral-300 bg-white px-6 py-14 text-center">
    <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-neutral-100 text-neutral-500">
      {icon ?? <InboxIcon width={22} height={22} />}
    </div>
    <h3 className="text-sm font-semibold text-neutral-900">{title}</h3>
    {description && <p className="mt-1 max-w-sm text-sm text-neutral-500">{description}</p>}
    {action && <div className="mt-5">{action}</div>}
  </div>
);

export default EmptyState;