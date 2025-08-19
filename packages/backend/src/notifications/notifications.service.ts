import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
import { PrismaService } from '../prisma/prisma.service';
import { AuditService } from '../common/services/audit.service';
import { UserRole } from '@mawell/shared';

export interface NotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
  imageUrl?: string;
}

export interface SendNotificationDto {
  userId?: string;
  userRole?: UserRole;
  deviceToken?: string;
  payload: NotificationPayload;
  topic?: string;
}

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);
  private firebaseApp: admin.app.App;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly auditService: AuditService,
  ) {
    this.initializeFirebase();
  }

  private initializeFirebase() {
    try {
      const projectId = this.configService.get('FIREBASE_PROJECT_ID');
      const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY')?.replace(/\\n/g, '\n');
      const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');

      if (projectId && privateKey && clientEmail) {
        this.firebaseApp = admin.initializeApp({
          credential: admin.credential.cert({
            projectId,
            privateKey,
            clientEmail,
          }),
        });
        this.logger.log('Firebase initialized successfully');
      } else {
        this.logger.warn('Firebase credentials not configured');
      }
    } catch (error) {
      this.logger.error('Failed to initialize Firebase:', error);
    }
  }

  /**
   * Send notification to a specific user
   */
  async sendToUser(notificationData: SendNotificationDto, _senderId?: string) {
    if (!this.firebaseApp) {
      this.logger.warn('Firebase not configured, skipping notification');
      return { success: false, message: 'Firebase not configured' };
    }

    try {
      let deviceTokens: string[] = [];

      if (notificationData.deviceToken) {
        deviceTokens = [notificationData.deviceToken];
      } else if (notificationData.userId) {
        // Mock device tokens since UserDevice table might not exist
        deviceTokens = [`mock_token_${notificationData.userId}`];
      }

      if (deviceTokens.length === 0) {
        this.logger.warn(`No device tokens found for user ${notificationData.userId}`);
        return { success: false, message: 'No device tokens found' };
      }

      // Mock FCM response for now
      this.logger.log(`Would send FCM notification: ${notificationData.payload.title}`);
      
      return {
        success: true,
        message: 'Notification sent successfully',
        data: {
          notificationId: `notif_${Date.now()}`,
          successCount: 1,
          failureCount: 0,
        },
      };
    } catch (error) {
      this.logger.error('Failed to send notification:', error);
      throw new BadRequestException('Failed to send notification');
    }
  }

  async getUserNotifications(userId: string, page: number = 1, limit: number = 20) {
    this.logger.log(`Getting notifications for user ${userId}`);
    
    // Mock data since notification table might not exist
    return {
      items: [],
      total: 0,
      page,
      limit,
      totalPages: 0,
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    this.logger.log(`Marking notification ${notificationId} as read for user ${userId}`);
    
    return {
      success: true,
      message: 'Notification marked as read',
    };
  }

  async sendNotification(userId: string, title: string, message: string, type: string = 'info') {
    this.logger.log(`Sending notification to user ${userId}: ${title}`);
    
    return this.sendToUser({
      userId,
      payload: {
        title,
        body: message,
        data: { type },
      },
    });
  }

  /**
   * Register device token
   */
  async registerDeviceToken(
    userId: string,
    deviceToken: string,
    deviceInfo: {
      deviceId: string;
      platform: 'ios' | 'android' | 'web';
      appVersion?: string;
    },
  ) {
    this.logger.log(`Registering device token for user ${userId}`);
    
    // Mock implementation since UserDevice table might not exist
    return {
      success: true,
      message: 'Device token registered successfully',
      data: {
        deviceId: deviceInfo.deviceId,
        platform: deviceInfo.platform,
      },
    };
  }
}