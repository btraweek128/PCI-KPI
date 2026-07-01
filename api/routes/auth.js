const express = require('express');
const {
  verifyPortalToken,
  isPortalAuthConfigured,
  SESSION_COOKIE,
} = require('../middleware/auth');
const { signAppSession } = require('../services/sessionToken');

const router = express.Router();

const isProduction = process.env.NODE_ENV === 'production';

function sessionCookieOptions() {
  const crossOrigin = isProduction;
  return {
    httpOnly: true,
    secure: isProduction,
    sameSite: crossOrigin ? 'none' : 'lax',
    maxAge: 8 * 60 * 60 * 1000,
    path: '/',
  };
}

router.post('/callback', (req, res) => {
  if (!isPortalAuthConfigured()) {
    return res.status(501).json({ error: 'Portal auth not configured' });
  }

  const { token } = req.body || {};
  if (!token) {
    return res.status(400).json({ error: 'token is required' });
  }

  try {
    const payload = verifyPortalToken(token, { expectedType: 'handoff' });
    const user = {
      oid: payload.sub,
      email: payload.email,
      name: payload.name,
      department: payload.department || null,
    };

    res.cookie(SESSION_COOKIE, JSON.stringify(user), sessionCookieOptions());
    const sessionToken = signAppSession(user);
    res.json({ ok: true, user, sessionToken });
  } catch (err) {
    console.error('Handoff failed:', err.message);
    res.status(401).json({ error: 'Authentication failed' });
  }
});

router.post('/logout', (_req, res) => {
  const crossOrigin = isProduction;
  res.clearCookie(SESSION_COOKIE, {
    path: '/',
    httpOnly: true,
    secure: isProduction,
    sameSite: crossOrigin ? 'none' : 'lax',
  });
  res.json({ ok: true });
});

module.exports = router;
