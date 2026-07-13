import { Controller, Get } from '@nestjs/common';
import { SiteService } from './site.service';
import { SiteConfigResponseDto } from './dto/site-config-response.dto';

@Controller('site')
export class SiteController {
  constructor(private readonly siteService: SiteService) {}

  @Get()
  getConfig(): Promise<SiteConfigResponseDto> {
    return this.siteService.getConfig();
  }
}
