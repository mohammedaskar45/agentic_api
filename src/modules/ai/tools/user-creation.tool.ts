import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { DtoAnalyzerTool } from './dto-analyzer.tool';
import * as path from 'path';
import * as bcrypt from 'bcrypt';

const CREATE_USER_DTO_PATH = path.resolve(
  'D:\\Malik\\agentic_api\\src\\v1\\master\\access-control',
);

export interface UserCreationPayload {
  name: string;
  mail_id: string;
  password: string;
  role_id: string;
  first_name?: string;
  last_name?: string;
  mobile_no?: string;
  user_type?: string;
}

export interface UserCreationResult {
  success: boolean;
  user_id?: string;
  message: string;
  missing_fields?: string[];
}

@Injectable()
export class UserCreationTool {
  constructor(
    private readonly dataSource: DataSource,
    private readonly dtoAnalyzer: DtoAnalyzerTool,
  ) {}

  getRequiredFields(): string[] {
    return ['name', 'mail_id', 'password', 'role_id'];
  }

  validateEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  validateMobile(mobile: string): boolean {
    return /^[\d+\-\s()]{7,20}$/.test(mobile);
  }

  async createUser(payload: Partial<UserCreationPayload>): Promise<UserCreationResult> {
    const required = this.getRequiredFields();
    const missing = required.filter((f) => !payload[f as keyof UserCreationPayload]);

    if (missing.length > 0) {
      return {
        success: false,
        message: `Missing required fields: ${missing.join(', ')}`,
        missing_fields: missing,
      };
    }

    if (!this.validateEmail(payload.mail_id!)) {
      return {
        success: false,
        message: 'Invalid email address format.',
      };
    }

    if (payload.mobile_no && !this.validateMobile(payload.mobile_no)) {
      return {
        success: false,
        message: 'Invalid mobile number format.',
      };
    }

    try {
      // Check if user already exists
      const existing = await this.dataSource.query(
        'SELECT user_id FROM users WHERE mail_id = $1',
        [payload.mail_id],
      );

      if (existing && existing.length > 0) {
        return {
          success: false,
          message: `A user with email '${payload.mail_id}' already exists.`,
        };
      }

      // Hash password
      const hashedPassword = await bcrypt.hash(payload.password!, 10);

      const result = await this.dataSource.query(
        `
        INSERT INTO users (user_id, name, first_name, last_name, mail_id, password, role_id, mobile_no, user_type)
        VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING user_id, name, mail_id
        `,
        [
          payload.name,
          payload.first_name || null,
          payload.last_name || null,
          payload.mail_id,
          hashedPassword,
          payload.role_id,
          payload.mobile_no || null,
          payload.user_type || 'Admin',
        ],
      );

      const newUser = result[0];
      return {
        success: true,
        user_id: newUser.user_id,
        message: `✅ User '${newUser.name}' created successfully with email '${newUser.mail_id}'. User ID: ${newUser.user_id}`,
      };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return {
        success: false,
        message: `Failed to create user: ${msg}`,
      };
    }
  }

  async getAvailableRoles(): Promise<Array<{ role_id: string; role_name: string }>> {
    try {
      return await this.dataSource.query(
        'SELECT role_id, role_name FROM roles ORDER BY role_name',
      );
    } catch {
      return [];
    }
  }
}
