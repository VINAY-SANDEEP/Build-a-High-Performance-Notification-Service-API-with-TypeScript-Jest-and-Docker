import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';
import { NotificationModel } from '../../src/models/Notification';
import { NotificationType } from '../../src/models/types';

describe('Notification Service API Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    await mongoose.connect(uri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await NotificationModel.deleteMany({});
  });

  describe('POST /api/notifications', () => {
    it('should successfully create and dispatch an email notification', async () => {
      const payload = {
        recipient: 'user@example.com',
        type: NotificationType.EMAIL,
        subject: 'Welcome',
        body: 'Hello and welcome!',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.recipient).toBe(payload.recipient);
      expect(response.body.type).toBe(payload.type);
      expect(response.body.subject).toBe(payload.subject);
      expect(response.body.body).toBe(payload.body);
      expect(response.body.status).toBe('sent');
      expect(response.body).toHaveProperty('createdAt');

      const savedDoc = await NotificationModel.findById(response.body.id);
      expect(savedDoc).not.toBeNull();
      expect(savedDoc?.recipient).toBe(payload.recipient);
      expect(savedDoc?.status).toBe('sent');
    });

    it('should successfully create and dispatch an SMS notification', async () => {
      const payload = {
        recipient: '+1234567890',
        type: NotificationType.SMS,
        body: 'Your notification message code is 9876',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(payload)
        .expect(201);

      expect(response.body).toHaveProperty('id');
      expect(response.body.recipient).toBe(payload.recipient);
      expect(response.body.type).toBe(payload.type);
      expect(response.body.subject).toBeUndefined();
      expect(response.body.status).toBe('sent');

      const savedDoc = await NotificationModel.findById(response.body.id);
      expect(savedDoc).not.toBeNull();
      expect(savedDoc?.status).toBe('sent');
    });

    it('should return 400 Bad Request if validation fails (missing required body)', async () => {
      const payload = {
        recipient: 'user@example.com',
        type: NotificationType.EMAIL,
        subject: 'Welcome',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body).toHaveProperty('errors');
      expect(Array.isArray(response.body.errors)).toBe(true);
      expect(response.body.errors.some((err: any) => err.field === 'body')).toBe(true);

      const count = await NotificationModel.countDocuments();
      expect(count).toBe(0);
    });

    it('should return 400 Bad Request if validation fails (email type without subject)', async () => {
      const payload = {
        recipient: 'user@example.com',
        type: NotificationType.EMAIL,
        body: 'This should fail',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.errors.some((err: any) => err.field === 'subject')).toBe(true);

      const count = await NotificationModel.countDocuments();
      expect(count).toBe(0);
    });

    it('should return 400 Bad Request for invalid notification type', async () => {
      const payload = {
        recipient: 'user@example.com',
        type: 'push',
        body: 'Hello',
      };

      const response = await request(app)
        .post('/api/notifications')
        .send(payload)
        .expect(400);

      expect(response.body).toHaveProperty('message', 'Validation failed');
      expect(response.body.errors.some((err: any) => err.field === 'type')).toBe(true);

      const count = await NotificationModel.countDocuments();
      expect(count).toBe(0);
    });
  });

  describe('GET /api/notifications', () => {
    beforeEach(async () => {
      const notifications = [];
      for (let i = 1; i <= 5; i++) {
        notifications.push({
          recipient: `user${i}@example.com`,
          type: NotificationType.EMAIL,
          subject: `Subject ${i}`,
          body: `Body ${i}`,
          status: 'sent',
        });
      }
      // Insert one by one to ensure distinct order by timestamps if timestamps are created synchronously
      for (const item of notifications) {
        const doc = new NotificationModel(item);
        await doc.save();
        // Artificially delay a tiny bit or modify the timestamp so order is guaranteed descending
        doc.createdAt = new Date(Date.now() + notifications.indexOf(item) * 1000);
        await doc.save();
      }
    });

    it('should retrieve all notifications ordered by timestamp descending', async () => {
      const response = await request(app)
        .get('/api/notifications')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(5);

      const data = response.body.data;
      expect(data[0].recipient).toBe('user5@example.com');
      expect(data[4].recipient).toBe('user1@example.com');
    });

    it('should support pagination query parameters and return metadata', async () => {
      const response = await request(app)
        .get('/api/notifications?page=1&limit=2')
        .expect(200);

      expect(response.body).toHaveProperty('data');
      expect(response.body.data.length).toBe(2);
      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(2);
      expect(response.body.totalItems).toBe(5);
      expect(response.body.totalPages).toBe(3);

      expect(response.body.data[0].recipient).toBe('user5@example.com');
      expect(response.body.data[1].recipient).toBe('user4@example.com');
    });

    it('should return empty list if page is out of bounds', async () => {
      const response = await request(app)
        .get('/api/notifications?page=10&limit=2')
        .expect(200);

      expect(response.body.data.length).toBe(0);
      expect(response.body.totalItems).toBe(5);
      expect(response.body.totalPages).toBe(3);
    });
  });

  describe('Error Handling', () => {
    it('should return 404 Not Found for non-existent routes', async () => {
      const response = await request(app)
        .get('/api/non-existent-route')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Route not found');
    });
  });
});
