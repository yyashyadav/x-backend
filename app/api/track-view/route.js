import User from '../../../models/User';
import ViewLog from '../../../models/ViewLog';
import { withAuth } from '../../../lib/auth-middleware';


async function trackViewHandler(request) {
  try {

    const user = request.user; 
    const viewerId = user.userId;
    const body = await request.json();
    const { viewedUserId, source = 'profile' } = body;

    if (!viewedUserId) {
      return Response.json({
        success: false,
        message: 'viewedUserId is required'
      }, { status: 400 });
    }

    
    if (viewerId === viewedUserId) {
      return Response.json({
        success: true,
        message: 'Self-view not tracked'
      });
    }

    
    const viewedUser = await User.findById(viewedUserId);
    if (!viewedUser) {
      return Response.json({
        success: false,
        message: 'Viewed user not found'
      }, { status: 404 });
    }

    
    const existingView = await ViewLog.findOne({
      viewer: viewerId,
      viewedUser: viewedUserId
    });

    if (existingView) {
      existingView.count = (existingView.count || 1) + 1;
      existingView.viewedAt = new Date();
      await existingView.save();
    } else {
      const viewLog = new ViewLog({
        viewer: viewerId,
        viewedUser: viewedUserId,
        source,
        viewedAt: new Date(),
        count: 1
      });
      await viewLog.save();
    }

    return Response.json({
      success: true,
      message: 'View tracked successfully'
    });

  } catch (error) {
    console.error('Track view error:', error);
    return Response.json({
      success: false,
      message: 'Internal server error'
    }, { status: 500 });
  }
}


export const POST = withAuth(trackViewHandler);
