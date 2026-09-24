# Nerdcave77 — App Store Listing (v1.0)

Prepared for App Store Connect. Paste-ready.

## Basics
- **App name:** Nerdcave77
- **Subtitle:** News & drops for collectors (27 chars, limit 30)
- **Category:** News
- **Content rights:** Nerdcave77 publishes its own original articles.
- **Age rating:** 4+ (no objectionable content, no user-generated content, no gambling)

## Description
Nerdcave77 is the collector's newsstand — every story about the hobby you love, in one clean feed.

- Breaking news across sports cards, Pokémon TCG, comics, and digital collectibles
- **Drop Calendar:** every confirmed physical release and digital drop, with countdowns and push reminders so you never miss one
- **New article alerts:** get pinged the moment a story publishes
- **Saved stories:** bookmark articles to read later, right on your device

No accounts. No ads. No noise. Just the hobby.

Published by Nerdcave77 — digital & physical collectibles news.

## Keywords (99 chars, limit 100)
```
collectibles,tradingcards,pokemontcg,comics,veve,topps,panini,digitalcollectibles,sportscards,drops
```

## Screenshots (required sizes)
- **6.7" iPhone** (1290 × 2796): Home feed, Drop Calendar, article reader — 3 minimum, 10 max
- **6.5" iPhone** (1242 × 2688): same set, or let App Store Connect reuse 6.7"
- Take from the TestFlight build on a real iPhone (Apple wants real app screenshots)

Suggested shot list:
1. Home feed (latest articles)
2. Drop Calendar with countdowns
3. Drop card with "Reminder on" state
4. Article reader
5. Saved tab

## Privacy (App Store Connect questionnaire)
- **Does the app collect data?** Yes
- **Data collected:** Device ID (push token), via OneSignal — used for **App Functionality** (article alerts + drop reminders). Not linked to identity. Not used for tracking.
- **Tracking:** No (no IDFA, no cross-app tracking)
- **Privacy policy URL:** https://app.nerdcave77.io/privacy (ships with the web app)

## Review notes (for the reviewer)
> Nerdcave77 is a news reader for our collectibles publication. Articles load from our own CMS API (app.nerdcave77.io/api). Push notifications are article alerts and drop reminders via OneSignal; the user opts in from Settings. No login, no purchases, no user-generated content. The Market tab previews our upcoming marketplace discovery feature — the app is fully functional without it.

## Version info
- Version 1.0.0, build 1
- Bundle ID: io.nerdcave77.app
- OneSignal plugin mode must be **production** for the submitted build
