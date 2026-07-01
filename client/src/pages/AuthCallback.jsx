import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { apiFetch } from '../api/client';
import { portalLoginUrl } from '../auth/portal';
import { setSessionToken, getSessionToken } from '../auth/tokenStorage';
import './AuthCallback.css';

export default function AuthCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [error, setError] = useState(null);

  useEffect(() => {
    const token = searchParams.get('token');
    if (!token) {
      setError('Missing sign-in token. Launch this app from the PCI Intranet Hub.');
      return;
    }

    async function redeem() {
      try {
        const result = await apiFetch('/api/auth/callback', {
          method: 'POST',
          body: { token },
        });
        if (!result.sessionToken) {
          throw new Error('Sign-in incomplete. The KPI API may need to be redeployed.');
        }
        setSessionToken(result.sessionToken);
        if (!getSessionToken()) {
          throw new Error('Could not save session on this device.');
        }
        await apiFetch('/api/me');
        navigate('/', { replace: true });
      } catch (err) {
        setError(err.message || 'Authentication failed');
      }
    }

    redeem();
  }, [searchParams, navigate]);

  if (error) {
    return (
      <div className="auth-callback">
        <h2>Sign-in failed</h2>
        <p>{error}</p>
        <p>
          <a href={portalLoginUrl()}>Return to Intranet Hub</a>
        </p>
      </div>
    );
  }

  return (
    <div className="auth-callback">
      <p>Signing you in…</p>
    </div>
  );
}
