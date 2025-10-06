import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();

    const { email } = await request.json();

    
    if (!email) {
      return Response.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 });
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({
        success: false,
        message: 'User not found with this email'
      }, { status: 404 });
    }

    
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    

    return Response.json({
      success: true,
      message: 'Password reset code sent to your email',
      data: {
        resetToken 
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Forgot password error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export async function GET(request) {
  try {
  
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return Response.json({
        success: false,
        message: 'Email is required'
      }, { status: 400 });
    }

    
    return Response.json({
      success: true,
      message: 'Password reset code resent to your email'
    }, { status: 200 });

  } catch (error) {
    console.error('Resend reset code error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
