import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class AIService {
  private readonly OLLAMA_URL = 'http://localhost:11434/api/generate';
  private readonly MODEL = 'llama3';

  async generateMoAObjects(businessDescription: string, companyType: string): Promise<{ main_objects: string; ancillary_objects: string }> {
    try {
      const prompt = `You are an Indian Company Secretary. Draft the Objects Clause for an MoA under Section 4.
      
INPUT: "${businessDescription}"
TYPE: "${companyType}"

REQUIRED JSON FORMAT (Strict):
{
  "main_objects": "Top 2 critical business objects",
  "ancillary_objects": "Top 3 essential ancillary objects"
}

Keep it concise for statutory compliance. No talk. Just JSON.`;

      const response = await axios.post(this.OLLAMA_URL, {
        model: this.MODEL,
        prompt: prompt,
        stream: false,
        format: 'json',
      }, { timeout: 60000 }); // Increased to 60s

      const result = response.data.response;
      let cleanResult = result;
      
      if (typeof result === 'string') {
        cleanResult = result.replace(/```json/g, '').replace(/```/g, '').trim();
      }

      const parsed = typeof cleanResult === 'string' ? JSON.parse(cleanResult) : cleanResult;

      return {
        main_objects: parsed.main_objects,
        ancillary_objects: parsed.ancillary_objects,
      };
    } catch (error) {
      console.error('Ollama AI Drafting Full Error:', error.response?.data || error.message);
      return {
        main_objects: businessDescription,
        ancillary_objects: 'Standard ancillary objects as per Table A/F of the Companies Act, 2013.',
      };
    }
  }

  async generateAoARegulations(companyType: string): Promise<string> {
    try {
      const prompt = `Draft concise specific regulations for the AoA of a ${companyType} company under Companies Act 2013. Return only the text block.`;

      const response = await axios.post(this.OLLAMA_URL, {
        model: this.MODEL,
        prompt: prompt,
        stream: false,
      }, { timeout: 30000 });

      return response.data.response;
    } catch (error) {
      return '1. The regulations contained in Table "F" in Schedule I to the Companies Act, 2013 shall apply.';
    }
  }
}
