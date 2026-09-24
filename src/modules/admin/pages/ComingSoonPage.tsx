import EmptyState from "../components/EmptyState";

type ComingSoonPageProps = { feature?: string };

/**
 * Safety net: sidebar items marked comingSoon aren't clickable, but if
 * someone deep-links to one (e.g. /#/admin/bookings) they land here
 * instead of on a broken screen.
 */
const ComingSoonPage = ({ feature }: ComingSoonPageProps) => (
  <EmptyState
    title={feature ? `${feature} is coming soon` : "Coming soon"}
    description="We're still building this feature. Check back later."
  />
);

export default ComingSoonPage;