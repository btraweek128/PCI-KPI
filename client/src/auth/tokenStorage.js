const STORAGE_KEY = 'pci_kpi_session_token';

let memoryToken = null;

export function getSessionToken() {
  if (memoryToken) return memoryToken;
  try {
    return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY);
  } catch {
    return memoryToken;
  }
}

export function setSessionToken(token) {
  memoryToken = token || null;
  try {
    if (token) {
      sessionStorage.setItem(STORAGE_KEY, token);
      localStorage.setItem(STORAGE_KEY, token);
    } else {
      sessionStorage.removeItem(STORAGE_KEY);
      localStorage.removeItem(STORAGE_KEY);
    }
  } catch {
    // keep in-memory token
  }
}

export function clearSessionToken() {
  setSessionToken(null);
}
