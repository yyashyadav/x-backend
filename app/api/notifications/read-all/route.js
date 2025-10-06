import Notification from '../../../../models/Notification';
import { withAuth } from '../../../../lib/auth-middleware';

// PUT /api/notifications/read-all  body: { olderThan?, types? }
async function readAllHandler(request) {
  try {
    const user = request.user;
    const body = await request.json().catch(() => ({}));
    const { olderThan, types } = body || {};

    const query = { userId: user.userId, isRead: false };
    if (olderThan) {
      const date = new Date(olderThan);
      if (!isNaN(date.getTime())) query.createdAt = { $lte: date };
    }
    if (Array.isArray(types) && types.length) {
      query.type = { $in: types };
    }

    const res = await Notification.updateMany(query, { $set: { isRead: true } });
    return Response.json({ success: true, data: { matched: res.matchedCount ?? res.n, modified: res.modifiedCount ?? res.nModified } }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = withAuth(readAllHandler);


