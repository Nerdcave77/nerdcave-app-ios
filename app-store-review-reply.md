# Nerdcave77 — Reply to App Review (Guideline 2.1 Information Needed)

To be sent via "Reply to App Review" in App Store Connect AND pasted into the
Notes field of the App Review Information section.

---

## 1. Screen recording

[ATTACHMENT: screen recording captured on the developer's iPhone running the
latest iOS, beginning with the app open on the Feed]

The recording shows the typical user flow: brief launch intro (tap to skip) → scrolling the Feed → opening an article and scrolling through it → back to the feed → Drops tab with All / Trading Cards / Digital / Comics filters, drop cards with countdowns and "Remind me" buttons → tapping a drop card opens its detail screen → Market tab with the latest collectible market news and movers → Saved tab (reading list) → Settings (push notification opt-in toggle).

The following do not apply to this app and are therefore not shown:
- Account registration / login / account deletion: the app has no accounts and no sign-in of any kind.
- User-generated content: the app has no user-generated content and no reporting/blocking flows.
- Paid content or features: the app has no purchases, subscriptions, or paid features.

## 2. Purpose and target audience

Nerdcave77 is the drop calendar and news app for collectors, built by collectors.

The core problem it solves: limited-edition releases sell out fast, and drop
information is scattered across social media and brand sites. Collectors miss
releases they would have bought. Nerdcave77's Drop Calendar centralizes every
confirmed physical release (Topps, Pokémon TCG, comics) and digital drop
(VeVe, Disney Pinnacle) with dates, countdowns, and push reminders — so users
never miss a release.

Secondarily, the app delivers breaking collectibles news — sports cards,
Pokémon TCG, comics, and digital collectibles — with push alerts the moment a
story publishes.

Target audience: collectors of physical and digital collectibles who want to
stay ahead of releases and follow hobby news in one place.

## 3. Setup and accessing main features

No setup is required. There is no account, no login, and no onboarding — the
app is fully usable the moment it opens.

- Feed: browse the feed and tap any story to read it. Tap the bookmark icon to save stories to the Saved tab.
- Drops: browse All / Trading Cards / Digital / Comics. Tap "Remind me" on any drop to receive push reminders before it goes live; tap a drop card to open its detail screen.
- Market: collectible market news updated twice daily — major sales and auction results, new-comics sell-through, trading-card and digital-collectible price movers, and market trends. Tap "View source" on any card to open the original report.
- Saved: bookmarked articles, stored on-device.
- Settings: opt in to "New article alerts" and manage notification preferences (iOS permission prompt appears on first enable).

No login credentials or sample files are needed — there is no gated content.

## 4. External services

- Nerdcave77 CMS API (app.nerdcave77.io/api): serves our original editorial articles, sourced from our own Beehiiv publication, plus the Market news feed. Every Market item is reviewed and approved by our editorial team before it appears, and each card links to its original source.
- Supabase: stores Drop Calendar data (release dates, sources) and approved Market news items.
- OneSignal: push notifications for new-article alerts and drop reminders (user opts in from Settings; no account required).
- Vercel: hosts the API above.

The app uses no authentication services, no payment processors, and no AI services.

## 5. Regional differences

None. The app functions identically in all regions. All content is in English.

## 6. Regulated industry / protected third-party material

Not applicable. Nerdcave77 is a collectibles news and drop-calendar app — it does
not operate in a regulated industry, and all articles are Nerdcave77's own
original editorial content (as declared under Content Rights in App Information).
