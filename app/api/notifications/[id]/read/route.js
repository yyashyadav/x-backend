import Notification from '../../../../../models/Notification';
import { withAuth } from '../../../../../lib/auth-middleware';

async function markReadHandler(request, { params }) {
  try {
    const user = request.user;
    const { id } = params || {};
    if (!id) return Response.json({ success: false, message: 'Invalid id' }, { status: 400 });

    const res = await Notification.updateOne({ _id: id, userId: user.userId }, { $set: { isRead: true } });
    if ((res.modifiedCount ?? res.nModified) === 0) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export const PUT = withAuth(markReadHandler);


