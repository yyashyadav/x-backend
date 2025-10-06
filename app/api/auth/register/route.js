import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { generateAccessToken, generateRefreshToken, setTokenCookies } from '../../../../lib/auth';

export async function POST(request) {
  try {
    await connectDB();

    const { email, password, firstName, lastName, phone } = await request.json();

    
    if (!email || !password || !firstName || !lastName || !phone) {
      return Response.json({
        success: false,
        message: 'All fields are required'
      }, { status: 400 });
    }

    
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return Response.json({
        success: false,
        message: 'User already exists with this email'
      }, { status: 409 });
    }

    
    const user = new User({
      email,
      password,
      firstName,
      lastName,
      phone,
      role: 'pending' // Will be set in business profile step
    });

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
      message: 'User registered successfully',
      data: {
        userId: user._id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role,
        isVerified: user.isVerified,
        profileCompleted: user.profileCompleted
      }
    }, { status: 201 });

    
    setTokenCookies(response, accessToken, refreshToken);

    return response;

  } catch (error) {
    console.error('Registration error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}