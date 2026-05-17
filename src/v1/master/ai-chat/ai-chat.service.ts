import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import axios from 'axios';
import { Incorporation } from '../../compliance/incorporation/entities/incorporation.entity';
import { IncMasterData } from '../../compliance/incorporation/entities/inc-master-data.entity';

@Injectable()
export class AIChatService {
  private readonly logger = new Logger(AIChatService.name);
  private readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  private readonly MODEL = 'llama3';

  constructor(
    @InjectRepository(Incorporation)
    private readonly incorporationRepo: Repository<Incorporation>,
    @InjectRepository(IncMasterData)
    private readonly masterDataRepo: Repository<IncMasterData>,
  ) {}

  async getChatResponse(userMessage: string, companyId: string) {
    try {
      // 1. Gather Database Context
      // First find incorporation record for this company
      const workflowStatus = await this.incorporationRepo.findOne({
        where: { company_id: companyId },
      });

      // Then find master data linked to this incorporation
      const companyInfo = workflowStatus 
        ? await this.masterDataRepo.findOne({ where: { incorporation_id: workflowStatus.incorporation_id } })
        : null;

      const context = `
        CURRENT SYSTEM DATA (RESTRICTED ACCESS):
        - Company Name: ${companyInfo?.proposed_name || 'Not Set'}
        - State: ${companyInfo?.state || 'Not Set'}
        - Capital: Rs. ${companyInfo?.authorised_capital || 0}
        - Current Step: ${workflowStatus?.current_step_id || 0}
        - Status: ${workflowStatus?.status || 'Pending'}
        - Objects: ${companyInfo?.main_objects || 'Not Set'}
      `;

      // 2. Prepare Prompt
      const systemPrompt = `You are the "Agentic AI Compliance Assistant". You have access to the user's real-time company incorporation data. 
      Your goal is to help the user with their registration process and answer legal/compliance questions.
      
      ${context}
      
      INSTRUCTIONS:
      - Be professional, encouraging, and legally accurate.
      - If the user asks about their progress, refer to the data above.
      - If you don't have specific data, guide them on how to fill it.
      - Language: Professional English (Tamil mixed if needed).
      
      User Message: ${userMessage}
      
      Assistant Response:`;

      // 3. Call Local AI
      const response = await axios.post(this.OLLAMA_URL, {
        model: this.MODEL,
        prompt: systemPrompt,
        stream: false,
      }, { timeout: 60000 });

      return {
        success: true,
        response: response.data.response,
      };
    } catch (error) {
      this.logger.error('Chat AI Error:', error.message);
      return {
        success: false,
        response: "I'm sorry, I'm having trouble connecting to my brain. Please try again in a moment.",
      };
    }
  }
}
