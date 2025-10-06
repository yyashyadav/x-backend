import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { generateAccessToken, generateRefreshToken, setTokenCookies } from '../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const { email, password } = await request.json();

    
    if (!email || !password) {
      return Response.json({
        success: false,
        message: 'Email and password are required'
      }, { status: 400 });
    }

    
    const user = await User.findOne({ email });
    if (!user) {
      return Response.json({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    
    if (!user.isActive) {
      return Response.json({
        success: false,
        message: 'Account is deactivated'
      }, { status: 401 });
    }

    
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return Response.json({
        success: false,
        message: 'Invalid credentials'
      }, { status: 401 });
    }

    
    user.lastLogin = new Date();
    await user.save();

    
    const accessToken = generateAccessToken({
      userId: user._id,
      email: user.email,
      role: user.role,
      profileCompleted: user.profileCompleted,
      isVerified: user.isVerified
    });

    const refreshToken = generateRefreshToken({
      userId: user._id
    });

    
    const response = Response.json({
      success: true,
      message: 'Login successful',
      data: {
        userId: user._id,
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted
      }
    }, { status: 200 });

    
    setTokenCookies(response, accessToken, refreshToken);

    return response;

  } catch (error) {
    console.error('Login error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}