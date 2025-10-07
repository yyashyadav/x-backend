import User from '../../../../models/User';
import ConnectionRequest from '../../../../models/ConnectionRequest';
import { withAuth } from '../../../../lib/auth-middleware';


async function getPendingRequestsHandler(request) {
  try {

    const user = request.user; 
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit')) || 6;

    
    const pendingRequests = await getPendingRequests(user.userId, limit);

    return Response.json({
      success: true,
      data: {
        requests: pendingRequests,
        totalCount: pendingRequests.length
      }
    });

  } catch (error) {
    console.error('Pending requests error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const GET = withAuth(getPendingRequestsHandler);


async function getPendingRequests(userId, limit) {
  try {
   
    const pendingRequests = await ConnectionRequest.find({
      toUser: userId,
      status: 'pending'
    })
    .populate({
      path: 'fromUser',
      select: 'firstName lastName companyName role city state country profilePicture connections'
    })
    .sort({ sentAt: -1 }) 
    .limit(limit);

    // Transform the data to match the expected format
    const formattedRequests = pendingRequests.map(request => ({
      requestId: request._id.toString(),
      fromUser: {
        userId: request.fromUser._id.toString(),
        name: request.fromUser.companyName || `${request.fromUser.firstName} ${request.fromUser.lastName}`,
        role: request.fromUser.role,
        location: `${request.fromUser.city || ''} ${request.fromUser.state || ''} ${request.fromUser.country || ''}`.trim(),
        profilePicture: request.fromUser.profilePicture || '/images/default-avatar.png',
        connectionsCount: request.fromUser.connections ? request.fromUser.connections.length : 0
      },
      sentAt: request.sentAt,
      message: request.message || ''
    }));

    return formattedRequests;
  } catch (error) {
    console.error('Error fetching pending requests:', error);
    return [];
  }
}
