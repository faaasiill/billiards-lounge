import { useEffect, useRef, useState } from "react";
import InfoPageShell, { CardLabel, InfoCard, PageHeading } from "../info/components/InfoPageShell";
import PillAction from "../info/components/PillAction";
import { CheckIcon, CopyIcon, MapPinIcon, NavigationIcon, PhoneIcon } from "../info/components/icons";
import StateCard, { ClockIcon } from "../booking/components/StateCard";
import { CLUB_INFO, hasMapsLink, phoneHref } from "../info/clubInfo";
import type { InfoPage } from "../info/types";

type LocationPageProps = {
  onBack: () => void;
  onStartBooking: () => void;
  onMyBookings?: () => void;
  onNavigate?: (page: InfoPage) => void;
};

const LocationPage = ({ onBack, onStartBooking, onMyBookings, onNavigate }: LocationPageProps) => {
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(
    () => () => {
      if (timer.current) window.clearTimeout(timer.current);
    },
    [],
  );

  const copyAddress = async () => {
    try {
      await navigator.clipboard.writeText(CLUB_INFO.address);
      setCopied(true);
      if (timer.current) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 2000);
    } catch {
      /* Clipboard unavailable (e.g. insecure context): the address is still shown on screen. */
    }
  };

  return (
    <InfoPageShell
      title="Location"
      onBack={onBack}
      onBookNow={onStartBooking}
      onMyBookings={onMyBookings}
      onNavigate={onNavigate}
    >
      <PageHeading>
        Find us by the <span className="text-brass">river</span>.
      </PageHeading>

      <InfoCard delayMs={0}>
        <div className="flex items-start gap-3.5">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-ivory/10 text-ivory/70 light:bg-felt-dark/10 light:text-felt-dark/70">
            <MapPinIcon />
          </span>
          <div className="min-w-0">
            <span className="block font-display text-lg leading-tight tracking-[-0.04em] text-ivory light:text-felt-dark">
              {CLUB_INFO.name}
            </span>
            <span className="mt-1 block text-sm leading-relaxed tracking-tight text-ivory/70 light:text-felt-dark/70">
              {CLUB_INFO.address}
            </span>
            <span className="mt-2 block text-xs tracking-tighter text-brass">{CLUB_INFO.landmark}</span>
          </div>
        </div>
      </InfoCard>

      <InfoCard delayMs={60}>
        <CardLabel>Get directions</CardLabel>

        {hasMapsLink ? (
          <div className="flex flex-col gap-2.5">
            <PillAction
              icon={<NavigationIcon />}
              label="Get Directions"
              detail="Opens in Google Maps"
              href={CLUB_INFO.googleMapsUrl}
              external
            />
            <PillAction
              variant="secondary"
              icon={copied ? <CheckIcon /> : <CopyIcon />}
              label={copied ? "Address copied" : "Copy address"}
              onClick={() => void copyAddress()}
            />
          </div>
        ) : (
          <>
            <StateCard
              compact
              icon={<ClockIcon />}
              title="Map link coming soon"
              description="Our Google Maps listing is being verified. Call us for directions in the meantime."
            />
            <div className="mt-3 flex flex-col gap-2.5">
              <PillAction
                variant="secondary"
                icon={<PhoneIcon />}
                label="Call for directions"
                detail={CLUB_INFO.phoneDisplay}
                href={phoneHref}
              />
              <PillAction
                variant="secondary"
                icon={copied ? <CheckIcon /> : <CopyIcon />}
                label={copied ? "Address copied" : "Copy address"}
                onClick={() => void copyAddress()}
              />
            </div>
          </>
        )}
      </InfoCard>
    </InfoPageShell>
  );
};

export default LocationPage;