import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { withAuth } from '../../../../lib/auth-middleware';


async function saveBusinessDetailsHandler(request) {
  try {
    await connectDB();

    const user = request.user; 
    const { briefIntroduction, businessDescription } = await request.json();

    
    if (!briefIntroduction || !businessDescription) {
      return Response.json({
        success: false,
        message: 'Brief introduction and business description are required'
      }, { status: 400 });
    }

   
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        briefIntroduction,
        businessDescription,
        step2Completed: true 
      },
      { new: true }
    );

    return Response.json({
      success: true,
      message: 'Business details step 1 completed successfully',
      data: {
        userId: updatedUser._id,
        step: 2,
        nextStep: 'Complete detailed business information'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Business details step 1 error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


async function getBusinessDetailsHandler(request) {
  try {
    await connectDB();

    const user = request.user; 

    
    const userProfile = await User.findById(user.userId);
    
    if (!userProfile) {
      return Response.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    return Response.json({
      success: true,
      data: {
        briefIntroduction: userProfile.briefIntroduction,
        businessDescription: userProfile.businessDescription,
        step2Completed: userProfile.step2Completed
      }
    });

  } catch (error) {
    console.error('Get business details step 1 error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const POST = withAuth(saveBusinessDetailsHandler);
export const GET = withAuth(getBusinessDetailsHandler);
