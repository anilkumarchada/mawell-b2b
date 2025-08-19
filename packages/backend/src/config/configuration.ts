export default () => ({
  // Server
  port: parseInt(process.env.PORT, 10) || 3001,
  nodeEnv: process.env.NODE_ENV || 'development',
  apiPrefix: process.env.API_PREFIX || 'api/v1',

  // Database
  database: {
    url: process.env.DATABASE_URL,
  },

  // Redis
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT, 10) || 6379,
    password: process.env.REDIS_PASSWORD,
  },

  // JWT
  jwt: {
    secret: process.env.JWT_SECRET || 'your-super-secret-jwt-key',
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
    refreshSecret: process.env.JWT_REFRESH_SECRET || 'your-super-secret-refresh-key',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '30d',
  },

  // File Storage
  aws: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    region: process.env.AWS_REGION || 'us-east-1',
    s3: {
      bucket: process.env.AWS_S3_BUCKET || 'mawell-uploads',
      endpoint: process.env.AWS_S3_ENDPOINT,
      forcePathStyle: process.env.AWS_S3_FORCE_PATH_STYLE === 'true',
    },
  },

  // SMS
  sms: {
    provider: process.env.SMS_PROVIDER || 'MSG91',
    msg91: {
      apiKey: process.env.MSG91_API_KEY,
      templateId: process.env.MSG91_TEMPLATE_ID,
    },
    twilio: {
      accountSid: process.env.TWILIO_ACCOUNT_SID,
      authToken: process.env.TWILIO_AUTH_TOKEN,
      phoneNumber: process.env.TWILIO_PHONE_NUMBER,
    },
  },

  // Email
  email: {
    smtp: {
      host: process.env.SMTP_HOST || 'localhost',
      port: parseInt(process.env.SMTP_PORT, 10) || 1025,
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
      from: process.env.SMTP_FROM || 'noreply@mawell.com',
    },
  },

  // Razorpay
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID,
    keySecret: process.env.RAZORPAY_KEY_SECRET,
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET,
  },

  // Google Maps
  googleMaps: {
    apiKey: process.env.GOOGLE_MAPS_API_KEY,
  },

  // Firebase
  firebase: {
    serverKey: process.env.FCM_SERVER_KEY,
    projectId: process.env.FCM_PROJECT_ID,
  },

  // Rate Limiting
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL, 10) || 60,
    limit: parseInt(process.env.THROTTLE_LIMIT, 10) || 10,
  },

  // OTP
  otp: {
    rateLimit: parseInt(process.env.OTP_RATE_LIMIT, 10) || 3,
    rateLimitTtl: parseInt(process.env.OTP_RATE_LIMIT_TTL, 10) || 300,
    expiryMinutes: 10,
    length: 6,
  },

  // Security
  security: {
    corsOrigin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'],
    encryptionKey: process.env.ENCRYPTION_KEY,
  },

  // Background Jobs
  jobs: {
    concurrency: parseInt(process.env.JOB_CONCURRENCY, 10) || 5,
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || 'debug',
    fileEnabled: process.env.LOG_FILE_ENABLED === 'true',
    filePath: process.env.LOG_FILE_PATH || './logs',
  },

  // Health Check
  health: {
    enabled: process.env.HEALTH_CHECK_ENABLED === 'true',
    database: process.env.HEALTH_CHECK_DATABASE === 'true',
    redis: process.env.HEALTH_CHECK_REDIS === 'true',
  },

  // Development
  swagger: {
    enabled: process.env.SWAGGER_ENABLED === 'true',
    path: process.env.SWAGGER_PATH || 'docs',
  },

  // Webhooks
  webhooks: {
    baseUrl: process.env.WEBHOOK_BASE_URL || 'http://localhost:3001',
  },

  // Business Settings
  business: {
    defaultDeliveryFee: parseFloat(process.env.DEFAULT_DELIVERY_FEE) || 50,
    defaultEtaHours: parseInt(process.env.DEFAULT_ETA_HOURS, 10) || 24,
    defaultTaxRate: parseFloat(process.env.DEFAULT_TAX_RATE) || 18,
    minOrderAmount: parseFloat(process.env.MIN_ORDER_AMOUNT) || 100,
    maxCodAmount: parseFloat(process.env.MAX_COD_AMOUNT) || 5000,
  },

  // Location
  location: {
    updateInterval: parseInt(process.env.LOCATION_UPDATE_INTERVAL, 10) || 30,
    geofenceRadius: parseInt(process.env.GEOFENCE_RADIUS, 10) || 100,
  },

  // File Upload
  upload: {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE, 10) || 10485760, // 10MB
    allowedImageTypes: process.env.ALLOWED_IMAGE_TYPES?.split(',') || [
      'image/jpeg',
      'image/png',
      'image/webp',
    ],
    allowedDocumentTypes: process.env.ALLOWED_DOCUMENT_TYPES?.split(',') || [
      'application/pdf',
      'image/jpeg',
      'image/png',
    ],
  },

  // Default Admin
  defaultAdmin: {
    phone: process.env.DEFAULT_ADMIN_PHONE || '+919999999999',
    password: process.env.DEFAULT_ADMIN_PASSWORD || 'admin123',
  },
});