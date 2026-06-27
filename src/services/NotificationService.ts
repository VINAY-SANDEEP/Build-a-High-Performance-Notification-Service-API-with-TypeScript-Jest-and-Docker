import { NotificationRepository } from '../repositories/NotificationRepository';
import { INotification, INotificationPayload, NotificationType } from '../models/types';

export class NotificationService {
  private repository: NotificationRepository;

  constructor(repository: NotificationRepository) {
    this.repository = repository;
  }

  async processNotification(payload: INotificationPayload): Promise<INotification> {
    let status: 'sent' | 'failed' = 'sent';

    try {
      if (payload.type === NotificationType.EMAIL) {
        console.log(`[Simulation] Dispatching email via SES to: ${payload.recipient}`);
        if (payload.recipient.toLowerCase().includes('fail')) {
          throw new Error('Simulated email dispatch failure');
        }
      } else if (payload.type === NotificationType.SMS) {
        console.log(`[Simulation] Dispatching SMS via Twilio to: ${payload.recipient}`);
        if (payload.recipient.toLowerCase().includes('fail')) {
          throw new Error('Simulated SMS dispatch failure');
        }
      } else {
        throw new Error('Invalid notification type');
      }
    } catch (error: any) {
      console.error(`[Simulation Failure] ${error.message}`);
      status = 'failed';
    }

    return this.repository.create({
      ...payload,
      status,
    });
  }

  async getNotifications(page: number, limit: number): Promise<{ data: INotification[]; total: number }> {
    return this.repository.findPaginated(page, limit);
  }
}
