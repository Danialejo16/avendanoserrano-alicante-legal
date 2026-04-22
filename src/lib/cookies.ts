// Cookie consent utilities — central source of truth for preferences.
// Other code (analytics loaders, marketing pixels) should subscribe via
// `onConsentChange` and read `getConsent()` to decide whether to run.

export type CookiePreferences = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const STORAGE_KEY = "cookie-consent";
const EVENT_NAME = "cookie-consent-change";

export const DEFAULT_PREFERENCES: CookiePreferences = {
  necessary: true,
  analytics: false,
  marketing: false,
};

export const getConsent = (): CookiePreferences | null => {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<CookiePreferences>;
    return {
      necessary: true,
      analytics: !!parsed.analytics,
      marketing: !!parsed.marketing,
    };
  } catch {
    return null;
  }
};

export const setConsent = (prefs: CookiePreferences) => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(prefs));
  // Apply side-effects: clear non-essential cookies if rejected.
  applyConsent(prefs);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: prefs }));
};

export const clearConsent = () => {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(EVENT_NAME, { detail: null }));
};

export const onConsentChange = (
  cb: (prefs: CookiePreferences | null) => void,
) => {
  const handler = (e: Event) => cb((e as CustomEvent).detail);
  window.addEventListener(EVENT_NAME, handler);
  return () => window.removeEventListener(EVENT_NAME, handler);
};

// Remove cookies the user has declined. Only necessary cookies survive.
// Necessary keys we keep (extend as needed):
const NECESSARY_COOKIE_KEYS = ["cookie-consent"];

const deleteCookie = (name: string) => {
  const host = window.location.hostname;
  const paths = ["/", window.location.pathname];
  const domains = ["", host, `.${host}`];
  paths.forEach((p) => {
    domains.forEach((d) => {
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=${p}${
        d ? `; domain=${d}` : ""
      }`;
    });
  });
};

const applyConsent = (prefs: CookiePreferences) => {
  if (prefs.analytics && prefs.marketing) return;

  // Common analytics / marketing cookie name prefixes.
  const trackedPrefixes = ["_ga", "_gid", "_gat", "_fbp", "_fbc", "_hj", "_uetsid", "_uetvid"];

  document.cookie.split(";").forEach((c) => {
    const name = c.split("=")[0]?.trim();
    if (!name || NECESSARY_COOKIE_KEYS.includes(name)) return;

    const isAnalytics = trackedPrefixes.some((p) => name.startsWith(p));
    if (isAnalytics && (!prefs.analytics || !prefs.marketing)) {
      deleteCookie(name);
    }
  });
};

// Public API to reopen the consent panel from anywhere (e.g. Footer link).
const REOPEN_EVENT = "cookie-consent-reopen";

export const openCookieSettings = () => {
  window.dispatchEvent(new CustomEvent(REOPEN_EVENT));
};

export const onOpenCookieSettings = (cb: () => void) => {
  window.addEventListener(REOPEN_EVENT, cb);
  return () => window.removeEventListener(REOPEN_EVENT, cb);
};
