import { Controller, Post, Body, Headers } from '@nestjs/common';
import { AIChatService } from './ai-chat.service';

@Controller('v1/ai-chat')
export class AIChatController {
  constructor(private readonly chatService: AIChatService) {}

  @Post('query')
  async chat(
    @Body() body: { message: string },
    @Headers('x-company-id') companyId: string,
  ) {
    return this.chatService.getChatResponse(body.message, companyId);
  }
}
