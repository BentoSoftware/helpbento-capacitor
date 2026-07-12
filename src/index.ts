import { registerPlugin } from '@capacitor/core';

import type { HelpBentoPlugin } from './definitions';

// The web implementation IS the implementation on every platform: a
// Capacitor app runs in a webview, and the HelpBento web widget renders
// directly in the app's DOM. Registering it for ios/android too means no
// native code is required; native implementations can override these
// entries per-platform later without an API change.
const webImplementation = () => import('./web').then((m) => new m.HelpBentoWeb());

export const HelpBento = registerPlugin<HelpBentoPlugin>('HelpBento', {
  web: webImplementation,
  ios: webImplementation,
  android: webImplementation,
});

export * from './definitions';
