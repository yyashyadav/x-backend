import Notification from '../../../../models/Notification';
import { withAuth } from '../../../../lib/auth-middleware';

// DELETE /api/notifications/:id
async function deleteOneHandler(request, { params }) {
  try {
    const user = request.user;
    const { id } = params || {};
    if (!id) return Response.json({ success: false, message: 'Invalid id' }, { status: 400 });

    const res = await Notification.deleteOne({ _id: id, userId: user.userId });
    if ((res.deletedCount ?? res.n) === 0) {
      return Response.json({ success: false, message: 'Not found' }, { status: 404 });
    }
    return Response.json({ success: true }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export const DELETE = withAuth(deleteOneHandler);


