import ConnectionRequest from '../../../../models/ConnectionRequest';
import Notification from '../../../../models/Notification';
import User from '../../../../models/User';
import { withAuth } from '../../../../lib/auth-middleware';

// POST /api/connection-requests/withdraw - Withdraw a sent connection request
async function withdrawRequestHandler(request) {
  try {

    const user = request.user;
    const body = await request.json();
    const { requestId } = body;

    if (!requestId) {
      return Response.json({
        success: false,
        message: 'requestId is required'
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

    // Check if the current user is the sender
    if (connectionRequest.fromUser.toString() !== user.userId) {
      return Response.json({
        success: false,
        message: 'Unauthorized to withdraw this request'
      }, { status: 403 });
    }

    // Check if request is still pending
    if (connectionRequest.status !== 'pending') {
      return Response.json({
        success: false,
        message: 'Cannot withdraw a request that has already been responded to'
      }, { status: 409 });
    }

    // Update the connection request status
    connectionRequest.status = 'withdrawn';
    connectionRequest.respondedAt = new Date();
    await connectionRequest.save();

    // Get user info for notification (optional - notify the recipient that request was withdrawn)
    const currentUser = await User.findById(user.userId).select('firstName lastName companyName');
    const currentUserName = currentUser.companyName || `${currentUser.firstName} ${currentUser.lastName}`;

    // Create notification for the recipient
    const notification = new Notification({
      userId: connectionRequest.toUser,
      type: 'connection_withdraw',
      title: 'Connection Request Withdrawn',
      body: `${currentUserName} withdrew their connection request`,
      data: {
        requestId: connectionRequest._id.toString(),
        fromUserId: user.userId,
        fromUserName: currentUserName
      },
      icon: '↩️',
      link: '/connections/requests'
    });

    await notification.save();

    return Response.json({
      success: true,
      message: 'Connection request withdrawn successfully',
      data: {
        requestId: connectionRequest._id.toString(),
        status: 'withdrawn',
        withdrawnAt: connectionRequest.respondedAt
      }
    });

  } catch (error) {
    console.error('Withdraw request error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

export const POST = withAuth(withdrawRequestHandler);
