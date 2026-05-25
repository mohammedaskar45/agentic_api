import { IsString, IsOptional, IsUUID, MaxLength } from 'class-validator';

export class CreateMessageDto {
  @IsString()
  @MaxLength(10000)
  message: string;

  @IsUUID()
  @IsOptional()
  conversation_id?: string;

  @IsString()
  @IsOptional()
  model?: string;
}
