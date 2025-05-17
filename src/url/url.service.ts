import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { IsNull, Repository } from 'typeorm';
import { Url } from './entities/url.entity';
import { randomBytes } from 'crypto';
import { User } from '../users/entities/user.entity';

@Injectable()
export class UrlService {
  constructor(
    @InjectRepository(Url)
    private readonly urlRepository: Repository<Url>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {}

  private generateShortCode(): string {
    // 6 caracteres alfanuméricos (base64url slice)
    return randomBytes(4).toString('base64url').slice(0, 6);
  }

  async shortenUrl(originalUrl: string, userId?: number) {
    let shortCode = this.generateShortCode();

    // Garantir unicidade do shortCode
    while (await this.urlRepository.findOne({ where: { shortCode } })) {
      shortCode = this.generateShortCode();
    }

    const user = userId
      ? await this.userRepository.findOneBy({ id: userId })
      : null;

    const data: any = {
      shortCode,
      originalUrl,
    };

    if (user) {
      data.user = user;
    }

    const newUrl = this.urlRepository.create(data);

    const saved = await this.urlRepository.save(newUrl);

    return {
      shortUrl: `http://localhost:3003/${(saved as unknown as Url).shortCode}`,
    };
  }

  async getOriginalUrlEntity(shortCode: string): Promise<Url> {
    const url = await this.urlRepository.findOne({
      where: { shortCode, deletedAt: IsNull() },
    });

    if (!url) throw new NotFoundException('URL not found or deleted');

    url.clicks++;
    await this.urlRepository.save(url);

    return url;
  }

  async getUserUrls(userId: number) {
    return this.urlRepository.find({
      where: {
        user: { id: userId },
        deletedAt: IsNull(),
      },
      relations: ['user'],
      order: { createdAt: 'DESC' },
    });
  }

  async updateUrl(shortCode: string, newUrl: string, userId: number) {
    const url = await this.urlRepository.findOne({
      where: {
        shortCode,
        deletedAt: IsNull(),
      },

      relations: ['user'],
    });

    if (!url) throw new NotFoundException('URL not found or deleted');
    if (url.user?.id !== userId)
      throw new ForbiddenException('Not allowed to update this URL');

    url.originalUrl = newUrl;
    url.updatedAt = new Date();

    return this.urlRepository.save(url);
  }

  async softDelete(shortCode: string, userId: number) {
    const url = await this.urlRepository.findOne({
      where: {
        shortCode,
        deletedAt: IsNull(),
      },
      relations: ['user'],
    });

    if (!url) throw new NotFoundException('URL not found or already deleted');
    if (url.user?.id !== userId)
      throw new ForbiddenException('Not allowed to delete this URL');

    url.deletedAt = new Date();

    return this.urlRepository.save(url);
  }
}
