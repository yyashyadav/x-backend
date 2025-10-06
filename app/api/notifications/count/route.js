import Notification from '../../../../models/Notification';
import { withAuth } from '../../../../lib/auth-middleware';

async function getUnreadCountHandler(request) {
  try {
    const user = request.user;
    const count = await Notification.countDocuments({ userId: user.userId, isRead: false });
    return Response.json({ success: true, data: { unread: count } }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export const GET = withAuth(getUnreadCountHandler);


