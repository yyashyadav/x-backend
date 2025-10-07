import jwt from 'jsonwebtoken';
import { serialize } from 'cookie';

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;

// Generate access token (15 minutes)
export function generateAccessToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '15m' });
}

// Generate refresh token (30 days)
export function generateRefreshToken(payload) {
  return jwt.sign(payload, JWT_REFRESH_SECRET, { expiresIn: '30d' });
}


export function verifyAccessToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null;
  }
}


export function verifyRefreshToken(token) {
  try {
    return jwt.verify(token, JWT_REFRESH_SECRET);
  } catch (error) {
    return null;
  }
}


export function setTokenCookies(response, accessToken, refreshToken) {
  const accessCookie = serialize('accessToken', accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 15 * 60, 
    path: '/'
  });

  const refreshCookie = serialize('refreshToken', refreshToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 30 * 24 * 60 * 60, 
    path: '/'
  });

  // For Next.js App Router Web API Response objects
  response.headers.set('Set-Cookie', [accessCookie, refreshCookie]);
}

// Clear cookies
export function clearTokenCookies(response) {
  const accessCookie = serialize('accessToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });

  const refreshCookie = serialize('refreshToken', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 0,
    path: '/'
  });

  // For Next.js App Router Web API Response objects
  response.headers.set('Set-Cookie', [accessCookie, refreshCookie]);
}


// For Express.js/Pages Router compatibility
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access token required' });
  }

  const decoded = verifyAccessToken(token);
  if (!decoded) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token' });
  }

  req.user = decoded;
  next();
}

// For Next.js App Router - extract token from request
export function getTokenFromRequest(request) {
  const authHeader = request.headers.get('authorization');
  return authHeader && authHeader.split(' ')[1];
}

// For Next.js App Router - verify token and return decoded payload
export function verifyTokenFromRequest(request) {
  const token = getTokenFromRequest(request);
  if (!token) {
    return null;
  }
  return verifyAccessToken(token);
}

