src/
├── App.tsx                                  ~ add about / contact / location pages + onNavigate
├── assets/ …                                (unchanged)
├── context/ …                               (unchanged, ThemeContext)
├── lib/ …                                   (unchanged, supabase, clubHours)
└── modules/
    ├── about/                               + new
    │   ├── AboutPage.tsx                    +
    │   └── index.ts                         +
    │
    ├── contact/                             + new
    │   ├── ContactPage.tsx                  +
    │   └── index.ts                         +
    │
    ├── location/                            + new
    │   ├── LocationPage.tsx                 +
    │   └── index.ts                         +
    │
    ├── info/                                + new, shared by the 3 pages
    │   ├── clubInfo.ts                      +  phone, email, address, googleMapsUrl
    │   ├── types.ts                         +  InfoPage = "about" | "contact" | "location"
    │   └── components/
    │       ├── InfoPageShell.tsx            +  page frame, PageHeading, InfoCard, CardLabel
    │       ├── PillAction.tsx               +  pill link/button
    │       └── icons.tsx                    +
    │
    ├── home/
    │   ├── HomePage.tsx                     ~ accept onNavigate, pass to Navbar
    │   ├── index.ts
    │   └── components/
    │       ├── Navbar.tsx                   ~ onNavigate prop, NAV_LINKS as {label, page}
    │       └── TableCardStack.tsx
    │
    ├── booking/
    │   ├── BookingPage.tsx                  ~ accept onNavigate, pass to all 3 Navbars
    │   ├── index.ts
    │   ├── mockData.ts
    │   ├── types.ts
    │   ├── components/ …                    (unchanged; StateCard is reused by LocationPage)
    │   ├── hooks/ …                         (unchanged)
    │   └── services/ …                      (unchanged)
    │
    ├── mybookings/
    │   ├── MyBookingsPage.tsx               ~ accept onNavigate, pass to Navbar
    │   ├── index.ts
    │   └── components/ …                    (unchanged)
    │
    └── settings/ …                          (unchanged)