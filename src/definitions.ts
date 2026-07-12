import type { PluginListenerHandle } from '@capacitor/core';

/** Options for {@link HelpBentoPlugin.init}. */
export interface HelpBentoInitOptions {
  /** Your HelpBento company ID (Settings > Widget Embed). */
  companyId: string;
  /** Target a specific support agent (defaults to the company's default agent). */
  agentId?: string;
  /** Show the floating launcher button. Defaults to the server widget config. */
  showLauncher?: boolean;
  /** Launcher corner. Defaults to the server widget config. */
  position?: 'bottom-right' | 'bottom-left';
  /** Enable open/close animations (default true). */
  animations?: boolean;
  /**
   * Where to load widget.js from. Defaults to the production URL
   * (https://app.helpbento.com/widget.js). Override only for local
   * development against the Firebase emulators — the widget derives its API
   * base URL from this script's origin, so it must be an http(s) URL, never
   * a file bundled into the app (a capacitor:// origin breaks API routing).
   */
  scriptUrl?: string;
}

/** Options for {@link HelpBentoPlugin.identify}. */
export interface HelpBentoIdentifyOptions {
  /** Unique identifier for the user. */
  userId: string;
  /** User's email address. */
  email?: string;
  /** User's display name. */
  name?: string;
  /**
   * HMAC-SHA256 signature generated on YOUR server over "<userId>:<email>"
   * (or the userId alone when no email is passed). Required for the user to
   * show as verified on support requests.
   */
  hmac?: string;
}

/** Payload of the 'message' event (an assistant reply completed). */
export interface HelpBentoMessageEvent {
  /** The assistant's reply text (markdown). */
  content: string;
  /** Knowledge-base articles the reply referenced, if any. */
  articleReferences?: unknown[];
}

/** Payload of the 'error' event. */
export interface HelpBentoErrorEvent {
  message: string;
}

export type HelpBentoEventName = 'open' | 'close' | 'message' | 'error';

/**
 * HelpBento chat widget plugin. On every platform the UI is the HelpBento
 * web widget rendered in the app's webview — one source of truth with the
 * JavaScript SDK. identify/open/toggle reject when called before init();
 * close/clearUser/destroy/isOpen are safe no-ops.
 */
export interface HelpBentoPlugin {
  /** Load the widget and initialize it. Must be called before other methods. */
  init(options: HelpBentoInitOptions): Promise<void>;

  /** Identify the logged-in user (see HMAC docs for verified identity). */
  identify(options: HelpBentoIdentifyOptions): Promise<void>;

  /** Clear the identified user (call on logout). */
  clearUser(): Promise<void>;

  /** Open the chat panel. */
  open(): Promise<void>;

  /** Close the chat panel. */
  close(): Promise<void>;

  /** Toggle the chat panel. */
  toggle(): Promise<void>;

  /** Tear down the widget UI and state. init() may be called again after. */
  destroy(): Promise<void>;

  /** Whether the chat panel is currently open. */
  isOpen(): Promise<{ isOpen: boolean }>;

  addListener(
    eventName: 'open' | 'close',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'message',
    listenerFunc: (event: HelpBentoMessageEvent) => void,
  ): Promise<PluginListenerHandle>;
  addListener(
    eventName: 'error',
    listenerFunc: (event: HelpBentoErrorEvent) => void,
  ): Promise<PluginListenerHandle>;

  removeAllListeners(): Promise<void>;
}
