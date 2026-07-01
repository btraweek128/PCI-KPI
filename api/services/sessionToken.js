const jwt = require('jsonwebtoken');

function getSecret() {
  const secret = process.env.SESSION_JWT_SECRET;
  if (secret) return secret;
  if (process.env.NODE_ENV === 'production') {
    throw new Error('SESSION_JWT_SECRET is required in production');
  }
  return process.env.DEV_AUTH_TOKEN || 'kpi-session-dev-secret';
}

function signAppSession(user) {
  return jwt.sign(
    {
      typ: 'kpi_session',
      oid: user.oid,
      email: user.email,
      name: user.name,
      department: user.department || null,
    },
    getSecret(),
    { expiresIn: '8h' }
  );
}

function verifyAppSession(token) {
  const payload = jwt.verify(token, getSecret());
  if (payload.typ !== 'kpi_session') {
    throw new Error('Invalid session token type');
  }
  return {
    oid: payload.oid,
    email: payload.email,
    name: payload.name,
    department: payload.department || null,
  };
}

module.exports = {
  signAppSession,
  verifyAppSession,
};
