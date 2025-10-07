
import User from '../../../../../models/User';
import { withAuth } from '../../../../../lib/auth-middleware';


async function saveBusinessDetailsStep1Handler(request) {
  try {

    const user = request.user; 
    const { 
      companyName, 
      pinCode, 
      gstOrCin, 
      website, 
      linkedinProfile, 
      city, 
      state, 
      country,
      companyType,
      yearOfRegistration,
      industry,
      briefIntroduction 
    } = await request.json();

    
    if (!companyName || !pinCode || !gstOrCin) {
      return Response.json({
        success: false,
        message: 'Company name, PIN code, and GST/CIN are required'
      }, { status: 400 });
    }

   
    const updatedUser = await User.findByIdAndUpdate(
      user.userId,
      { 
        companyName,
        pinCode,
        gstOrCin,
        website: website || '',
        linkedinProfile: linkedinProfile || '',
        city: city || '',
        state: state || '',
        country: country || '',
        companyType: companyType || '',
        yearOfRegistration: yearOfRegistration || null,
        industry: industry || '',
        briefIntroduction: briefIntroduction || '',
        step1Completed: true 
      },
      { new: true }
    );

    return Response.json({
      success: true,
      message: 'Business details step 1 completed successfully',
      data: {
        userId: updatedUser._id,
        step: 1,
        nextStep: 'Complete business description'
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


async function getBusinessDetailsStep1Handler(request) {
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
        companyName: userProfile.companyName,
        pinCode: userProfile.pinCode,
        gstOrCin: userProfile.gstOrCin,
        website: userProfile.website,
        linkedinProfile: userProfile.linkedinProfile,
        city: userProfile.city,
        state: userProfile.state,
        country: userProfile.country,
        companyType: userProfile.companyType,
        yearOfRegistration: userProfile.yearOfRegistration,
        industry: userProfile.industry,
        briefIntroduction: userProfile.briefIntroduction,
        step1Completed: userProfile.step1Completed
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


export const POST = withAuth(saveBusinessDetailsStep1Handler);
export const GET = withAuth(getBusinessDetailsStep1Handler);