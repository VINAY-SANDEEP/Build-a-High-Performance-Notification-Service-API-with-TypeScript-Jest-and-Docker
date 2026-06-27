export enum NotificationType {
  EMAIL = 'email',
  SMS = 'sms',
}

export interface INotificationPayload {
  recipient: string;
  type: NotificationType;
  subject?: string;
  body: string;
}

export interface INotification extends INotificationPayload {
  id: string;
  status: 'pending' | 'sent' | 'failed';
  createdAt: Date;
}
