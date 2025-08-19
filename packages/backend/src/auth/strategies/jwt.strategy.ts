import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../prisma/prisma.service';
import { UserRole } from '@mawell/shared';

export interface JwtPayload {
  sub: string; // user id
  phone: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.get<string>('jwt.secret'),
    });
  }

  async validate(payload: JwtPayload) {
    const { sub: userId, phone, role } = payload;

    // Find user in database
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        buyerProfile: {
          include: {
            cartItems: true,
          },
        },
        driverProfile: true,
      },
    }) as any;

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('User account is deactivated');
    }

    if (user.phone !== phone || user.role !== role) {
      throw new UnauthorizedException('Token payload mismatch');
    }

    // Return user object that will be attached to request
    return {
      id: user.id,
      phone: user.phone,
      role: user.role,
      isActive: user.isActive,
      isPhoneVerified: user.isPhoneVerified,
      language: user.language,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
      buyerProfile: user.buyerProfile,
      driverProfile: user.driverProfile,
      // Add warehouse assignments for ops users
      assignedWarehouses: user.role === UserRole.OPS ? await this.getAssignedWarehouses(user.id) : undefined,
    };
  }

  private async getAssignedWarehouses(userId: string): Promise<string[]> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: {
        warehouseOpsUser: {
          select: {
            warehouseId: true,
          },
        },
      },
    });
    return user?.warehouseOpsUser?.map(w => w.warehouseId) || [];
  }
}