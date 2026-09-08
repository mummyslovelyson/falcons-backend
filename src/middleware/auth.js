import jwt from 'jsonwebtoken';

export const ADMIN_COOKIE = 'pf_admin';
export const CHURCH_COOKIE = 'pf_church';
export const USER_COOKIE = 'pf_user';

function cookieOptions() {
  const isCrossSite = process.env.NODE_ENV === 'production' || process.env.COOKIE_SECURE === 'true';
  return {
    httpOnly: true,
    sameSite: isCrossSite ? 'none' : 'lax',
    secure: isCrossSite,
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
}

export function setAdminCookie(res, payload) {
  const token = signToken({ ...payload, role: 'admin' });
  res.cookie(ADMIN_COOKIE, token, cookieOptions());
  return token;
}

export function setChurchCookie(res, payload) {
  const token = signToken({ ...payload, role: 'church' });
  res.cookie(CHURCH_COOKIE, token, cookieOptions());
  return token;
}

export function setUserCookie(res, payload) {
  const token = signToken({ ...payload, role: 'user' });
  res.cookie(USER_COOKIE, token, cookieOptions());
  return token;
}

export function clearAuthCookies(res) {
  const opts = cookieOptions();
  res.clearCookie(ADMIN_COOKIE, opts);
  res.clearCookie(CHURCH_COOKIE, opts);
  res.clearCookie(USER_COOKIE, opts);
}

export function readToken(req, name) {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    const bearerToken = authHeader.slice(7).trim();
    try {
      return jwt.verify(bearerToken, process.env.JWT_SECRET || 'dev-secret');
    } catch {}
  }

  const token = req.cookies?.[name];
  if (!token) return null;
  try {
    return jwt.verify(token, process.env.JWT_SECRET || 'dev-secret');
  } catch {
    return null;
  }
}

export function requireAdmin(req, res, next) {
  const user = readToken(req, ADMIN_COOKIE);
  if (!user || user.role !== 'admin') {
    return res.status(401).json({ message: 'Admin authentication required' });
  }
  req.admin = user;
  next();
}

export function requireChurch(req, res, next) {
  const user = readToken(req, CHURCH_COOKIE);
  if (!user || user.role !== 'church') {
    return res.status(401).json({ message: 'Church authentication required' });
  }
  req.churchAuth = user;
  next();
}

export function requireUser(req, res, next) {
  const user = readToken(req, USER_COOKIE);
  if (!user || user.role !== 'user') {
    return res.status(401).json({ message: 'Member authentication required' });
  }
  req.userAuth = user;
  next();
}

export function optionalAdmin(req, res, next) {
  req.admin = readToken(req, ADMIN_COOKIE);
  next();
}
