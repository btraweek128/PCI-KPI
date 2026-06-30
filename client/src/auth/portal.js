const PORTAL_URL = import.meta.env.VITE_PORTAL_URL || 'https://pci-portal.web.app';

export function portalLoginUrl() {
  return `${PORTAL_URL}/login`;
}
