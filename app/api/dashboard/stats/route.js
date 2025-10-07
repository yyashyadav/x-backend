import User from '../../../../models/User';
import ViewLog from '../../../../models/ViewLog';
import ConnectionRequest from '../../../../models/ConnectionRequest';
import { withAuth } from '../../../../lib/auth-middleware';


async function getDashboardStatsHandler(request) {
  try {

    const user = request.user; 

    
    const stats = await getDashboardStats(user.userId, user.role);

    return Response.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const GET = withAuth(getDashboardStatsHandler);


async function getDashboardStats(userId, userRole) {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const last5Days = new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000);
    const lastWeek = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);

    
    const [overallViews, todayViews, last5DaysViews, yesterdayViews] = await Promise.all([
      ViewLog.countDocuments({ viewedUser: userId }),
      ViewLog.countDocuments({ 
        viewedUser: userId, 
        viewedAt: { $gte: today } 
      }),
      ViewLog.countDocuments({ 
        viewedUser: userId, 
        viewedAt: { $gte: last5Days } 
      }),
      ViewLog.countDocuments({ 
        viewedUser: userId, 
        viewedAt: { $gte: yesterday, $lt: today } 
      })
    ]);

    
    const [totalConnections, sentRequests, receivedRequests, pendingRequests] = await Promise.all([
      User.findById(userId).select('connections').then(user => user?.connections?.length || 0),
      ConnectionRequest.countDocuments({ fromUser: userId }),
      ConnectionRequest.countDocuments({ toUser: userId }),
      ConnectionRequest.countDocuments({ toUser: userId, status: 'pending' })
    ]);

    
    const weeklyConnections = await ConnectionRequest.countDocuments({
      fromUser: userId,
      createdAt: { $gte: lastWeek }
    });

    
    const todayChange = todayViews - yesterdayViews;
    const weeklyChange = weeklyConnections;

    const stats = {
      overallViews,
      last5DaysViews,
      searchAppearances: 9,
      todayViews,
      todayChange,
      
     
      suggestionsCount: 8,
      
      
      connections: {
        total: totalConnections,
        weeklyChange,
        trend: weeklyChange > 0 ? 'up' : weeklyChange < 0 ? 'down' : 'stable'
      },
      
      requestsSent: {
        total: sentRequests,
        weeklyNew: weeklyConnections,
        trend: weeklyConnections > 0 ? 'up' : 'stable'
      },
      
      requestsReceived: {
        total: receivedRequests,
        received: receivedRequests - pendingRequests,
        pending: pendingRequests,
        trend: pendingRequests > 0 ? 'up' : 'stable'
      }
    };

    return stats;
  } catch (error) {
    console.error('Error getting dashboard stats:', error);
    
    return {
      overallViews: 0,
      last5DaysViews: 0,
      searchAppearances: 0,
      todayViews: 0,
      todayChange: 0,
      suggestionsCount: 0,
      connections: { total: 0, weeklyChange: 0, trend: 'stable' },
      requestsSent: { total: 0, weeklyNew: 0, trend: 'stable' },
      requestsReceived: { total: 0, received: 0, pending: 0, trend: 'stable' }
    };
  }
}

