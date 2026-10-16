import { WebPlugin } from '@capacitor/core';

import type {
  HelpBentoIdentifyOptions,
  HelpBentoInitOptions,
  HelpBentoPlugin,
  HelpBentoSubmitSupportOptions,
  HelpBentoSubmitSupportResult,
} from './definitions';

const DEFAULT_SCRIPT_URL = 'https://app.helpbento.com/widget.js';
const SCRIPT_ID = 'helpbento-widget-script';

/** The window.HelpBento global that widget.js installs. */
interface HelpBentoWidgetGlobal {
  init(config: {
    companyId: string;
    agentId?: string;
    platform?: string;
    showLauncher?: boolean;
    widgetPosition?: string;
    animations?: boolean;
  }): void;
  identify(user: HelpBentoIdentifyOptions): void;
  clearUser(): void;
  open(): void;
  close(): void;
  toggle(): void;
  destroy(): void;
  isOpen(): boolean;
  submitSupport(request: HelpBentoSubmitSupportOptions): Promise<HelpBentoSubmitSupportResult>;
  on(event: string, callback: (payload?: unknown) => void): void;
  off(event: string, callback?: (payload?: unknown) => void): void;
}

declare global {
  interface Window {
    HelpBento?: HelpBentoWidgetGlobal;
  }
}

/**
 * Web implementation of the HelpBento plugin. This is also the runtime on
 * iOS and Android: a Capacitor app is a webview, and the HelpBento web
 * widget renders directly in the app's DOM, so no native code is needed.
 */
export class HelpBentoWeb extends WebPlugin implements HelpBentoPlugin {
  private widgetPromise: Promise<HelpBentoWidgetGlobal> | null = null;
  private initialized = false;

  async init(options: HelpBentoInitOptions): Promise<void> {
    if (!options?.companyId) {
      throw new Error('HelpBento.init: companyId is required');
    }
    const widget = await this.loadWidget(options.scriptUrl ?? DEFAULT_SCRIPT_URL);

    // Re-init tears the previous instance down first — widget.js init() does
    // not guard against double initialization.
    if (this.initialized) {
      widget.destroy();
    }

    widget.init({
      companyId: options.companyId,
      agentId: options.agentId,
      platform: 'capacitor',
      showLauncher: options.showLauncher,
      widgetPosition: options.position,
      animations: options.animations,
    });
    this.initialized = true;

    // Forward widget events to Capacitor listeners. destroy() clears the
    // widget's own listeners, so re-wiring here after every init is correct
    // and never double-subscribes.
    widget.on('open', () => this.notifyListeners('open', {}));
    widget.on('close', () => this.notifyListeners('close', {}));
    widget.on('message', (payload) =>
      this.notifyListeners('message', (payload ?? {}) as Record<string, unknown>),
    );
    widget.on('error', (payload) =>
      this.notifyListeners('error', (payload ?? {}) as Record<string, unknown>),
    );
  }

  async identify(options: HelpBentoIdentifyOptions): Promise<void> {
    (await this.requireWidget()).identify(options);
  }

  async clearUser(): Promise<void> {
    window.HelpBento?.clearUser();
  }

  async open(): Promise<void> {
    (await this.requireWidget()).open();
  }

  async close(): Promise<void> {
    window.HelpBento?.close();
  }

  async toggle(): Promise<void> {
    (await this.requireWidget()).toggle();
  }

  async destroy(): Promise<void> {
    window.HelpBento?.destroy();
    this.initialized = false;
  }

  async isOpen(): Promise<{ isOpen: boolean }> {
    return { isOpen: window.HelpBento?.isOpen() ?? false };
  }

  async submitSupport(
    options: HelpBentoSubmitSupportOptions,
  ): Promise<HelpBentoSubmitSupportResult> {
    return (await this.requireWidget()).submitSupport(options);
  }

  /**
   * Inject widget.js once and resolve the window.HelpBento global. The first
   * init()'s scriptUrl wins for the lifetime of the webview.
   */
  private loadWidget(scriptUrl: string): Promise<HelpBentoWidgetGlobal> {
    if (this.widgetPromise) return this.widgetPromise;

    this.widgetPromise = new Promise<HelpBentoWidgetGlobal>((resolve, reject) => {
      if (window.HelpBento) {
        resolve(window.HelpBento);
        return;
      }
      const existing = document.getElementById(SCRIPT_ID);
      const script = document.createElement('script');
      script.id = SCRIPT_ID;
      script.src = scriptUrl;
      script.async = true;
      script.onload = () => {
        if (window.HelpBento) {
          resolve(window.HelpBento);
        } else {
          reject(new Error('HelpBento widget script loaded but did not install window.HelpBento'));
        }
      };
      script.onerror = () => {
        this.widgetPromise = null;
        script.remove();
        reject(new Error(`Failed to load HelpBento widget from ${scriptUrl}`));
      };
      if (existing) existing.remove();
      document.body.appendChild(script);
    });
    return this.widgetPromise;
  }

  /** Resolve the loaded widget, or fail because init() was never called. */
  private async requireWidget(): Promise<HelpBentoWidgetGlobal> {
    if (!this.widgetPromise) {
      throw new Error('HelpBento: call init() first');
    }
    return this.widgetPromise;
  }
}
