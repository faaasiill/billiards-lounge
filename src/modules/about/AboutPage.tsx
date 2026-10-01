import InfoPageShell, { CardLabel, InfoCard, PageHeading } from "../info/components/InfoPageShell";
import PillAction from "../info/components/PillAction";
import { MapPinIcon } from "../info/components/icons";
import { CLUB_INFO } from "../info/clubInfo";
import type { InfoPage } from "../info/types";

type AboutPageProps = {
  onBack: () => void;
  /** Starts the booking flow. */
  onStartBooking: () => void;
  onMyBookings?: () => void;
  onNavigate?: (page: InfoPage) => void;
};

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1642191135995-6de2cce0bbdc?auto=format&fit=crop&w=900&q=80";

const OFFERINGS = [
  { name: "Billiards", note: "Snooker and 8-Ball tables" },
  { name: "Chess", note: "Quiet boards for a slower game" },
  { name: "PS5", note: "Console gaming with friends" },
  { name: "And more", note: "New games and experiences as we grow" },
];

const AboutPage = ({ onBack, onStartBooking, onMyBookings, onNavigate }: AboutPageProps) => (
  <InfoPageShell
    title="About Us"
    onBack={onBack}
    onBookNow={onStartBooking}
    onMyBookings={onMyBookings}
    onNavigate={onNavigate}
  >
    <PageHeading>
      Play, unwind, <span className="text-brass">stay a while</span>.
    </PageHeading>

    {/* Hero — same photo-card + scrim + overlay treatment as the schedule hero. */}
    <div className="mx-6 mb-5 animate-[fade-scale-in_400ms_ease-out] overflow-hidden rounded-4xl border border-ivory/10 light:border-felt-dark/10">
      <div className="relative h-72 bg-cover bg-center" style={{ backgroundImage: `url(${HERO_IMAGE})` }}>
        <div
          className="pointer-events-none absolute inset-x-0 bottom-0 h-2/3"
          style={{ background: "linear-gradient(to top, rgba(11,36,28,0.92), rgba(11,36,28,0))" }}
        />
        <div className="relative flex h-full flex-col justify-end p-5">
          <span className="font-display text-xl leading-none tracking-[-0.06em] text-ivory">
            {CLUB_INFO.name}
          </span>
          <span className="mt-1 text-xs tracking-tight text-ivory/75">{CLUB_INFO.landmark}</span>
        </div>
      </div>
    </div>

    <InfoCard delayMs={0}>
      <CardLabel>Our place</CardLabel>
      <p className="text-sm leading-relaxed tracking-tight text-ivory/70 light:text-felt-dark/70">
        Billiards Lounge is a premium entertainment destination by the riverside of Edasserikadavu.
        Come for a frame of billiards, a game of chess or a few rounds on the PS5, and stay as long as
        you like.
      </p>
    </InfoCard>

    <InfoCard delayMs={60}>
      <CardLabel>What you can play</CardLabel>
      <div className="flex flex-col divide-y divide-ivory/10 light:divide-felt-dark/10">
        {OFFERINGS.map((item) => (
          <div key={item.name} className="flex items-baseline justify-between gap-4 py-2.5 first:pt-0 last:pb-0">
            <span className="font-display text-base tracking-[-0.04em] text-ivory light:text-felt-dark">
              {item.name}
            </span>
            <span className="text-right text-xs tracking-tighter text-ivory/55 light:text-felt-dark/55">
              {item.note}
            </span>
          </div>
        ))}
      </div>
    </InfoCard>

    <InfoCard delayMs={120}>
      <CardLabel>Premium café</CardLabel>
      <p className="text-sm leading-relaxed tracking-tight text-ivory/70 light:text-felt-dark/70">
        Between games, head to our premium café. It is a relaxed spot to take a break, catch up and
        spend time with friends, whether you are playing or just hanging out.
      </p>
    </InfoCard>

    <div
      className="mx-6 flex animate-[fade-slide-up_380ms_ease-out] flex-col gap-2.5"
      style={{ animationDelay: "180ms", animationFillMode: "backwards" }}
    >
      <PillAction label="Reserve your table" onClick={onStartBooking} />
      {onNavigate && (
        <PillAction
          variant="secondary"
          icon={<MapPinIcon />}
          label="Find us"
          detail={CLUB_INFO.landmark}
          onClick={() => onNavigate("location")}
        />
      )}
    </div>
  </InfoPageShell>
);

export default AboutPage;