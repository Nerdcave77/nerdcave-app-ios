# Nerdcave77 iOS App — Launch Guide

Everything R2 built is in this folder. These are the steps only **you** can do,
because they need your identity and your Apple account.

## Step 1 — Apple Developer Program ($99/year)

1. Go to https://developer.apple.com/programs/enroll/ and enroll as an
   **Individual** (simplest for a solo publication).
2. You'll need an Apple ID with two-factor authentication. Approval usually
   takes 24–48 hours.
3. Note your **Team ID** (Membership details page) — you'll need it below.

## Step 2 — Enable push for the app in OneSignal

The app reuses your existing OneSignal app (`Nerdcave77`, ID
`549e1539-3bd4-49b4-bdfa-748f09c4490c`), so article alerts flow to native
iOS subscribers automatically — no backend changes needed.

1. In OneSignal: **Settings → Platforms → Apple iOS (APNs)** → Configure.
2. Use **token-based authentication** (recommended): in your Apple Developer
   account go to **Certificates, Identifiers & Profiles → Keys**, create a key
   with **Apple Push Notifications service (APNs)** enabled, download the
   `.p8` file, and note the **Key ID** and **Team ID**. Paste all three into
   OneSignal.
3. Bundle ID must be **`io.nerdcave77.app`** (already set in `app.json`).

## Step 3 — Build the app (Expo EAS)

On any machine with Node:

```bash
cd nerdcave-ios
npm install -g eas-cli
eas login
eas build:configure   # accept defaults; links the project
eas build --platform ios --profile production
```

The first build asks for your Apple ID to manage certificates/profiles —
EAS handles it automatically. The build runs in Expo's cloud (~15 min) and
you'll get a download link for the `.ipa`.

## Step 4 — Submit to the App Store

```bash
eas submit --platform ios
```

Then in **App Store Connect** (https://appstoreconnect.apple.com):

- Fill in the listing: name **Nerdcave77**, subtitle, description, keywords
  (collectibles, comics, trading cards, Pokémon TCG…), category **News**.
- Screenshots: 6.7" and 6.5" iPhone sizes (take them from a TestFlight build).
- Privacy: the app collects **nothing** — no accounts, no tracking. Push
  tokens go to OneSignal (disclose as standard push-notification use).
- Submit for review. A plain reader app like this typically clears in 1–3 days.

## Step 5 — Flip the production switch

In `app.json`, change the OneSignal plugin `mode` from `"development"` to
`"production"` before the final App Store build:

```json
["onesignal-expo-plugin", { "mode": "production" }]
```

## Notes

- **Giveaway loop:** the growth plan is "download the app to enter." Requiring
  push-on at entry (so winners can be notified) turns every entrant into an
  article-alert subscriber.
- **Marketplace:** the app's Market tab is a "Coming soon" card, same as the
  web app. When the marketplace is ready, we'll point it at the real URL.
- **Web app stays:** `app.nerdcave77.io` keeps serving Android/desktop readers;
  the same Beehiiv webhook fans out pushes to both web and native subscribers.
- **TestFlight:** before the public launch, `eas build --profile preview` +
  TestFlight lets you test push end-to-end on your own iPhone.
