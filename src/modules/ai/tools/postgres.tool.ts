import { Injectable } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { validateSql } from '../utils/sql-validator';
import { safeExecute } from '../utils/safe-execution';

export interface SchemaSummary {
  tables: TableSummary[];
}

export interface TableSummary {
  table_name: string;
  columns: ColumnSummary[];
  row_count?: number;
}

export interface ColumnSummary {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default?: string;
}

const BLACKLISTED_TABLES = ['ai_audit_logs'];
const BLACKLISTED_COLUMNS_PARTIAL = [
  'password',
  'refresh_token',
  'access_token',
  'otp',
  'secret_key',
  'token',
  'hash',
  'salt',
];

@Injectable()
export class SchemaReaderTool {
  constructor(private readonly dataSource: DataSource) {}

  async getFullSchema(): Promise<SchemaSummary> {
    const tablesResult = await this.dataSource.query(`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_type = 'BASE TABLE'
      ORDER BY table_name
    `);

    const tables: TableSummary[] = [];

    for (const row of tablesResult) {
      const tableName: string = row.table_name;

      if (BLACKLISTED_TABLES.includes(tableName)) continue;

      const columnsResult = await this.dataSource.query(
        `
        SELECT column_name, data_type, is_nullable, column_default
        FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = $1
        ORDER BY ordinal_position
      `,
        [tableName],
      );

      const columns: ColumnSummary[] = columnsResult
        .filter(
          (col: ColumnSummary) =>
            !BLACKLISTED_COLUMNS_PARTIAL.some((b) =>
              col.column_name.toLowerCase().includes(b),
            ),
        )
        .map((col: ColumnSummary) => ({
          column_name: col.column_name,
          data_type: col.data_type,
          is_nullable: col.is_nullable,
          column_default: col.column_default,
        }));

      tables.push({ table_name: tableName, columns });
    }

    return { tables };
  }

  async getTableSchema(tableName: string): Promise<TableSummary | null> {
    const safeName = tableName.replace(/[^a-zA-Z0-9_]/g, '');

    if (BLACKLISTED_TABLES.includes(safeName)) {
      return null;
    }

    const result = await this.dataSource.query(
      `
      SELECT column_name, data_type, is_nullable, column_default
      FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = $1
      ORDER BY ordinal_position
    `,
      [safeName],
    );

    if (!result || result.length === 0) return null;

    const columns: ColumnSummary[] = result
      .filter(
        (col: ColumnSummary) =>
          !BLACKLISTED_COLUMNS_PARTIAL.some((b) =>
            col.column_name.toLowerCase().includes(b),
          ),
      )
      .map((col: ColumnSummary) => ({
        column_name: col.column_name,
        data_type: col.data_type,
        is_nullable: col.is_nullable,
        column_default: col.column_default,
      }));

    return { table_name: safeName, columns };
  }

  schemaToPromptText(schema: SchemaSummary): string {
    const lines: string[] = ['DATABASE SCHEMA (read-only access):'];
    for (const table of schema.tables) {
      lines.push(`\nTable: ${table.table_name}`);
      lines.push('  Columns:');
      for (const col of table.columns) {
        lines.push(
          `    - ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`,
        );
      }
    }
    return lines.join('\n');
  }
}

@Injectable()
export class PostgresTool {
  constructor(
    private readonly dataSource: DataSource,
    private readonly schemaReader: SchemaReaderTool,
  ) {}

  async executeQuery(sql: string): Promise<{ rows: unknown[]; count: number; error?: string }> {
    const validation = validateSql(sql);

    if (!validation.valid) {
      return { rows: [], count: 0, error: validation.error };
    }

    const result = await safeExecute(
      () => this.dataSource.query(validation.sanitized!),
      8000,
    );

    if (!result.success) {
      return { rows: [], count: 0, error: result.error };
    }

    const rows = Array.isArray(result.data) ? result.data : [];
    // Remove blacklisted fields from results
    const cleanRows = rows.map((row) => {
      if (typeof row !== 'object' || row === null) return row;
      const cleaned: Record<string, unknown> = {};
      for (const [key, value] of Object.entries(row as Record<string, unknown>)) {
        const isBlacklisted = [
          'password', 'refresh_token', 'access_token', 'otp',
          'secret_key', 'token', 'hash', 'salt',
        ].some((b) => key.toLowerCase().includes(b));
        if (!isBlacklisted) {
          cleaned[key] = value;
        }
      }
      return cleaned;
    });

    return { rows: cleanRows, count: cleanRows.length };
  }
}
