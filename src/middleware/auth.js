import jwt from 'jsonwebtoken';

export const ADMIN_COOKIE = 'pf_admin';
export const CHURCH_COOKIE = 'pf_church';
export const USER_COOKIE = 'pf_user';

function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  };
}

export function signToken(payload) {
  return jwt.sign(payload, process.env.JWT_SECRET || 'dev-secret', { expiresIn: '7d' });
}

export function setAdminCookie(res, payload) {
  res.cookie(ADMIN_COOKIE, signToken({ ...payload, role: 'admin' }), cookieOptions());
}

export function setChurchCookie(res, payload) {
  res.cookie(CHURCH_COOKIE, signToken({ ...payload, role: 'church' }), cookieOptions());
}

export function setUserCookie(res, payload) {
  res.cookie(USER_COOKIE, signToken({ ...payload, role: 'user' }), cookieOptions());
}

export function clearAuthCookies(res) {
  res.clearCookie(ADMIN_COOKIE, { path: '/' });
  res.clearCookie(CHURCH_COOKIE, { path: '/' });
  res.clearCookie(USER_COOKIE, { path: '/' });
}

export function readToken(req, name) {
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
