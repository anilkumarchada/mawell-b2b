import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private readonly logger = new Logger(EncryptionService.name);
  private readonly algorithm = 'aes-256-gcm';
  private readonly keyLength = 32; // 256 bits
  private readonly ivLength = 16; // 128 bits
  private readonly tagLength = 16; // 128 bits
  private readonly encryptionKey: Buffer;

  constructor(private configService: ConfigService) {
    const key = this.configService.get<string>('SECURITY_ENCRYPTION_KEY');
    if (!key) {
      throw new Error('Encryption key not configured');
    }
    
    // Derive a consistent key from the provided key
    this.encryptionKey = crypto.scryptSync(key, 'salt', this.keyLength);
  }

  /**
   * Encrypt sensitive data
   */
  encrypt(text: string): string {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      cipher.setAAD(Buffer.from('mawell-b2b', 'utf8'));
      
      let encrypted = cipher.update(text, 'utf8', 'hex');
      encrypted += cipher.final('hex');
      
      const tag = cipher.getAuthTag();
      
      // Combine iv, tag, and encrypted data
      const result = iv.toString('hex') + ':' + tag.toString('hex') + ':' + encrypted;
      
      return result;
    } catch (error) {
      this.logger.error('Encryption failed', error);
      throw new Error('Encryption failed');
    }
  }

  /**
   * Decrypt sensitive data
   */
  decrypt(encryptedData: string): string {
    try {
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const tag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAAD(Buffer.from('mawell-b2b', 'utf8'));
      decipher.setAuthTag(tag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return decrypted;
    } catch (error) {
      this.logger.error('Decryption failed', error);
      throw new Error('Decryption failed');
    }
  }

  /**
   * Hash sensitive data (one-way)
   */
  hash(data: string, salt?: string): string {
    const actualSalt = salt || crypto.randomBytes(16).toString('hex');
    const hash = crypto.pbkdf2Sync(data, actualSalt, 10000, 64, 'sha512');
    return actualSalt + ':' + hash.toString('hex');
  }

  /**
   * Verify hashed data
   */
  verifyHash(data: string, hashedData: string): boolean {
    try {
      const parts = hashedData.split(':');
      if (parts.length !== 2) {
        return false;
      }
      
      const salt = parts[0];
      const originalHash = parts[1];
      
      const hash = crypto.pbkdf2Sync(data, salt, 10000, 64, 'sha512');
      return originalHash === hash.toString('hex');
    } catch (error) {
      this.logger.error('Hash verification failed', error);
      return false;
    }
  }

  /**
   * Generate a secure random token
   */
  generateToken(length = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate a secure random OTP
   */
  generateOTP(length = 6): string {
    const digits = '0123456789';
    let otp = '';
    
    for (let i = 0; i < length; i++) {
      const randomIndex = crypto.randomInt(0, digits.length);
      otp += digits[randomIndex];
    }
    
    return otp;
  }

  /**
   * Encrypt file content
   */
  encryptFile(buffer: Buffer): Buffer {
    try {
      const iv = crypto.randomBytes(this.ivLength);
      const cipher = crypto.createCipher(this.algorithm, this.encryptionKey);
      
      const encrypted = Buffer.concat([
        cipher.update(buffer),
        cipher.final(),
      ]);
      
      const tag = cipher.getAuthTag();
      
      // Combine iv, tag, and encrypted data
      return Buffer.concat([iv, tag, encrypted]);
    } catch (error) {
      this.logger.error('File encryption failed', error);
      throw new Error('File encryption failed');
    }
  }

  /**
   * Decrypt file content
   */
  decryptFile(encryptedBuffer: Buffer): Buffer {
    try {
      const tag = encryptedBuffer.slice(this.ivLength, this.ivLength + this.tagLength);
      const encrypted = encryptedBuffer.slice(this.ivLength + this.tagLength);
      
      const decipher = crypto.createDecipher(this.algorithm, this.encryptionKey);
      decipher.setAuthTag(tag);
      
      const decrypted = Buffer.concat([
        decipher.update(encrypted),
        decipher.final(),
      ]);
      
      return decrypted;
    } catch (error) {
      this.logger.error('File decryption failed', error);
      throw new Error('File decryption failed');
    }
  }

  /**
   * Create HMAC signature for webhook verification
   */
  createHMACSignature(data: string, secret: string): string {
    return crypto.createHmac('sha256', secret).update(data).digest('hex');
  }

  /**
   * Verify HMAC signature
   */
  verifyHMACSignature(data: string, signature: string, secret: string): boolean {
    const expectedSignature = this.createHMACSignature(data, secret);
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(expectedSignature, 'hex'),
    );
  }

  /**
   * Mask sensitive data for logging
   */
  maskSensitiveData(data: string, visibleChars = 4): string {
    if (!data || data.length <= visibleChars) {
      return '*'.repeat(data?.length || 0);
    }
    
    const masked = '*'.repeat(data.length - visibleChars);
    return data.slice(0, visibleChars) + masked;
  }

  /**
   * Mask phone number for logging
   */
  maskPhoneNumber(phone: string): string {
    if (!phone || phone.length < 6) {
      return '*'.repeat(phone?.length || 0);
    }
    
    // Show first 2 and last 2 digits
    const start = phone.slice(0, 2);
    const end = phone.slice(-2);
    const middle = '*'.repeat(phone.length - 4);
    
    return start + middle + end;
  }

  /**
   * Mask email for logging
   */
  maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return '*'.repeat(email?.length || 0);
    }
    
    const [username, domain] = email.split('@');
    const maskedUsername = username.length > 2 
      ? username.slice(0, 2) + '*'.repeat(username.length - 2)
      : '*'.repeat(username.length);
    
    return maskedUsername + '@' + domain;
  }
}