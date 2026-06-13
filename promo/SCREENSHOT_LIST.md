# DriveWise — Screenshot List

## Screenshot 1

- **Filename:** `01-driver-dashboard-overview.png`
- **URL/State:** `http://localhost:5173` — dashboard home, logged in as a driver
- **What to show:** Driver score (large number, prominently displayed), trip count, distance driven, and the score trend chart. Clean, data-rich layout.
- **Why it matters:** This is the hero image — the first thing anyone sees. It needs to immediately communicate "this is a real product with real data."

---

## Screenshot 2

- **Filename:** `02-trip-detail-events.png`
- **URL/State:** `http://localhost:5173/trips/[id]` — a single trip detail view
- **What to show:** GPS route trace with flagged events highlighted (hard braking in red, sharp turn in amber). Event list below the map showing timestamp and severity for each incident.
- **Why it matters:** Shows the scoring engine output in a human-readable form. This is the core differentiator — transparent, event-level detail.

---

## Screenshot 3

- **Filename:** `03-risk-map.png`
- **URL/State:** `http://localhost:5173/risk-map` — risk map view
- **What to show:** OpenStreetMap with color-coded road segments. A visible hotspot cluster (red segments) near an intersection or sharp curve, with green segments elsewhere.
- **Why it matters:** The risk map is visually striking and immediately communicates the product's real-world value to insurance and fleet audiences.

---

## Screenshot 4

- **Filename:** `04-rewards-simulator.png`
- **URL/State:** `http://localhost:5173/rewards` — rewards simulator view
- **What to show:** Slider or input showing the driver's current score, with a projected premium discount or reward points calculated. Before/after or current/potential state visible.
- **Why it matters:** Makes the insurance angle concrete. Viewers immediately understand the business model this platform enables.

---

## Screenshot 5

- **Filename:** `05-mobile-app-recording.png`
- **URL/State:** Expo Go or simulator — mobile app during active trip recording
- **What to show:** Trip recording screen: live speedometer or distance counter, GPS lock indicator, elapsed time. "Stop Trip" button visible.
- **Why it matters:** Shows the mobile component is real and functional. Proves this is a full end-to-end system, not just a dashboard demo.
