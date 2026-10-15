import InfoPageShell, { CardLabel, InfoCard, PageHeading } from "../info/components/InfoPageShell";
import PillAction from "../info/components/PillAction";
import MapEmbed from "../info/components/MapEmbed";
import OpeningHoursList from "../info/components/OpeningHoursList";
import { ChatIcon, MailIcon, MapPinIcon, NavigationIcon, PhoneIcon } from "../info/components/icons";
import Seo from "../seo/Seo";
import { MAP, OPENING_HOURS } from "../seo/siteConfig";
import { CLUB_INFO, emailHref, phoneHref, whatsappHref } from "../info/clubInfo";
import type { InfoPage } from "../info/types";

type ContactPageProps = {
  onBack: () => void;
  onStartBooking: () => void;
  onMyBookings?: () => void;
  onNavigate?: (page: InfoPage) => void;
};

const ContactPage = ({ onBack, onStartBooking, onMyBookings, onNavigate }: ContactPageProps) => (
  <InfoPageShell
    title="Contact Us"
    onBack={onBack}
    onBookNow={onStartBooking}
    onMyBookings={onMyBookings}
    onNavigate={onNavigate}
  >
    <Seo page="contact" />

    <PageHeading>
      Say <span className="text-brass">hello</span>.
    </PageHeading>

    <InfoCard delayMs={0}>
      <CardLabel>Call or message</CardLabel>
      <p className="mb-2 font-display text-2xl leading-none tracking-[-0.06em] text-ivory light:text-felt-dark">
        <a href={phoneHref}>{CLUB_INFO.phoneDisplay}</a>
      </p>
      <p className="mb-4 text-sm leading-relaxed tracking-tight text-ivory/70 light:text-felt-dark/70">
        Questions about tables, games or a booking? Call or message us on WhatsApp and we will get back to you.
      </p>
      <div className="flex flex-col gap-2.5">
        <PillAction icon={<PhoneIcon />} label="Call us" detail={CLUB_INFO.phoneDisplay} href={phoneHref} />
        <PillAction
          variant="secondary"
          icon={<ChatIcon />}
          label="Chat on WhatsApp"
          detail="Message us directly"
          href={whatsappHref}
          external
        />
      </div>
    </InfoCard>

    <InfoCard delayMs={60}>
      <CardLabel>Email</CardLabel>
      <p className="mb-4 break-all text-sm tracking-tight text-ivory/70 light:text-felt-dark/70">
        <a href={emailHref}>{CLUB_INFO.email}</a>
      </p>
      <PillAction variant="secondary" icon={<MailIcon />} label="Send an email" href={emailHref} />
    </InfoCard>

    {OPENING_HOURS.length > 0 && (
      <InfoCard delayMs={120}>
        <CardLabel>Opening hours</CardLabel>
        <OpeningHoursList />
      </InfoCard>
    )}

    <InfoCard delayMs={OPENING_HOURS.length > 0 ? 180 : 120}>
      <CardLabel>Visit</CardLabel>
      <address className="mb-4 text-sm not-italic leading-relaxed tracking-tight text-ivory/70 light:text-felt-dark/70">
        <span className="block font-display text-base tracking-[-0.04em] text-ivory light:text-felt-dark">
          {CLUB_INFO.name}
        </span>
        {CLUB_INFO.address}
        <span className="mt-1 block text-xs tracking-tighter text-brass">{CLUB_INFO.landmark}</span>
      </address>
      <MapEmbed className="mb-4" title={`${CLUB_INFO.name} on Google Maps`} />
      <div className="flex flex-col gap-2.5">
        <PillAction
          icon={<NavigationIcon />}
          label="Get Directions"
          detail="Opens in Google Maps"
          href={MAP.directionsUrl}
          external
        />
        {onNavigate ? (
          <PillAction
            variant="secondary"
            icon={<MapPinIcon />}
            label="See location"
            onClick={() => onNavigate("location")}
          />
        ) : null}
      </div>
    </InfoCard>
  </InfoPageShell>
);

export default ContactPage;