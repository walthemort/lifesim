# Lifesim for iPhone

This repository now contains an iPhone-only, portrait iOS app in `ios/App/App.xcodeproj`, using Capacitor 8 and bundled offline game assets. iOS 16 or newer is required. A wide browser window shows the same phone layout for development; there is no separate desktop product. The bundle identifier is `com.walthemort.lifesim` and must be registered in your Apple Developer team before distribution.

## Build and run on a Mac

1. Install Node 22 or newer and a current stable Xcode compatible with Capacitor 8 and Apple's current submission SDK requirements. Open Xcode once, install its iOS platform, and accept its license.
2. In the repository, run `npm ci`, `npm run ios:sync`, and `npm run ios:check`.
3. Run `npm run ios:open`. Select the **App** target → **Signing & Capabilities**, choose your Apple Developer team, and enable automatic signing. Change the bundle identifier in both Capacitor config and Xcode if your team needs a different identifier.
4. Select an iPhone simulator and press Run. For a physical iPhone, connect it, trust the Mac, enable Developer Mode when prompted, select it in Xcode and Run.
5. Re-run `npm run ios:sync` after every web/game change. `ios:check` verifies that the native asset copy matches the current production build. An already-built app does not contact a development server.

The GitHub Actions workflow builds an unsigned simulator app on macOS. Linux packaging checks do not prove that the Swift project compiled, that signing works, or that Apple accepted the app. Inspect the Actions result after pushing and complete the device checks below before distributing.

## TestFlight and App Store

- Enrol in the Apple Developer Program. Create an App Store Connect iOS app for your registered bundle ID, and choose its actual availability, price and content rating. Keep distribution to iPhone; review Mac and Apple Vision compatibility availability in App Store Connect. The Xcode target disables those compatibility modes.
- The checked-in version is **0.14.0 (1)**. Set the release version and increment the build number in Xcode for each upload. Select **Any iOS Device (arm64)**, then **Product → Archive → Distribute App → App Store Connect**. Xcode handles signing with your team; no signing certificates, passwords or API keys belong in this repository.
- Release to internal TestFlight first. Test cold launches, force-quit/reopen, background/foreground, upgrades from an earlier build, low storage, importing/exporting a save through Files/iCloud, notification decisions, keyboard avoidance, notched/home-indicator devices, reduced motion and VoiceOver. Confirm that the native Preferences save survives a rebuild/update and that an exported pre-update backup can restore the original game. Native share sheets and haptics need a real device check.
- Supply genuine iPhone screenshots from the finished build, an app icon, description, support URL and a publicly reachable HTTPS privacy-policy URL. A policy template is included in `public/privacy.html`; host it at your own public URL and use that actual URL in App Store Connect. A bundled HTML file is not a public policy URL.
- Answer Apple's current age-rating questionnaire accurately for simulated crime, relationships and financial themes. There are no real-money trades, wagering, payouts, advertising, accounts or analytics. Money and personal stories are fictional game state.
- The privacy manifest declares local UserDefaults (`CA92.1`) and file timestamps (`C617.1`) used by the Preferences and Filesystem plugins. The current implementation sends no game data to the developer; exported backups go only to a destination the player chooses. Review App Privacy answers against the final binary and any services you add later.
- **Pro is a local preview switch, not a paid entitlement.** This build has no checkout, receipt verification, subscription or real purchase. Before selling digital Pro features, implement Apple StoreKit purchases, restore purchases, verified entitlements and the required storefront information. Do not submit the preview switch as if it were a paid product.

Review notes can say: “Offline single-player life simulator. No login is required. All finances and criminal events are fictional. Saves stay on-device. Backups use the system share sheet. Pro controls currently provide a free local preview and do not initiate purchases.”

## Data and recovery

The game mirrors its save and migration/debug backups to native Preferences. Browser storage remains a fast working copy; native storage is hydrated on launch and updated in order after saves. Failed native restoration preserves the original Preferences snapshot and warns the player instead of overwriting it. Backups export as JSON through the iOS share sheet. Uninstalling the app may remove local data, so export before removing it. Native and browser saves share the same versioned file format, but Safari does not automatically share its storage with the installed app: export from Safari and import into the app.

The location catalogue is bundled. Keep the database attribution and license files in redistributions; see `data/README.md`. No real device location permission is requested.
