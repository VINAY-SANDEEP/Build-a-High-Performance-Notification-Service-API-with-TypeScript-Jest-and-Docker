import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';
import { NotificationType } from '../models/types';

export const createNotificationSchema = z.object({
  recipient: z.string({
    required_error: 'recipient is required',
  }).min(1, 'recipient cannot be empty'),
  type: z.nativeEnum(NotificationType, {
    errorMap: () => ({ message: "type must be either 'email' or 'sms'" }),
  }),
  subject: z.string().optional(),
  body: z.string({
    required_error: 'body is required',
  }).min(1, 'body cannot be empty'),
}).refine((data) => {
  if (data.type === NotificationType.EMAIL) {
    return typeof data.subject === 'string' && data.subject.trim().length > 0;
  }
  return true;
}, {
  message: "subject is required when type is 'email'",
  path: ['subject'],
});

export const validateNotificationPayload = (req: Request, res: Response, next: NextFunction): void => {
  try {
    createNotificationSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      res.status(400).json({
        message: 'Validation failed',
        errors: formattedErrors
      });
      return;
    }
    next(error);
  }
};
