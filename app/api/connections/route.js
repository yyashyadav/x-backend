import connectDB from '../../../../lib/mongodb';
import User from '../../../../models/User';
import ConnectionRequest from '../../../../models/ConnectionRequest';
import { withAuth } from '../../../../lib/auth-middleware';


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


export const GET = withAuth(getConnectionsHandler);


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
