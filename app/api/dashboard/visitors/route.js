import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import ViewLog from '../../../../models/ViewLog';
import { withAuth } from '../../../../lib/auth-middleware';


async function getVisitorsHandler(request) {
  try {
    await connectDB();

    const user = request.user; 
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 5;

    
    const visitors = await getRecentVisitors(user.userId, limit);

    return Response.json({
      success: true,
      data: {
        visitors,
        totalCount: visitors.length
      }
    });

  } catch (error) {
    console.error('Visitors error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const GET = withAuth(getVisitorsHandler);

async function getRecentVisitors(userId, limit) {
  try {
  
    const recentViews = await ViewLog.find({
      viewedUser: userId
    })
    .populate({
      path: 'viewer',
      select: 'firstName lastName companyName role city state country profilePicture'
    })
    .sort({ viewedAt: -1 })
    .limit(limit * 2); 
    
    const uniqueVisitors = [];
    const seenUsers = new Set();

    for (const view of recentViews) {
      if (view.viewer && !seenUsers.has(view.viewer._id.toString())) {
        seenUsers.add(view.viewer._id.toString());
        uniqueVisitors.push({
          userId: view.viewer._id.toString(),
          name: view.viewer.companyName || `${view.viewer.firstName} ${view.viewer.lastName}`,
          role: view.viewer.role,
          location: `${view.viewer.city || ''} ${view.viewer.state || ''} ${view.viewer.country || ''}`.trim(),
          profilePicture: view.viewer.profilePicture || '/images/default-avatar.png',
          visitedAt: view.viewedAt
        });
      }
    }

    return uniqueVisitors.slice(0, limit);
  } catch (error) {
    console.error('Error fetching recent visitors:', error);
    return [];
  }
}
