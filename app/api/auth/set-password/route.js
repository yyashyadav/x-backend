import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();

    const { token, password, confirmPassword } = await request.json();

    
    if (!token || !password || !confirmPassword) {
      return Response.json({
        success: false,
        message: 'Token, password and confirm password are required'
      }, { status: 400 });
    }

    
    if (password !== confirmPassword) {
      return Response.json({
        success: false,
        message: 'Passwords do not match'
      }, { status: 400 });
    }

    
    if (password.length < 8) {
      return Response.json({
        success: false,
        message: 'Password must be at least 8 characters long'
      }, { status: 400 });
    }

    
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch (error) {
      return Response.json({
        success: false,
        message: 'Invalid or expired reset token'
      }, { status: 400 });
    }

    
    const user = await User.findById(decoded.userId);
    if (!user) {
      return Response.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    
    user.password = password;
    await user.save();

    return Response.json({
      success: true,
      message: 'Password updated successfully'
    }, { status: 200 });

  } catch (error) {
    console.error('Set password error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
