const jwt = require('jsonwebtoken');

const generateTokens = (payload) => {
  const accessToken = jwt.sign(payload, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    issuer: 'taskflow-api',
    audience: 'taskflow-client',
  });

  const refreshToken = jwt.sign(payload, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
    issuer: 'taskflow-api',
    audience: 'taskflow-client',
  });

  return { accessToken, refreshToken, expiresIn: process.env.JWT_EXPIRES_IN || '7d' };
};

const verifyToken = (token, secret = process.env.JWT_SECRET) => {
  return jwt.verify(token, secret, {
    issuer: 'taskflow-api',
    audience: 'taskflow-client',
  });
};

const decodeToken = (token) => jwt.decode(token);

module.exports = { generateTokens, verifyToken, decodeToken };
