# @helpbento/capacitor-widget

HelpBento AI chat widget for Capacitor apps (iOS, Android, web).

A Capacitor app runs in a webview, so this plugin is **pure TypeScript — no
native code**. It loads the same `widget.js` that powers the JavaScript SDK
and renders the widget directly in your app's DOM. One UI source of truth:
widget fixes and new features ship server-side without an SDK update.

## Install

```bash
npm install @helpbento/capacitor-widget
npx cap sync
```

## Usage

```typescript
import { HelpBento } from '@helpbento/capacitor-widget';

// Initialize once at app startup
await HelpBento.init({ companyId: 'YOUR_COMPANY_ID' });

// Identify the logged-in user (HMAC generated on YOUR server — see the
// HelpBento widget integration guide)
await HelpBento.identify({
  userId: 'user_123',
  email: 'user@example.com',
  name: 'John Doe',
  hmac: hmacFromYourServer,
});

// Events
const handle = await HelpBento.addListener('message', (event) => {
  console.log('Assistant replied:', event.content);
});

// Open programmatically (e.g. from your own Help button)
await HelpBento.open();

// Your own support form (no chat panel opens; needs identify() with email + hmac)
const { requestId } = await HelpBento.submitSupport({
  subject: "Can't export invoices",
  message: 'Clicking Export does nothing.',
  customFields: { reason: 'Billing' },
});

// On logout
await HelpBento.clearUser();
```

### API

| Method | Description |
|--------|-------------|
| `init(options)` | Load and initialize the widget. `companyId` required; optional `agentId`, `showLauncher`, `position`, `animations`, `scriptUrl`. |
| `identify(user)` | Identify the logged-in user (`userId` required; `email`, `name`, `hmac`). |
| `clearUser()` | Clear identity on logout. |
| `open()` / `close()` / `toggle()` | Control the chat panel. |
| `isOpen()` | Resolves `{ isOpen: boolean }`. |
| `submitSupport(request)` | Send your own in-app support form to the HelpBento inbox without opening the chat. `message` required; optional `subject`, `customFields`. Resolves `{ requestId }`. Needs a verified `identify()` with `email` + `hmac`. |
| `destroy()` | Tear down the widget; `init()` may be called again. |
| `addListener(event, cb)` | Events: `open`, `close`, `message`, `error`. |
| `removeAllListeners()` | Remove all plugin listeners. |

## Platform notes

- **Content Security Policy**: if your app sets a CSP, allow
  `https://app.helpbento.com` for `script-src` (widget.js) and `connect-src`
  (chat API calls).
- **Safe areas (notch / home indicator)**: add `viewport-fit=cover` to your
  `index.html` viewport meta tag. The widget pads its fullscreen mobile panel
  and launcher with `env(safe-area-inset-*)`.
- **Domain allowlist**: a webview's origin is `capacitor://localhost`, so if
  your workspace restricts the widget to specific domains
  (Settings > Support Agents), requests from the app will be denied. Leave the
  allowlist empty for now if you ship the widget in a mobile app — a
  mobile-app allowlist is on the roadmap.
- **`scriptUrl` must be remote**: never bundle widget.js into the app. The
  widget derives its API base URL from the script's origin, so a
  `capacitor://` origin breaks API routing. The default
  (`https://app.helpbento.com/widget.js`) is correct for production.
- **Keyboard (smooth input slide)**: the widget follows the on-screen
  keyboard by tracking the webview's *visual viewport* frame-by-frame — so
  how smoothly the input moves depends on when your app's webview learns
  about the keyboard, which the host app controls, not this plugin.
  - **iOS**: if you use `@capacitor/keyboard`, its default `resize: "native"`
    mode resizes the whole webview in one step **after** the keyboard has
    opened — the input can only jump up then. Set the resize mode to `none`
    (`capacitor.config`: `plugins.Keyboard.resize = "none"`) and the
    WKWebView's visual viewport instead animates with the keyboard, letting
    the widget slide in sync. (Without the Keyboard plugin installed you get
    this smooth behavior by default.) Note `resize: "none"` applies
    app-wide — if the rest of your app relies on webview resizing for its
    own inputs, test those screens too.
  - **Android**: with the default `adjustResize` the window resizes in one
    step when the keyboard opens; the widget snaps to the new size in that
    same frame (the input is never left covered). Per-frame following on
    Android requires the host activity to drive `WindowInsetsAnimation`
    (API 30+) the way our native Android SDK does — most Capacitor apps
    accept the resize-step behavior, which matches typical native
    `adjustResize` apps.

## Building this package

```bash
npm install
npm run build   # tsc → dist/
```
