import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';
import { IsString, Length } from 'class-validator';
import { trim } from '../shared/transforms';

export class FaqItemDto {
  @ApiProperty({ example: 'report-repair' })
  id: string;

  @ApiProperty({ example: 'แจ้งซ่อมได้อย่างไร?' })
  question: string;

  @ApiProperty({ example: 'เลือกเมนู “แจ้งซ่อม” แล้วระบุสถานที่และอาการที่พบ' })
  answer: string;
}

export class FaqIndexDto {
  @ApiProperty({ type: [FaqItemDto] })
  items: FaqItemDto[];

  @ApiProperty({ description: 'มีการตั้งค่า AI provider สำหรับตอบคำถามหรือไม่' })
  assistantAvailable: boolean;
}

export class AskFaqDto {
  @ApiProperty({
    minLength: 2,
    maxLength: 1200,
    example: 'แจ้งซ่อมแล้วติดตามสถานะตรงไหน?',
  })
  @Transform(trim)
  @IsString({ message: 'คำถามต้องเป็นข้อความ' })
  @Length(2, 1200, { message: 'คำถามต้องยาว 2–1200 ตัวอักษร' })
  question: string;
}

export class FaqAnswerDto {
  @ApiProperty({ description: 'คำตอบภาษาไทยจาก AI หรือจากการค้น FAQ ในเครื่อง' })
  answer: string;

  @ApiProperty({ enum: ['ai', 'faq'], description: 'แหล่งที่ใช้สร้างคำตอบ' })
  mode: 'ai' | 'faq';

  @ApiProperty({ type: [String], description: 'รหัส FAQ ที่เกี่ยวข้องกับคำถาม' })
  relatedFaqIds: string[];
}
