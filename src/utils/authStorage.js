const STORAGE_KEY = 'abdays.auth.session';

const safeStorage = () => {
  if (typeof window === 'undefined') {
    return null;
  }

  return {
    local: window.localStorage,
    session: window.sessionStorage,
  };
};

export const getStoredSession = () => {
  const storage = safeStorage();

  if (!storage) {
    return null;
  }

  const raw =
    storage.local.getItem(STORAGE_KEY) ?? storage.session.getItem(STORAGE_KEY);

  if (!raw) {
    return null;
  }

  try {
    return JSON.parse(raw);
  } catch {
    return null;
  }
};

export const setStoredSession = (session, rememberMe) => {
  const storage = safeStorage();

  if (!storage) {
    return;
  }

  const target = rememberMe ? storage.local : storage.session;
  const other = rememberMe ? storage.session : storage.local;
  other.removeItem(STORAGE_KEY);
  target.setItem(STORAGE_KEY, JSON.stringify(session));
};

export const clearStoredSession = () => {
  const storage = safeStorage();

  if (!storage) {
    return;
  }

  storage.local.removeItem(STORAGE_KEY);
  storage.session.removeItem(STORAGE_KEY);
};

export const getAccessToken = () => getStoredSession()?.accessToken ?? null;
