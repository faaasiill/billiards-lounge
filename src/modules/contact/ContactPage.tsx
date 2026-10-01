import InfoPageShell, { CardLabel, InfoCard, PageHeading } from "../info/components/InfoPageShell";
import PillAction from "../info/components/PillAction";
import { ChatIcon, MailIcon, MapPinIcon, PhoneIcon } from "../info/components/icons";
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
    <PageHeading>
      Say <span className="text-brass">hello</span>.
    </PageHeading>

    <InfoCard delayMs={0}>
      <CardLabel>Call or message</CardLabel>
      <p className="mb-4 font-display text-2xl leading-none tracking-[-0.06em] text-ivory light:text-felt-dark">
        {CLUB_INFO.phoneDisplay}
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
        {CLUB_INFO.email}
      </p>
      <PillAction variant="secondary" icon={<MailIcon />} label="Send an email" href={emailHref} />
    </InfoCard>

    <InfoCard delayMs={120}>
      <CardLabel>Visit</CardLabel>
      <p className="mb-4 text-sm leading-relaxed tracking-tight text-ivory/70 light:text-felt-dark/70">
        {CLUB_INFO.address}
      </p>
      {onNavigate ? (
        <PillAction
          variant="secondary"
          icon={<MapPinIcon />}
          label="See location"
          onClick={() => onNavigate("location")}
        />
      ) : null}
    </InfoCard>
  </InfoPageShell>
);

export default ContactPage;