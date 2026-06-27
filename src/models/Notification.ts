import { Schema, model, Document } from 'mongoose';
import { INotification, NotificationType } from './types';

export interface NotificationDocument extends Omit<INotification, 'id'>, Document {
  createdAt: Date;
  updatedAt: Date;
}

const NotificationSchema = new Schema<NotificationDocument>({
  recipient: { type: String, required: true },
  type: { type: String, enum: Object.values(NotificationType), required: true },
  subject: { type: String },
  body: { type: String, required: true },
  status: { type: String, enum: ['pending', 'sent', 'failed'], default: 'pending' },
}, { 
  timestamps: true,
  toJSON: {
    transform: (doc, ret) => {
      ret.id = ret._id.toString();
      delete (ret as any)._id;
      delete (ret as any).__v;
      return ret;
    }
  }
});

export const NotificationModel = model<NotificationDocument>('Notification', NotificationSchema);
