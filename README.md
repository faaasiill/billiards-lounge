📦src
 ┣ 📂assets
 ┃ ┗ 📜logo design1.png
 ┣ 📂context
 ┃ ┗ 📜ThemeContext.tsx
 ┣ 📂modules
 ┃ ┣ 📂booking
 ┃ ┃ ┣ 📂components
 ┃ ┃ ┃ ┣ 📜ActivityList.tsx
 ┃ ┃ ┃ ┣ 📜BookingBar.tsx
 ┃ ┃ ┃ ┣ 📜BottomSheet.tsx
 ┃ ┃ ┃ ┣ 📜ConfirmationScreen.tsx        [MOD] — added "View My Bookings" button
 ┃ ┃ ┃ ┣ 📜CustomerDetailsSheet.tsx
 ┃ ┃ ┃ ┣ 📜DateCalendar.tsx
 ┃ ┃ ┃ ┣ 📜DateStrip.tsx
 ┃ ┃ ┃ ┣ 📜Durationselector.tsx
 ┃ ┃ ┃ ┣ 📜PlayersSelector.tsx
 ┃ ┃ ┃ ┣ 📜ReviewSheet.tsx
 ┃ ┃ ┃ ┣ 📜SlotGrid.tsx
 ┃ ┃ ┃ ┗ 📜useMorphTransition.ts
 ┃ ┃ ┣ 📜BookingPage.tsx                  [MOD] — emits Booking on confirm, wires onViewBookings
 ┃ ┃ ┣ 📜index.ts
 ┃ ┃ ┣ 📜mockData.ts
 ┃ ┃ ┗ 📜types.ts                         [MOD] — added Booking interface
 ┃ ┣ 📂home
 ┃ ┃ ┣ 📂components
 ┃ ┃ ┃ ┣ 📜Navbar.tsx                     [MOD] — added onMyBookings prop + dropdown link
 ┃ ┃ ┃ ┗ 📜TableCardStack.tsx
 ┃ ┃ ┣ 📜HomePage.tsx                     [MOD] — forwards onMyBookings to Navbar
 ┃ ┃ ┗ 📜index.ts
 ┃ ┗ 📂mybookings                         [NEW] — entire module
 ┃ ┃ ┣ 📂components
 ┃ ┃ ┃ ┣ 📜BookingCard.tsx                [NEW] — morphic expandable booking row
 ┃ ┃ ┃ ┗ 📜EmptyBookings.tsx              [NEW] — empty state
 ┃ ┃ ┣ 📜MyBookingsPage.tsx               [NEW] — page component
 ┃ ┃ ┗ 📜index.ts                         [NEW] — barrel export
 ┣ 📜.DS_Store
 ┣ 📜App.css
 ┣ 📜App.tsx                              [MOD] — added "myBookings" view + lifted bookings state
 ┣ 📜index.css
 ┗ 📜main.tsx