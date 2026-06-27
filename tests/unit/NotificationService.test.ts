import { NotificationService } from '../../src/services/NotificationService';
import { NotificationRepository } from '../../src/repositories/NotificationRepository';
import { NotificationType, INotificationPayload } from '../../src/models/types';

describe('NotificationService Unit Tests', () => {
  let service: NotificationService;
  let mockRepository: jest.Mocked<NotificationRepository>;

  beforeEach(() => {
    mockRepository = {
      create: jest.fn(),
      findPaginated: jest.fn(),
    } as unknown as jest.Mocked<NotificationRepository>;

    service = new NotificationService(mockRepository);
  });

  describe('processNotification', () => {
    it('should successfully dispatch email and save with status sent', async () => {
      const payload: INotificationPayload = {
        recipient: 'test@example.com',
        type: NotificationType.EMAIL,
        subject: 'Welcome',
        body: 'Hello User!',
      };

      const mockSavedEntity = {
        id: '12345',
        ...payload,
        status: 'sent' as const,
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValueOnce(mockSavedEntity);

      const result = await service.processNotification(payload);

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...payload,
        status: 'sent',
      });
      expect(result).toEqual(mockSavedEntity);
    });

    it('should successfully dispatch SMS and save with status sent', async () => {
      const payload: INotificationPayload = {
        recipient: '+1234567890',
        type: NotificationType.SMS,
        body: 'Your code is 1234',
      };

      const mockSavedEntity = {
        id: '12346',
        ...payload,
        status: 'sent' as const,
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValueOnce(mockSavedEntity);

      const result = await service.processNotification(payload);

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...payload,
        status: 'sent',
      });
      expect(result).toEqual(mockSavedEntity);
    });

    it('should fail email dispatch if recipient contains "fail" and save with status failed', async () => {
      const payload: INotificationPayload = {
        recipient: 'failed-user@example.com',
        type: NotificationType.EMAIL,
        subject: 'Alert',
        body: 'This will fail',
      };

      const mockSavedEntity = {
        id: '12347',
        ...payload,
        status: 'failed' as const,
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValueOnce(mockSavedEntity);

      const result = await service.processNotification(payload);

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...payload,
        status: 'failed',
      });
      expect(result).toEqual(mockSavedEntity);
    });

    it('should fail SMS dispatch if recipient contains "fail" and save with status failed', async () => {
      const payload: INotificationPayload = {
        recipient: '+1234fail567',
        type: NotificationType.SMS,
        body: 'Simulated failure SMS',
      };

      const mockSavedEntity = {
        id: '12348',
        ...payload,
        status: 'failed' as const,
        createdAt: new Date(),
      };

      mockRepository.create.mockResolvedValueOnce(mockSavedEntity);

      const result = await service.processNotification(payload);

      expect(mockRepository.create).toHaveBeenCalledTimes(1);
      expect(mockRepository.create).toHaveBeenCalledWith({
        ...payload,
        status: 'failed',
      });
      expect(result).toEqual(mockSavedEntity);
    });
  });

  describe('getNotifications', () => {
    it('should retrieve paginated notifications from the repository', async () => {
      const mockResult = {
        data: [
          {
            id: '1',
            recipient: 'alice@example.com',
            type: NotificationType.EMAIL,
            subject: 'Hi',
            body: 'Hello',
            status: 'sent' as const,
            createdAt: new Date(),
          },
        ],
        total: 1,
      };

      mockRepository.findPaginated.mockResolvedValueOnce(mockResult);

      const result = await service.getNotifications(1, 10);

      expect(mockRepository.findPaginated).toHaveBeenCalledTimes(1);
      expect(mockRepository.findPaginated).toHaveBeenCalledWith(1, 10);
      expect(result).toEqual(mockResult);
    });
  });
});
