const jwt = require('jsonwebtoken');
const { verifyAppSession } = require('../services/sessionToken');

function normalizePem(value) {
  if (!value) return null;
  let pem = String(value).trim();
  if ((pem.startsWith('"') && pem.endsWith('"')) || (pem.startsWith("'") && pem.endsWith("'"))) {
    pem = pem.slice(1, -1).trim();
  }
  pem = pem.replace(/\\n/g, '\n').replace(/\r\n/g, '\n');
  if (!pem.includes('\n') && pem.includes('-----BEGIN')) {
    pem = pem
      .replace(/-----BEGIN ([^-]+)----- ?/, '-----BEGIN $1-----\n')
      .replace(/ ?-----END ([^-]+)-----/, '\n-----END $1-----');
  }
  return pem.trim();
}

const PORTAL_ISSUER = process.env.PORTAL_ISSUER;
const PUBLIC_KEY = normalizePem(process.env.PORTAL_JWT_PUBLIC_KEY_PEM);
const APP_AUDIENCE = process.env.PORTAL_APP_ID || 'kpi';
const SESSION_COOKIE = 'pci_app_session';

function isDevBypassEnabled() {
  return process.env.DEV_BYPASS_AUTH !== 'false';
}

function isPortalAuthConfigured() {
  return Boolean(PORTAL_ISSUER && PUBLIC_KEY);
}

function applyPortalUser(req, payload) {
  req.user = {
    oid: payload.sub,
    email: payload.email,
    name: payload.name,
    department: payload.department || null,
  };
}

function applyDevUser(req) {
  req.user = {
    oid: 'dev-user',
    email: process.env.DEV_USER_EMAIL || 'dev@pcigases.com',
    name: process.env.DEV_USER_NAME || 'Dev User',
    department: process.env.DEV_USER_DEPARTMENT || 'Operations',
  };
}

function readSessionCookie(req) {
  const raw = req.cookies?.[SESSION_COOKIE];
  if (!raw) return null;
  try {
    const session = JSON.parse(raw);
    if (!session?.email) return null;
    return {
      oid: session.oid,
      email: session.email,
      name: session.name,
      department: session.department || null,
    };
  } catch {
    return null;
  }
}

function verifyPortalToken(token, { expectedType } = {}) {
  const payload = jwt.verify(token, PUBLIC_KEY, {
    algorithms: ['RS256'],
    issuer: PORTAL_ISSUER,
    audience: expectedType === 'handoff' ? APP_AUDIENCE : undefined,
  });

  if (expectedType && payload.typ !== expectedType) {
    throw new Error(`Invalid token type: expected ${expectedType}`);
  }

  if (payload.typ === 'handoff' && payload.aud !== APP_AUDIENCE) {
    throw new Error('Invalid token audience');
  }

  if (!['access', 'handoff'].includes(payload.typ)) {
    throw new Error('Invalid token type');
  }

  return payload;
}

async function requireAuth(req, res, next) {
  if (isDevBypassEnabled()) {
    const header = req.headers.authorization || '';
    const [scheme, token] = header.split(' ');
    if (scheme === 'Bearer' && token === (process.env.DEV_AUTH_TOKEN || 'local-dev-token')) {
      applyDevUser(req);
      return next();
    }
  }

  const sessionUser = readSessionCookie(req);
  if (sessionUser) {
    req.user = sessionUser;
    return next();
  }

  const header = req.headers.authorization || '';
  const [scheme, token] = header.split(' ');
  if (scheme === 'Bearer' && token) {
    try {
      const sessionUserFromToken = verifyAppSession(token);
      req.user = sessionUserFromToken;
      return next();
    } catch {
      // fall through to portal token check
    }
  }

  if (scheme === 'Bearer' && token && isPortalAuthConfigured()) {
    try {
      const payload = verifyPortalToken(token);
      applyPortalUser(req, payload);
      return next();
    } catch {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  if (!isPortalAuthConfigured() && !isDevBypassEnabled()) {
    return res.status(501).json({
      error: 'Auth not configured',
      message: 'Set portal JWT env vars or enable DEV_BYPASS_AUTH for local dev.',
    });
  }

  return res.status(401).json({ error: 'Authorization required' });
}

module.exports = {
  requireAuth,
  isDevBypassEnabled,
  isPortalAuthConfigured,
  verifyPortalToken,
  applyPortalUser,
  SESSION_COOKIE,
  normalizePem,
};
