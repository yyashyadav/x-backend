import User from '../../../models/User';
import ConnectionRequest from '../../../models/ConnectionRequest';
import ViewLog from '../../../models/ViewLog';
import { withCompletedProfile } from '../../../lib/auth-middleware';

// Get suggestions - requires completed profile
async function getSuggestionsHandler(request) {
  try {

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
  // Based on the network diagram showing business relationship patterns
  const roleMapping = {
    // Sellers & Startups can connect to Investors & Buyers (bidirectional)
    seller: ['investor', 'buyer'],
    startup: ['investor', 'buyer'],
    
    // Investors & Buyers can connect to Sellers & Startups (bidirectional)
    investor: ['startup', 'seller'],
    buyer: ['startup', 'seller'],
    
    // Consultants & Advisors - central hub with specific relationships
    consultant: ['startup', 'seller', 'franchisor', 'impexp'], // Can suggest to all
    advisor: ['startup', 'seller', 'franchisor', 'impexp'], // Can suggest to all
    
    // Franchisors can suggest to Consultants & Advisors (bidirectional yellow arrow)
    franchisor: ['consultant', 'advisor', 'investor', 'buyer'],
    
    // Importers & Exporters can suggest to Consultants & Advisors (bidirectional yellow arrow)
    impexp: ['consultant', 'advisor', 'investor', 'buyer'],
    
    // Default fallback
    default: []
  };
  
  // Handle role variations
  const normalizedRole = userRole.toLowerCase();
  return roleMapping[normalizedRole] || roleMapping.default;
}

// Helper function to add role-specific matching criteria
function addRoleSpecificCriteria(query, currentUser, userRole) {
  const role = userRole.toLowerCase();
  
  // Industry matching for investors and buyers
  if ((role === 'investor' || role === 'buyer') && currentUser.industry) {
    query.industry = currentUser.industry;
  }
  
  // Consultants/Advisors can match across industries but prefer same location
  if (role === 'consultant' || role === 'advisor') {
    // No strict industry filtering for consultants as they work across industries
    // But prefer same location for easier collaboration
  }
  
  // Franchisors looking for consultants with franchise experience
  if (role === 'franchisor') {
    // Could add franchise-specific criteria here if you have franchise-related fields
  }
  
  // Import/Export companies looking for trade-related connections
  if (role === 'impexp') {
    // Could add trade-specific criteria here if you have trade-related fields
  }

  return query;
}


function calculateMatchScore(currentUser, suggestedUser, userRole) {
  let score = 30; // Base score
  const currentRole = userRole.toLowerCase();
  const suggestedRole = suggestedUser.role.toLowerCase();

  // Industry matching
  if (currentUser.industry === suggestedUser.industry) {
    score += 25;
  }

  // Location matching
  if (currentUser.city === suggestedUser.city) {
    score += 20;
  } else if (currentUser.state === suggestedUser.state) {
    score += 15;
  } else if (currentUser.country === suggestedUser.country) {
    score += 10;
  }

  // Business relationship scoring based on network diagram
  
  // High-priority relationships (yellow arrows in diagram)
  // Franchisors ↔ Consultants & Advisors (bidirectional)
  if ((currentRole === 'franchisor' && (suggestedRole === 'consultant' || suggestedRole === 'advisor')) ||
      ((currentRole === 'consultant' || currentRole === 'advisor') && suggestedRole === 'franchisor')) {
    score += 30;
  }
  
  // Importers & Exporters ↔ Consultants & Advisors (bidirectional)
  if ((currentRole === 'impexp' && (suggestedRole === 'consultant' || suggestedRole === 'advisor')) ||
      ((currentRole === 'consultant' || currentRole === 'advisor') && suggestedRole === 'impexp')) {
    score += 30;
  }

  // Medium-priority relationships (blue arrows in diagram)
  // Sellers & Startups ↔ Investors & Buyers (bidirectional)
  if (((currentRole === 'seller' || currentRole === 'startup') && (suggestedRole === 'investor' || suggestedRole === 'buyer')) ||
      ((currentRole === 'investor' || currentRole === 'buyer') && (suggestedRole === 'startup' || suggestedRole === 'seller'))) {
    score += 25;
  }

  // Sellers & Startups → Consultants & Advisors
  if ((currentRole === 'seller' || currentRole === 'startup') && (suggestedRole === 'consultant' || suggestedRole === 'advisor')) {
    score += 20;
  }

  // Consultants & Advisors → Investors & Buyers
  if ((currentRole === 'consultant' || currentRole === 'advisor') && (suggestedRole === 'investor' || suggestedRole === 'buyer')) {
    score += 20;
  }

  // Franchisors → Investors & Buyers
  if (currentRole === 'franchisor' && (suggestedRole === 'investor' || suggestedRole === 'buyer')) {
    score += 20;
  }

  // Importers & Exporters → Investors & Buyers
  if (currentRole === 'impexp' && (suggestedRole === 'investor' || suggestedRole === 'buyer')) {
    score += 20;
  }

  // Investment-specific scoring
  if (currentRole === 'investor' && suggestedUser.investmentRequired) {
    score += 15;
  }

  // Profile completeness
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
  
  // Business relationship reasons based on network diagram
  const currentRole = userRole.toLowerCase();
  const suggestedRole = suggestedUser.role.toLowerCase();
  
  // Sellers & Startups ↔ Investors & Buyers
  if ((currentRole === 'seller' || currentRole === 'startup') && 
      (suggestedRole === 'investor' || suggestedRole === 'buyer')) {
    reasons.push('Investment/business opportunity');
  }
  
  if ((currentRole === 'investor' || currentRole === 'buyer') && 
      (suggestedRole === 'startup' || suggestedRole === 'seller')) {
    reasons.push('Potential investment target');
  }
  
  // Consultants & Advisors - central hub relationships
  if (suggestedRole === 'consultant' || suggestedRole === 'advisor') {
    reasons.push('Business expertise & guidance');
  }
  
  if (currentRole === 'consultant' || currentRole === 'advisor') {
    if (suggestedRole === 'startup' || suggestedRole === 'seller') {
      reasons.push('Business development opportunity');
    } else if (suggestedRole === 'franchisor') {
      reasons.push('Franchise expansion consulting');
    } else if (suggestedRole === 'impexp') {
      reasons.push('Import/export consulting');
    }
  }
  
  // Franchisors relationships
  if (currentRole === 'franchisor') {
    if (suggestedRole === 'consultant' || suggestedRole === 'advisor') {
      reasons.push('Franchise development consulting');
    } else if (suggestedRole === 'investor' || suggestedRole === 'buyer') {
      reasons.push('Franchise investment opportunity');
    }
  }
  
  // Importers & Exporters relationships
  if (currentRole === 'impexp') {
    if (suggestedRole === 'consultant' || suggestedRole === 'advisor') {
      reasons.push('Trade consulting & advisory');
    } else if (suggestedRole === 'investor' || suggestedRole === 'buyer') {
      reasons.push('International trade opportunity');
    }
  }

  return reasons.length > 0 ? reasons.join(', ') : 'Potential business opportunity';
}


function getRoleSpecificFields(user, userRole) {
  const fields = {};
  const role = user.role.toLowerCase();
  
  // Investor & Buyer fields
  if (role === 'investor') {
    fields.investmentFundSize = user.investmentFundSize;
    fields.investmentFocus = user.investmentFocus || 'General';
  } else if (role === 'buyer') {
    fields.buyingPower = user.buyingPower;
    fields.preferredIndustries = user.preferredIndustries || [];
  }
  
  // Startup & Seller fields
  else if (role === 'startup') {
    fields.investmentRequired = user.investmentRequired;
    fields.fundingStage = user.fundingStage || 'Early Stage';
  } else if (role === 'seller') {
    fields.productCategory = user.productCategory;
    fields.businessStage = user.businessStage || 'Established';
  }
  
  // Consultant & Advisor fields
  else if (role === 'consultant' || role === 'advisor') {
    fields.services = user.servicesProvided;
    fields.expertise = user.expertise || [];
    fields.yearsOfExperience = user.yearsOfExperience;
  }
  
  // Franchisor fields
  else if (role === 'franchisor') {
    fields.franchiseModel = user.franchiseModel;
    fields.totalFranchises = user.totalFranchises;
    fields.franchiseInvestment = user.franchiseInvestment;
  }
  
  // Import/Export fields
  else if (role === 'impexp') {
    fields.goodsType = user.goodsExported?.[0] || user.goodsImported?.[0];
    fields.tradeRegions = user.tradeRegions || [];
    fields.tradeVolume = user.tradeVolume;
  }
  
  return fields;
}


async function postSuggestionsHandler(request) {
  try {

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
