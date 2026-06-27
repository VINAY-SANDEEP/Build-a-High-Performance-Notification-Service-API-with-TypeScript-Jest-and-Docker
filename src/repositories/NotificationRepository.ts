import { NotificationModel, NotificationDocument } from '../models/Notification';
import { INotification } from '../models/types';

export class NotificationRepository {
  private mapToEntity(doc: NotificationDocument): INotification {
    return {
      id: doc._id.toString(),
      recipient: doc.recipient,
      type: doc.type,
      subject: doc.subject,
      body: doc.body,
      status: doc.status,
      createdAt: doc.createdAt,
    };
  }

  async create(payload: Partial<INotification>): Promise<INotification> {
    const doc = new NotificationModel(payload);
    await doc.save();
    return this.mapToEntity(doc);
  }

  async findPaginated(page: number, limit: number): Promise<{ data: INotification[]; total: number }> {
    const skip = (page - 1) * limit;
    const [docs, total] = await Promise.all([
      NotificationModel.find().sort({ createdAt: -1 }).skip(skip).limit(limit).exec(),
      NotificationModel.countDocuments().exec(),
    ]);

    return {
      data: docs.map((doc) => this.mapToEntity(doc)),
      total,
    };
  }
}
