import { useEffect, useRef, useState } from "react";
import InfoPageShell, { CardLabel, InfoCard, PageHeading } from "../info/components/InfoPageShell";
import PillAction from "../info/components/PillAction";
import MapEmbed from "../info/components/MapEmbed";
import OpeningHoursList from "../info/components/OpeningHoursList";
import { CheckIcon, CopyIcon, MapPinIcon, NavigationIcon, PhoneIcon } from "../info/components/icons";
import Seo from "../seo/Seo";
import { MAP, OPENING_HOURS } from "../seo/siteConfig";
import { CLUB_INFO, phoneHref } from "../info/clubInfo";
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
      <Seo page="location" />

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
            <address className="mt-1 block text-sm not-italic leading-relaxed tracking-tight text-ivory/70 light:text-felt-dark/70">
              {CLUB_INFO.address}
            </address>
            <span className="mt-2 block text-xs tracking-tighter text-brass">{CLUB_INFO.landmark}</span>
          </div>
        </div>
      </InfoCard>

      <InfoCard delayMs={60}>
        <CardLabel>On the map</CardLabel>
        <MapEmbed className="mb-4" title={`${CLUB_INFO.name} on Google Maps`} />
        <div className="flex flex-col gap-2.5">
          <PillAction
            icon={<NavigationIcon />}
            label="Get Directions"
            detail="Opens in Google Maps"
            href={MAP.directionsUrl}
            external
          />
          <PillAction
            variant="secondary"
            icon={copied ? <CheckIcon /> : <CopyIcon />}
            label={copied ? "Address copied" : "Copy address"}
            onClick={() => void copyAddress()}
          />
        </div>
      </InfoCard>

      {OPENING_HOURS.length > 0 && (
        <InfoCard delayMs={120}>
          <CardLabel>Opening hours</CardLabel>
          <OpeningHoursList />
        </InfoCard>
      )}

      <InfoCard delayMs={OPENING_HOURS.length > 0 ? 180 : 120}>
        <CardLabel>Getting here</CardLabel>
        <p className="mb-4 text-sm leading-relaxed tracking-tight text-ivory/70 light:text-felt-dark/70">
          {CLUB_INFO.name} is on the riverside at Edasserikadavu, {CLUB_INFO.landmark}. Open the map for
          turn-by-turn directions from wherever you are, or call us and we will guide you in.
        </p>
        <div className="flex flex-col gap-2.5">
          <PillAction
            variant="secondary"
            icon={<PhoneIcon />}
            label="Call for directions"
            detail={CLUB_INFO.phoneDisplay}
            href={phoneHref}
          />
          <PillAction label="Reserve your table" onClick={onStartBooking} />
        </div>
      </InfoCard>
    </InfoPageShell>
  );
};

export default LocationPage;