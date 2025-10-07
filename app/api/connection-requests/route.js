import User from '../../../models/User';
import ConnectionRequest from '../../../models/ConnectionRequest';
import Notification from '../../../models/Notification';
import { withAuth } from '../../../lib/auth-middleware';

// GET /api/connection-requests - Get sent connection requests
async function getSentRequestsHandler(request) {
  try {

    const user = request.user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;

    const sentRequests = await ConnectionRequest.find({
      fromUser: user.userId
    })
    .populate({
      path: 'toUser',
      select: 'firstName lastName companyName role city state country profilePicture'
    })
    .sort({ sentAt: -1 })
    .skip((page - 1) * limit)
    .limit(limit);

    const totalCount = await ConnectionRequest.countDocuments({
      fromUser: user.userId
    });

    const formattedRequests = sentRequests.map(request => ({
      requestId: request._id.toString(),
      toUser: {
        userId: request.toUser._id.toString(),
        name: request.toUser.companyName || `${request.toUser.firstName} ${request.toUser.lastName}`,
        role: request.toUser.role,
        location: `${request.toUser.city || ''} ${request.toUser.state || ''} ${request.toUser.country || ''}`.trim(),
        profilePicture: request.toUser.profilePicture || '/images/default-avatar.png'
      },
      status: request.status,
      message: request.message || '',
      sentAt: request.sentAt,
      respondedAt: request.respondedAt
    }));

    return Response.json({
      success: true,
      data: {
        requests: formattedRequests,
        totalCount,
        page,
        limit,
        hasMore: (page * limit) < totalCount
      }
    });

  } catch (error) {
    console.error('Get sent requests error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

// POST /api/connection-requests - Accept or decline a connection request
async function respondToRequestHandler(request) {
  try {

    const user = request.user;
    const body = await request.json();
    const { requestId, action } = body; // action: 'accept' or 'decline'

    if (!requestId || !action) {
      return Response.json({
        success: false,
        message: 'requestId and action are required'
      }, { status: 400 });
    }

    if (!['accept', 'decline'].includes(action)) {
      return Response.json({
        success: false,
        message: 'action must be either "accept" or "decline"'
      }, { status: 400 });
    }

    // Find the connection request
    const connectionRequest = await ConnectionRequest.findById(requestId);
    if (!connectionRequest) {
      return Response.json({
        success: false,
        message: 'Connection request not found'
      }, { status: 404 });
    }

    // Check if the current user is the recipient
    if (connectionRequest.toUser.toString() !== user.userId) {
      return Response.json({
        success: false,
        message: 'Unauthorized to respond to this request'
      }, { status: 403 });
    }

    // Check if request is still pending
    if (connectionRequest.status !== 'pending') {
      return Response.json({
        success: false,
        message: 'Request has already been responded to'
      }, { status: 409 });
    }

    // Update the connection request
    const newStatus = action === 'accept' ? 'accepted' : 'declined';
    connectionRequest.status = newStatus;
    connectionRequest.respondedAt = new Date();
    await connectionRequest.save();

    // If accepted, update both users' connections arrays
    if (action === 'accept') {
      await User.findByIdAndUpdate(
        connectionRequest.fromUser,
        { $addToSet: { connections: connectionRequest.toUser } }
      );
      await User.findByIdAndUpdate(
        connectionRequest.toUser,
        { $addToSet: { connections: connectionRequest.fromUser } }
      );
    }

    // Get user info for notification
    const currentUser = await User.findById(user.userId).select('firstName lastName companyName');
    const currentUserName = currentUser.companyName || `${currentUser.firstName} ${currentUser.lastName}`;

    // Create notification for the sender
    const notification = new Notification({
      userId: connectionRequest.fromUser,
      type: 'connection_response',
      title: `Connection Request ${action === 'accept' ? 'Accepted' : 'Declined'}`,
      body: `${currentUserName} ${action === 'accept' ? 'accepted' : 'declined'} your connection request`,
      data: {
        requestId: connectionRequest._id.toString(),
        toUserId: user.userId,
        toUserName: currentUserName,
        action: action
      },
      icon: action === 'accept' ? '✅' : '❌',
      link: '/connections'
    });

    await notification.save();

    return Response.json({
      success: true,
      message: `Connection request ${action === 'accept' ? 'accepted' : 'declined'} successfully`,
      data: {
        requestId: connectionRequest._id.toString(),
        status: newStatus,
        respondedAt: connectionRequest.respondedAt
      }
    });

  } catch (error) {
    console.error('Respond to request error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export const GET = withAuth(getSentRequestsHandler);
export const POST = withAuth(respondToRequestHandler);
