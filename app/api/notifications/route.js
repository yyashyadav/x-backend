import Notification from '../../../models/Notification';
import { withAuth } from '../../../lib/auth-middleware';

// POST /api/notifications  (create)
async function createNotificationHandler(request) {
  try {
    const user = request.user;
    const body = await request.json();

    const {
      toUserId,
      type,
      title,
      body: message,
      data,
      icon,
      link,
      dedupeKey,
      source,
      expiresAt
    } = body;

    if (!toUserId || !type || !title || !message) {
      return Response.json({ success: false, message: 'toUserId, type, title, body are required' }, { status: 400 });
    }

    // Note: creator can be system or authenticated user; we do not restrict creator here
    const doc = new Notification({
      userId: toUserId,
      type,
      title,
      body: message,
      data: data || null,
      icon,
      link,
      dedupeKey,
      source,
      expiresAt
    });

    try {
      await doc.save();
    } catch (e) {
      // Handle duplicate on dedupeKey
      if (e?.code === 11000) {
        return Response.json({ success: true, message: 'Duplicate ignored', deduped: true }, { status: 200 });
      }
      throw e;
    }

    return Response.json({ success: true, data: { id: doc._id } }, { status: 201 });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

// GET /api/notifications  (list)
async function listNotificationsHandler(request) {
  try {
    const user = request.user;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const unreadOnly = searchParams.get('unreadOnly') === 'true';

    const query = { userId: user.userId };
    if (unreadOnly) query.isRead = false;

    const [items, total] = await Promise.all([
      Notification.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit),
      Notification.countDocuments(query)
    ]);

    return Response.json({
      success: true,
      data: items,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export const POST = withAuth(createNotificationHandler);
export const GET = withAuth(listNotificationsHandler);

// DELETE /api/notifications (bulk)
async function bulkDeleteHandler(request) {
  try {
    const user = request.user;
    const body = await request.json().catch(() => ({}));
    const { ids, olderThan } = body || {};

    const query = { userId: user.userId };
    if (Array.isArray(ids) && ids.length) {
      query._id = { $in: ids };
    } else if (olderThan) {
      const date = new Date(olderThan);
      if (!isNaN(date.getTime())) query.createdAt = { $lte: date };
    } else {
      return Response.json({ success: false, message: 'Provide ids[] or olderThan' }, { status: 400 });
    }

    const res = await Notification.deleteMany(query);
    return Response.json({ success: true, data: { deleted: res.deletedCount ?? res.n } }, { status: 200 });
  } catch (error) {
    return Response.json({ success: false, message: 'Internal server error' }, { status: 500 });
  }
}

export const DELETE = withAuth(bulkDeleteHandler);


