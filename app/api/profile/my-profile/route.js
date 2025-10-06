import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import { withAuth } from '../../../../lib/auth-middleware';

// Get user profile
async function getProfileHandler(request) {
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

    
    const profileData = {
      userId: userProfile._id,
      email: userProfile.email,
      firstName: userProfile.firstName,
      lastName: userProfile.lastName,
      phone: userProfile.phone,
      role: userProfile.role,
      companyName: userProfile.companyName,
      website: userProfile.website,
      linkedinProfile: userProfile.linkedinProfile,
      city: userProfile.city,
      state: userProfile.state,
      country: userProfile.country,
      pinCode: userProfile.pinCode,
      companyType: userProfile.companyType,
      yearOfRegistration: userProfile.yearOfRegistration,
      industry: userProfile.industry,
      briefIntroduction: userProfile.briefIntroduction,
      profileCompleted: userProfile.profileCompleted,
      isVerified: userProfile.isVerified,
      
      
      ...getRoleSpecificFields(userProfile)
    };

    return Response.json({
      success: true,
      data: profileData
    });

  } catch (error) {
    console.error('Get profile error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


async function updateProfileHandler(request) {
  try {
    await connectDB();

    const user = request.user; 
    const updateData = await request.json();

    
    const updatedProfile = await User.findByIdAndUpdate(
      user.userId,
      updateData,
      { new: true, runValidators: true }
    );

    return Response.json({
      success: true,
      message: 'Profile updated successfully',
      data: updatedProfile
    });

  } catch (error) {
    console.error('Update profile error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const GET = withAuth(getProfileHandler);
export const PUT = withAuth(updateProfileHandler);


function getRoleSpecificFields(user) {
  const roleFields = {
    investor: {
      acquisitionCriteria: user.acquisitionCriteria,
      investmentFundSize: user.investmentFundSize,
      investmentType: user.investmentType,
      locationPreferences: user.locationPreferences,
      previousInvestments: user.previousInvestments
    },
    seller: {
      businessDescription: user.businessDescription,
      productsAndServices: user.productsAndServices,
      marketAndSalesInfo: user.marketAndSalesInfo,
      assetsIncluded: user.assetsIncluded,
      companyStructure: user.companyStructure,
      lastFYRevenue: user.lastFYRevenue,
      wasPatPositive: user.wasPatPositive,
      currentFYProjectedRevenue: user.currentFYProjectedRevenue,
      fullTimeEmployees: user.fullTimeEmployees,
      investmentRequired: user.investmentRequired,
      saleType: user.saleType,
      salePercentage: user.salePercentage,
      reasonForSale: user.reasonForSale,
      reasonForInvestment: user.reasonForInvestment
    },
    startup: {
      businessIdea: user.businessIdea,
      problemSolved: user.problemSolved,
      businessModel: user.businessModel,
      investmentRequirement: user.investmentRequirement,
      offerToInvestor: user.offerToInvestor
    },
    consultant: {
      servicesProvided: user.servicesProvided,
      businessesAssisted: user.businessesAssisted
    },
    franchise: {
      franchiseeCount: user.franchiseeCount,
      franchiseDescription: user.franchiseDescription,
      citiesOffered: user.citiesOffered,
      minimumShopSpace: user.minimumShopSpace,
      minimumOpenSpace: user.minimumOpenSpace,
      priorExperienceRequired: user.priorExperienceRequired,
      additionalRequirements: user.additionalRequirements
    },
    impexp: {
      detailedDescription: user.detailedDescription,
      goodsExported: user.goodsExported,
      goodsImported: user.goodsImported,
      goodsForBuyers: user.goodsForBuyers,
      goodsForSuppliers: user.goodsForSuppliers,
      iecNumber: user.iecNumber
    }
  };

  return roleFields[user.role] || {};
}
