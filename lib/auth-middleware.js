import connectDB from './mongodb';
import User from '../models/User';
import jwt from 'jsonwebtoken';


export function withAuth(handler) {
  return async (request) => {
    try {
      await connectDB();

      
      const authResult = await authenticateUser(request);
      if (authResult.error) {
        return Response.json({
          success: false,
          message: authResult.error
        }, { status: authResult.status });
      }

      
      request.user = authResult.user;

      
      return await handler(request);

    } catch (error) {
      console.error('Auth middleware error:', error);
      return Response.json({
        success: false,
        message: 'Internal server error'
      }, { status: 500 });
    }
  };
}


async function authenticateUser(request) {
  const authHeader = request.headers.get('authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'No token provided', status: 401 };
  }

  const token = authHeader.substring(7);
  
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.userId).select('-password');
    
    if (!user) {
      return { error: 'User not found', status: 404 };
    }

    if (!user.isActive) {
      return { error: 'User account is deactivated', status: 403 };
    }

    return { 
      user: { 
        userId: decoded.userId, 
        role: user.role,
        email: user.email,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted
      } 
    };
  } catch (error) {
    return { error: 'Invalid or expired token', status: 403 };
  }
}


export function withRoleAuth(roles) {
  return function(handler) {
    return withAuth(async (request) => {
      const userRole = request.user.role;
      
      if (!roles.includes(userRole)) {
        return Response.json({
          success: false,
          message: 'Insufficient permissions'
        }, { status: 403 });
      }

      return await handler(request);
    });
  };
}


export function withVerifiedAuth(handler) {
  return withAuth(async (request) => {
    if (!request.user.isVerified) {
      return Response.json({
        success: false,
        message: 'Email verification required'
      }, { status: 403 });
    }

    return await handler(request);
  });
}


export function withCompletedProfile(handler) {
  return withAuth(async (request) => {
    if (!request.user.profileCompleted) {
      return Response.json({
        success: false,
        message: 'Profile completion required'
      }, { status: 403 });
    }

    return await handler(request);
  });
}
