import type { Activity } from "../types";

type ActivityListProps = {
  activities: Activity[];
  onSelect: (activity: Activity) => void;
};

const ActivityList = ({ activities, onSelect }: ActivityListProps) => {
  return (
    <div className="flex flex-col gap-5 px-6 pb-6">
      {activities.map((activity, i) => (
        <button
          key={activity.id}
          onClick={() => onSelect(activity)}
          style={{
            animationDelay: `${i * 70}ms`,
            animationFillMode: "backwards",
          }}
          className="group relative overflow-hidden rounded-4xl bg-ivory text-left transition-transform duration-300 active:scale-[0.98] animate-[fade-slide-up_420ms_ease-out] light:bg-felt-dark"
        >
          {/* Image */}
          <div className="relative mx-[3px] mt-[3px] h-90 overflow-hidden rounded-[calc(theme(borderRadius.4xl)-3px)]">
            <div
              className="absolute inset-0 bg-cover bg-center transition-transform duration-500 ease-out group-active:scale-105"
              style={{
                backgroundImage: `url(${activity.image})`,
              }}
            />
          </div>

          {/* Content */}
          <div className="px-5 pb-5 pt-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="font-display text-2xl leading-none tracking-[-0.08em] text-felt-dark light:text-ivory">
                  {activity.name}
                </span>

                <span className="block text-xs tracking-tight text-felt-dark/55 light:text-ivory/55">
                  {activity.tagline}
                </span>
              </div>

              {/* Arrow */}
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-felt-dark text-ivory transition-transform duration-300 group-active:translate-x-0.5 light:bg-ivory light:text-felt-dark">
                <svg
                  width="15"
                  height="15"
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
            </div>

            {/* Information */}
            <div className="mt-5 flex items-baseline justify-between">
              <span className="text-xs tracking-tight text-felt-dark/55 light:text-ivory/55">
                Starting from
              </span>

              <span className="font-display text-base tracking-[-0.02em] text-felt-dark light:text-ivory">
                ₹{activity.startingPrice}
              </span>
            </div>
          </div>
        </button>
      ))}
    </div>
  );
};

export default ActivityList;