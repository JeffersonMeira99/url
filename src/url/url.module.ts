import { TypeOrmModule } from '@nestjs/typeorm';
import { Module } from '@nestjs/common';
import { UrlController } from './url.controller';
import { UrlService } from './url.service';
import { UsersModule } from '../users/users.module';
import { User } from '../users/entities/user.entity';
import { Url } from './entities/url.entity';
import { AtStrategiest } from '../strategies/at.strategies';

@Module({
  imports: [TypeOrmModule.forFeature([Url, User]), UsersModule],
  controllers: [UrlController],
  providers: [UrlService, AtStrategiest],
  exports: [UrlService],
})
export class UrlModule {}
