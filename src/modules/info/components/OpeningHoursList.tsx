import { OPENING_HOURS, type Weekday } from "../../seo/siteConfig";

const ORDER: Weekday[] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const to12h = (hhmm: string) => {
  const [h, m] = hhmm.split(":").map(Number);
  const suffix = h >= 12 && h < 24 ? "PM" : "AM";
  const hour = h % 12 === 0 ? 12 : h % 12;
  return `${hour}:${String(m).padStart(2, "0")} ${suffix}`;
};

const dayLabel = (days: Weekday[]) => {
  const sorted = [...days].sort((a, b) => ORDER.indexOf(a) - ORDER.indexOf(b));
  if (sorted.length === 7) return "Every day";
  const first = ORDER.indexOf(sorted[0]);
  const contiguous = sorted.every((d, i) => ORDER.indexOf(d) === first + i);
  if (contiguous && sorted.length > 2) return `${sorted[0].slice(0, 3)} – ${sorted[sorted.length - 1].slice(0, 3)}`;
  return sorted.map((d) => d.slice(0, 3)).join(", ");
};

/** Renders OPENING_HOURS from siteConfig; renders nothing until real hours are configured. */
const OpeningHoursList = () => {
  if (OPENING_HOURS.length === 0) return null;

  return (
    <dl className="flex flex-col divide-y divide-ivory/10 light:divide-felt-dark/10">
      {OPENING_HOURS.map((range) => (
        <div
          key={`${range.days.join("-")}-${range.opens}`}
          className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0"
        >
          <dt className="font-display text-base tracking-[-0.04em] text-ivory light:text-felt-dark">
            {dayLabel(range.days)}
          </dt>
          <dd className="text-sm tracking-tight text-ivory/70 light:text-felt-dark/70">
            <time dateTime={range.opens}>{to12h(range.opens)}</time> –{" "}
            <time dateTime={range.closes}>{to12h(range.closes)}</time>
          </dd>
        </div>
      ))}
    </dl>
  );
};

export default OpeningHoursList;