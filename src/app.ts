import express from 'express';
import { NotificationRepository } from './repositories/NotificationRepository';
import { NotificationService } from './services/NotificationService';
import { NotificationController } from './controllers/NotificationController';
import { validateNotificationPayload } from './middlewares/validateRequest';
import { errorHandler, AppError } from './middlewares/errorHandler';

const app = express();

app.use(express.json());

const repository = new NotificationRepository();
const service = new NotificationService(repository);
const controller = new NotificationController(service);


app.get('/health', (req, res) => {
  res.status(200).json({ status: 'healthy' });
});


app.post('/api/notifications', validateNotificationPayload, controller.createNotification);
app.get('/api/notifications', controller.getNotifications);

app.use((req, res, next) => {
  next(new AppError('Route not found', 404));
});


app.use(errorHandler);

export default app;
