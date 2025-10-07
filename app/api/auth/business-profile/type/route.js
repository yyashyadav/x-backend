
import User from '../../../../../models/User';
import { withAuth } from '../../../../../lib/auth-middleware';

async function saveBusinessTypeHandler(request) {
  try {

    const user = request.user; 
    const { businessType } = await request.json();

 
    if (!businessType) {
      return Response.json({
        success: false,
        message: 'Business type is required'
      }, { status: 400 });
    }

   
    const validTypes = ['seller', 'startup', 'investor', 'consultant', 'franchise', 'impexp'];
    if (!validTypes.includes(businessType)) {
      return Response.json({
        success: false,
        message: 'Invalid business type'
      }, { status: 400 });
    }

    
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        role: businessType,
        step3Completed: true 
      },
      { new: true }
    );

    return Response.json({
      success: true,
      message: 'Business type selected successfully',
      data: {
        userId: updatedUser._id,
        role: updatedUser.role,
        step: 3,
        nextStep: 'Complete business details'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Business profile type error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


async function getBusinessTypeHandler(request) {
  try {

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
        currentBusinessType: userProfile.role,
        step3Completed: userProfile.step3Completed
      }
    });

  } catch (error) {
    console.error('Get business profile type error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const POST = withAuth(saveBusinessTypeHandler);
export const GET = withAuth(getBusinessTypeHandler);
