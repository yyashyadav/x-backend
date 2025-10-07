
import User from '../../../../../models/User';
import { withAuth } from '../../../../../lib/auth-middleware';


async function saveBusinessDetailsStep2Handler(request) {
  try {

    const user = request.user; 
    const { businessDescription } = await request.json();

    
    if (!businessDescription) {
      return Response.json({
        success: false,
        message: 'Business description is required'
      }, { status: 400 });
    }

   
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        businessDescription,
        step2Completed: true 
      },
      { new: true }
    );

    return Response.json({
      success: true,
      message: 'Business details step 2 completed successfully',
      data: {
        userId: updatedUser._id,
        step: 2,
        nextStep: 'Select business type'
      }
    }, { status: 200 });

  } catch (error) {
    console.error('Business details step 2 error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


async function getBusinessDetailsStep2Handler(request) {
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
        businessDescription: userProfile.businessDescription,
        step2Completed: userProfile.step2Completed
      }
    });

  } catch (error) {
    console.error('Get business details step 2 error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const POST = withAuth(saveBusinessDetailsStep2Handler);
export const GET = withAuth(getBusinessDetailsStep2Handler);
