import { ForbiddenException, Injectable } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { AuthDto } from './dto/auth.dto';
import { CreateUserDto } from '../users/dto/create-user.dto';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { Tokens } from '../types';
import { User } from '../users/entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UsersService,
    private readonly jwtService: JwtService,
  ) {}

  // Verifica se a senha bate com o hash no banco
  async checkPassword(user: User, password: string): Promise<boolean> {
    return bcrypt.compare(password, user.password);
  }

  async login(dto: AuthDto): Promise<Tokens> {
    const user = await this.userService.findByEmail(dto.email);
    if (!user) throw new ForbiddenException('User not found');

    const passwordMatches = await this.checkPassword(user, dto.password);

    if (!passwordMatches) throw new ForbiddenException('Password incorrect');

    const tokens = await this.getTokens(user.id, user.email);

    // Atualizar dados do usuário se necessário
    await this.userService.update(user.id);

    return tokens;
  }

  async register(dto: CreateUserDto): Promise<Tokens> {
    const user = await this.userService.createUser(dto.email, dto.password);

    const tokens = await this.getTokens(user.id, user.email);

    await this.userService.update(user.id);

    return tokens;
  }

  async getTokens(userId: number, email: string): Promise<Tokens> {
    const [accessToken] = await Promise.all([
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '24h',
        },
      ),
      this.jwtService.signAsync(
        { sub: userId, email },
        {
          secret: process.env.JWT_SECRET,
          expiresIn: '7d',
        },
      ),
    ]);

    return {
      access_token: accessToken,
    };
  }
}
