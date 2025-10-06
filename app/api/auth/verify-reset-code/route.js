import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import jwt from 'jsonwebtoken';

export async function POST(request) {
  try {
    await connectDB();

    const { email, code } = await request.json();

    
    if (!email || !code) {
      return Response.json({
        success: false,
        message: 'Email and verification code are required'
      }, { status: 400 });
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    

    if (code.length !== 8) {
      return Response.json({
        success: false,
        message: 'Invalid verification code'
      }, { status: 400 });
    }

    
    const resetToken = jwt.sign(
      { userId: user._id, type: 'password_reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );

    return Response.json({
      success: true,
      message: 'Code verified successfully',
      data: {
        resetToken
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Verify reset code error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}
