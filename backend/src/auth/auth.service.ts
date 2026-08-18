import {
  Injectable,
  UnauthorizedException,
  ConflictException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { randomBytes } from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { CreateUserDto } from './dto/create-user.dto';

interface AuthResult {
  id: string;
  role: string;
  /** RAW refresh token handed to the client — never stored in this form. */
  refreshToken: string;
}

@Injectable()
export class AuthService {
  constructor(
    private prismaService: PrismaService,
    private jwtService: JwtService,
    private configService: ConfigService,
  ) {}

  private get saltRounds(): number {
    return Number(this.configService.get<string>('BCRYPT_SALT') ?? '10');
  }

  /**
   * Issues a refresh token for a user. Only the bcrypt hash of the secret is
   * persisted; the raw token returned here is `<tokenId>.<secret>` so the
   * refresh endpoint can look the row up by id and then compare the secret.
   */
  private async issueRefreshToken(userId: string): Promise<string> {
    const secret = randomBytes(32).toString('hex');
    const tokenHash = await bcrypt.hash(secret, this.saltRounds);

    const token = await this.prismaService.refreshToken.create({
      data: {
        user_id: userId,
        token_hash: tokenHash,
        expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });

    return `${token.id}.${secret}`;
  }

  async signup(dto: CreateUserDto): Promise<AuthResult> {
    const existing = await this.prismaService.user.findUnique({
      where: { email: dto.email },
    });
    // Generic message: do not confirm or deny which field collided.
    if (existing) throw new ConflictException('Unable to create account');

    const { password, role, ...rest } = dto;
    const passwordHash = await bcrypt.hash(password, this.saltRounds);

    const user = await this.prismaService.user.create({
      data: {
        ...rest,
        password_hash: passwordHash,
        role: role ?? 'student',
      },
    });

    return {
      id: user.id,
      role: user.role,
      refreshToken: await this.issueRefreshToken(user.id),
    };
  }

  async validateUser(email: string, password: string): Promise<AuthResult | null> {
    const user = await this.prismaService.user.findUnique({ where: { email } });
    if (!user) return null;

    const passwordMatch = await bcrypt.compare(password, user.password_hash);
    if (!passwordMatch) return null;

    return {
      id: user.id,
      role: user.role,
      refreshToken: await this.issueRefreshToken(user.id),
    };
  }

  async refreshToken(rawToken: string) {
    const [tokenId, secret] = (rawToken ?? '').split('.');
    if (!tokenId || !secret) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const token = await this.prismaService.refreshToken.findUnique({
      where: { id: tokenId },
      include: { user: true },
    });
    if (!token || new Date(token.expires_at) < new Date()) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const secretMatch = await bcrypt.compare(secret, token.token_hash);
    if (!secretMatch) {
      throw new UnauthorizedException('Invalid or expired refresh token');
    }

    const accessToken = this.jwtService.sign({
      sub: token.user.id,
      role: token.user.role,
    });
    return { accessToken };
  }
}