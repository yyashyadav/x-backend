import connectDB from '../../lib/mongodb';
import User from '../../models/User';
import ConnectionRequest from '../../models/ConnectionRequest';
import ViewLog from '../../models/ViewLog';
import { withCompletedProfile } from '../../lib/auth-middleware';

// Get suggestions - requires completed profile
async function getSuggestionsHandler(request) {
  try {
    await connectDB();

    const user = request.user; 
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 10;
    const type = searchParams.get('type'); 
    const suggestions = await getRoleBasedSuggestions(user.userId, user.role, limit, type);

    return Response.json({
      success: true,
      data: {
        suggestions,
        totalCount: suggestions.length,
        userRole: user.role
      }
    });

  } catch (error) {
    console.error('Suggestions error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const GET = withCompletedProfile(getSuggestionsHandler);


async function getRoleBasedSuggestions(userId, userRole, limit = 10, filterType = null) {
  try {
    
    const currentUser = await User.findById(userId);
    if (!currentUser) return [];

   
    const existingConnections = await ConnectionRequest.find({
      $or: [
        { fromUser: userId },
        { toUser: userId }
      ]
    }).select('fromUser toUser');

    const connectedUserIds = existingConnections.map(conn => 
      conn.fromUser.toString() === userId ? conn.toUser.toString() : conn.fromUser.toString()
    );

    
    connectedUserIds.push(userId);

    // Define target roles based on current user's role
    const targetRoles = getTargetRoles(userRole);
    
    
    const rolesToQuery = filterType ? [filterType] : targetRoles;

    
    let query = {
      _id: { $nin: connectedUserIds },
      role: { $in: rolesToQuery },
      isActive: true,
      profileCompleted: true
    };

    
    query = addRoleSpecificCriteria(query, currentUser, userRole);


    const suggestedUsers = await User.find(query)
      .select('firstName lastName companyName role city state country profilePicture website briefIntroduction industry investmentRequired investmentFundSize servicesProvided goodsExported goodsImported')
      .limit(limit * 3); 
    // Calculate match scores and format suggestions
    const suggestions = suggestedUsers.map(user => {
      const matchScore = calculateMatchScore(currentUser, user, userRole);
      
      return {
        id: user._id.toString(),
        type: user.role,
        name: user.companyName || `${user.firstName} ${user.lastName}`,
        industry: user.industry,
        location: `${user.city || ''} ${user.state || ''} ${user.country || ''}`.trim(),
        reason: getMatchReason(currentUser, user, userRole),
        matchScore,
        profilePicture: user.profilePicture || '/images/default-avatar.png',
        briefIntroduction: user.briefIntroduction || '',
        website: user.website || '',
        ...getRoleSpecificFields(user, userRole)
      };
    });

    
    suggestions.sort((a, b) => b.matchScore - a.matchScore);
    return suggestions.slice(0, limit);

  } catch (error) {
    console.error('Error getting suggestions:', error);
    return [];
  }
}


function getTargetRoles(userRole) {
  const roleMapping = {
    investor: ['startup', 'seller'],
    seller: ['investor', 'consultant'],
    startup: ['investor', 'consultant'],
    consultant: ['startup', 'seller'],
    franchise: ['investor', 'consultant'],
    impexp: ['impexp', 'investor', 'consultant']
  };
  return roleMapping[userRole] || [];
}

// Helper function to add role-specific matching criteria
function addRoleSpecificCriteria(query, currentUser, userRole) {
  // Add industry matching for investors
  if (userRole === 'investor' && currentUser.industry) {
    query.industry = currentUser.industry;
  }
  

  return query;
}


function calculateMatchScore(currentUser, suggestedUser, userRole) {
  let score = 50; // Base score

 
  if (currentUser.industry === suggestedUser.industry) {
    score += 20;
  }


  if (currentUser.city === suggestedUser.city) {
    score += 15;
  } else if (currentUser.state === suggestedUser.state) {
    score += 10;
  } else if (currentUser.country === suggestedUser.country) {
    score += 5;
  }

  
  if (userRole === 'investor' && suggestedUser.investmentRequired) {
  
    score += 10;
  }

  
  if (suggestedUser.briefIntroduction) score += 5;
  if (suggestedUser.website) score += 5;

  return Math.min(score, 100); 
}


function getMatchReason(currentUser, suggestedUser, userRole) {
  const reasons = [];
  
  if (currentUser.industry === suggestedUser.industry) {
    reasons.push('Same industry');
  }
  
  if (currentUser.city === suggestedUser.city) {
    reasons.push('Same location');
  }
  
  // Role-specific reasons
  if (userRole === 'investor' && suggestedUser.role === 'startup') {
    reasons.push('Looking for investment');
  } else if (userRole === 'startup' && suggestedUser.role === 'investor') {
    reasons.push('Active investor');
  } else if (suggestedUser.role === 'consultant') {
    reasons.push('Business expertise');
  }

  return reasons.length > 0 ? reasons.join(', ') : 'Potential business opportunity';
}


function getRoleSpecificFields(user, userRole) {
  const fields = {};
  
  if (user.role === 'investor') {
    fields.investmentFundSize = user.investmentFundSize;
  } else if (user.role === 'startup') {
    fields.investmentRequired = user.investmentRequired;
  } else if (user.role === 'consultant') {
    fields.services = user.servicesProvided;
  } else if (user.role === 'impexp') {
    fields.goodsType = user.goodsExported?.[0] || user.goodsImported?.[0];
  }
  
  return fields;
}


async function postSuggestionsHandler(request) {
  try {
    await connectDB();

    const user = request.user; 
    const body = await request.json();
    const { suggestionId, feedback, action } = body; 

    if (!suggestionId || !feedback || !action) {
      return Response.json({
        success: false,
        message: 'Missing required fields: suggestionId, feedback, action'
      }, { status: 400 });
    }

    
    console.log(`User ${user.userId} provided feedback on suggestion ${suggestionId}:`, {
      feedback,
      action,
      timestamp: new Date()
    });

    return Response.json({
      success: true,
      message: 'Feedback recorded successfully',
      data: {
        suggestionId,
        feedback,
        action,
        timestamp: new Date()
      }
    });

  } catch (error) {
    console.error('Suggestion feedback error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const POST = withCompletedProfile(postSuggestionsHandler);
