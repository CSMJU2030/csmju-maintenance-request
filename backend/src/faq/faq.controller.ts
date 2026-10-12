import { Body, Controller, Get, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import type { RepairActor } from '../actor/repair-actor';
import { CurrentActor } from '../actor/current-actor.decorator';
import { RequirePermissions } from '../auth/decorators/require-permissions.decorator';
import { Permission } from '../auth/permissions';
import { ApiEnvelope, ApiErrors } from '../shared/swagger';
import { AskFaqDto, FaqAnswerDto, FaqIndexDto } from './faq.dto';
import { FaqService } from './faq.service';

@ApiTags('faq')
@ApiBearerAuth()
@Controller('v1/faq')
@RequirePermissions(Permission.FAQ_ASK)
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  @Get()
  @ApiOperation({ summary: 'คำถามที่พบบ่อยและสถานะผู้ช่วย AI' })
  @ApiEnvelope(FaqIndexDto)
  @ApiErrors(403)
  getIndex() {
    return this.faq.getIndex();
  }

  @Post('ask')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'ถามผู้ช่วย FAQ จากข้อมูลของระบบแจ้งซ่อม' })
  @ApiEnvelope(FaqAnswerDto)
  @ApiErrors(400, 403, 429)
  ask(@CurrentActor() actor: RepairActor, @Body() body: AskFaqDto) {
    return this.faq.ask(body.question, actor.coreUserId);
  }
}
