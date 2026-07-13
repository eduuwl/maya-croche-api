import { Body, Controller, Get, Patch, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SiteService } from './site.service';
import { SiteConfigResponseDto } from './dto/site-config-response.dto';
import { UpdateSiteConfigDto } from './dto/update-site-config.dto';

@Controller('site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get()
  getConfig(): Promise<SiteConfigResponseDto> {
    return this.siteService.getConfig();
  }
}

@UseGuards(JwtAuthGuard)
@Controller('admin/site')
export class AdminSiteController {
  constructor(private readonly siteService: SiteService) {}

  @Patch()
  updateConfig(
    @Body() dto: UpdateSiteConfigDto,
  ): Promise<SiteConfigResponseDto> {
    return this.siteService.updateConfig(dto);
  }
}
