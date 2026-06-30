import DevApp from './DevApp';
import PortalApp from './PortalApp';

export default function App() {
  if (import.meta.env.VITE_DEV_AUTH_TOKEN) {
    return <DevApp />;
  }
  return <PortalApp />;
}
