const p = {
  width: 16,
  height: 16,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
  "aria-hidden": true,
};

export const ArrowIcon = () => (
  <svg {...p}>
    <path d="M5 12h14" />
    <path d="m13 6 6 6-6 6" />
  </svg>
);

export const PhoneIcon = () => (
  <svg {...p}>
    <path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2Z" />
  </svg>
);

export const MailIcon = () => (
  <svg {...p}>
    <rect x="3" y="5" width="18" height="14" rx="3" />
    <path d="m3.5 7 8.5 6 8.5-6" />
  </svg>
);

export const ChatIcon = () => (
  <svg {...p}>
    <path d="M21 11.5a8.4 8.4 0 0 1-12.4 7.4L3 20.5l1.7-5.2A8.5 8.5 0 1 1 21 11.5Z" />
  </svg>
);

export const MapPinIcon = () => (
  <svg {...p}>
    <path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 0 1 16 0Z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

export const NavigationIcon = () => (
  <svg {...p}>
    <path d="m3 11 18-8-8 18-2-8-8-2Z" />
  </svg>
);

export const CopyIcon = () => (
  <svg {...p}>
    <rect x="9" y="9" width="12" height="12" rx="3" />
    <path d="M5 15V6a2 2 0 0 1 2-2h9" />
  </svg>
);

export const CheckIcon = () => (
  <svg {...p}>
    <path d="M20 6 9 17l-5-5" />
  </svg>
);