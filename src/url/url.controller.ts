import {
  Controller,
  Post,
  Get,
  Patch,
  Delete,
  Param,
  Body,
  Req,
  Res,
  UseGuards,
  UsePipes,
  ValidationPipe,
  HttpStatus,
} from '@nestjs/common';
import { UrlService } from './url.service';
import { CreateUrlDto } from './dto/create-url.dto';
import { UpdateUrlDto } from './dto/update-url.dto';
import { Response, Request } from 'express';
import { JwtPayload } from '../strategies/at.strategies';
import { AuthGuard } from '@nestjs/passport';

@Controller()
export class UrlController {
  constructor(private readonly service: UrlService) {}

  @UseGuards(AuthGuard('jwt'))
  @Post('shorten')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async shorten(
    @Body() body: CreateUrlDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const userId = req.user?.sub ? Number(req.user.sub) : undefined;
    return this.service.shortenUrl(body.originalUrl, userId);
  }

  @Get(':shortCode')
  async getOriginalUrlInfo(@Param('shortCode') shortCode: string) {
    const url = await this.service.getOriginalUrlEntity(shortCode);
    return {
      shortCode: url.shortCode,
      originalUrl: url.originalUrl,
      clicks: url.clicks,
      createdAt: url.createdAt,
    };
  }

  @UseGuards(AuthGuard('jwt'))
  @Get('urls/user')
  async findUserUrls(@Req() req: Request & { user: JwtPayload }) {
    const userId = Number(req.user.sub);
    return this.service.getUserUrls(userId);
  }

  @UseGuards(AuthGuard('jwt'))
  @Patch(':shortCode')
  @UsePipes(new ValidationPipe({ whitelist: true }))
  async update(
    @Param('shortCode') shortCode: string,
    @Body() body: UpdateUrlDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.service.updateUrl(
      shortCode,
      body.originalUrl,
      Number(req.user.sub),
    );
  }

  @UseGuards(AuthGuard('jwt'))
  @Delete(':shortCode')
  async remove(
    @Param('shortCode') shortCode: string,
    @Req() req: Request & { user: JwtPayload },
  ) {
    return this.service.softDelete(shortCode, Number(req.user.sub));
  }
}
