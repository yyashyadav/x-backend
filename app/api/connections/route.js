import connectDB from '../../../lib/mongodb';
import User from '../../../models/User';
import ConnectionRequest from '../../../models/ConnectionRequest';
import Notification from '../../../models/Notification';
import { withAuth } from '../../../lib/auth-middleware';


async function getConnectionsHandler(request) {
  try {
    await connectDB();

    const user = request.user; 
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page')) || 1;
    const limit = parseInt(searchParams.get('limit')) || 20;
    const search = searchParams.get('search');

    
    const connections = await getUserConnections(user.userId, page, limit, search);

    return Response.json({
      success: true,
      data: {
        connections: connections.data,
        totalCount: connections.total,
        page,
        limit,
        hasMore: connections.hasMore
      }
    });

  } catch (error) {
    console.error('Connections error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}

async function sendConnectionRequestHandler(request) {
  try {
    await connectDB();

    const user = request.user;
    const body = await request.json();
    const { toUserId, message } = body;

    // Validation
    if (!toUserId) {
      return Response.json({
        success: false,
        message: 'toUserId is required'
      }, { status: 400 });
    }

    if (toUserId === user.userId) {
      return Response.json({
        success: false,
        message: 'Cannot send connection request to yourself'
      }, { status: 400 });
    }

    // Check if target user exists
    const targetUser = await User.findById(toUserId);
    if (!targetUser) {
      return Response.json({
        success: false,
        message: 'User not found'
      }, { status: 404 });
    }

    // Check if profile is completed
    if (!targetUser.profileCompleted) {
      return Response.json({
        success: false,
        message: 'Cannot send request to user with incomplete profile'
      }, { status: 400 });
    }

    // Check for existing connection request
    const existingRequest = await ConnectionRequest.findOne({
      $or: [
        { fromUser: user.userId, toUser: toUserId },
        { fromUser: toUserId, toUser: user.userId }
      ]
    });

    if (existingRequest) {
      const status = existingRequest.status;
      if (status === 'pending') {
        return Response.json({
          success: false,
          message: 'Connection request already exists'
        }, { status: 409 });
      } else if (status === 'accepted') {
        return Response.json({
          success: false,
          message: 'Already connected with this user'
        }, { status: 409 });
      }
    }

    // Create connection request
    const connectionRequest = new ConnectionRequest({
      fromUser: user.userId,
      toUser: toUserId,
      message: message || '',
      status: 'pending'
    });

    await connectionRequest.save();

    // Get sender info for notification
    const sender = await User.findById(user.userId).select('firstName lastName companyName');
    const senderName = sender.companyName || `${sender.firstName} ${sender.lastName}`;

    // Create notification for the target user
    const notification = new Notification({
      userId: toUserId,
      type: 'connection_request',
      title: 'New Connection Request',
      body: `${senderName} sent you a connection request`,
      data: {
        requestId: connectionRequest._id.toString(),
        fromUserId: user.userId,
        fromUserName: senderName
      },
      icon: '👥',
      link: '/connections/requests'
    });

    await notification.save();

    return Response.json({
      success: true,
      message: 'Connection request sent successfully',
      data: {
        requestId: connectionRequest._id.toString()
      }
    }, { status: 201 });

  } catch (error) {
    console.error('Send connection request error:', error);
    
    // Handle duplicate key error
    if (error.code === 11000) {
      return Response.json({
        success: false,
        message: 'Connection request already exists'
      }, { status: 409 });
    }

    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const GET = withAuth(getConnectionsHandler);
export const POST = withAuth(sendConnectionRequestHandler);


async function getUserConnections(userId, page, limit, search) {
  try {
 
    const acceptedConnections = await ConnectionRequest.find({
      $or: [
        { fromUser: userId, status: 'accepted' },
        { toUser: userId, status: 'accepted' }
      ]
    })
    .populate({
      path: 'fromUser',
      select: 'firstName lastName companyName role city state country profilePicture connections'
    })
    .populate({
      path: 'toUser',
      select: 'firstName lastName companyName role city state country profilePicture connections'
    })
    .sort({ respondedAt: -1 }); 

    
    const connections = [];
    for (const connection of acceptedConnections) {
      
      const connectedUser = connection.fromUser._id.toString() === userId 
        ? connection.toUser 
        : connection.fromUser;

      if (connectedUser) {
        connections.push({
          connectionId: connection._id.toString(),
          userId: connectedUser._id.toString(),
          name: connectedUser.companyName || `${connectedUser.firstName} ${connectedUser.lastName}`,
          role: connectedUser.role,
          location: `${connectedUser.city || ''} ${connectedUser.state || ''} ${connectedUser.country || ''}`.trim(),
          profilePicture: connectedUser.profilePicture || '/images/default-avatar.png',
          connectionsCount: connectedUser.connections ? connectedUser.connections.length : 0,
          connectedAt: connection.respondedAt || connection.createdAt,
          lastActivity: connection.respondedAt || connection.createdAt
        });
      }
    }

    
    let filteredConnections = connections;
    if (search) {
      const searchLower = search.toLowerCase();
      filteredConnections = connections.filter(conn => 
        conn.name.toLowerCase().includes(searchLower) ||
        conn.role.toLowerCase().includes(searchLower) ||
        conn.location.toLowerCase().includes(searchLower)
      );
    }

    
    const startIndex = (page - 1) * limit;
    const endIndex = startIndex + limit;
    const paginatedConnections = filteredConnections.slice(startIndex, endIndex);

    return {
      data: paginatedConnections,
      total: filteredConnections.length,
      hasMore: endIndex < filteredConnections.length
    };
  } catch (error) {
    console.error('Error fetching user connections:', error);
    return {
      data: [],
      total: 0,
      hasMore: false
    };
  }
}
