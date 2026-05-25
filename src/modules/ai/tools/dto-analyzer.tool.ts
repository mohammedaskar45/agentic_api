import { Injectable } from '@nestjs/common';
import { FileReaderTool } from './file-reader.tool';

export interface DtoField {
  name: string;
  type: string;
  decorators: string[];
  optional: boolean;
}

export interface DtoAnalysis {
  file: string;
  className: string;
  fields: DtoField[];
  requiredFields: string[];
  optionalFields: string[];
}

@Injectable()
export class DtoAnalyzerTool {
  constructor(private readonly fileReader: FileReaderTool) {}

  analyzeDto(filePath: string): DtoAnalysis | { error: string } {
    const result = this.fileReader.readFile(filePath);
    if (!result.content) {
      return { error: result.error || 'Could not read file' };
    }

    const content = result.content;

    // Extract class name
    const classMatch = content.match(/export\s+class\s+(\w+)/);
    const className = classMatch ? classMatch[1] : 'Unknown';

    // Extract fields with decorators
    const fieldPattern =
      /@([\w@()'".,\s\n]+)\n\s+(?:readonly\s+)?(\w+)(\??):\s*([\w<>\[\]|]+)/g;
    const fields: DtoField[] = [];
    let match: RegExpExecArray | null;

    while ((match = fieldPattern.exec(content)) !== null) {
      const decoratorsRaw = match[1];
      const name = match[2];
      const optional = match[3] === '?';
      const type = match[4];

      const decorators = decoratorsRaw
        .split('\n')
        .map((d) => d.trim())
        .filter((d) => d.startsWith('@'));

      fields.push({ name, type, decorators, optional });
    }

    // Fallback: simple property extraction
    if (fields.length === 0) {
      const simplePattern = /(?:readonly\s+)?(\w+)(\??):\s*([\w<>\[\]|]+)/g;
      while ((match = simplePattern.exec(content)) !== null) {
        const [, name, opt, type] = match;
        // Skip constructor params etc
        if (['return', 'new', 'extends', 'implements'].includes(name)) continue;
        fields.push({ name, type, decorators: [], optional: opt === '?' });
      }
    }

    return {
      file: filePath,
      className,
      fields,
      requiredFields: fields.filter((f) => !f.optional).map((f) => f.name),
      optionalFields: fields.filter((f) => f.optional).map((f) => f.name),
    };
  }

  buildRequiredFieldSummary(analysis: DtoAnalysis): string {
    const lines = [`DTO: ${analysis.className}`, 'Required fields:'];
    for (const f of analysis.fields.filter((field) => !field.optional)) {
      lines.push(`  - ${f.name}: ${f.type}`);
    }
    if (analysis.optionalFields.length > 0) {
      lines.push('Optional fields:');
      for (const f of analysis.fields.filter((field) => field.optional)) {
        lines.push(`  - ${f.name}: ${f.type}`);
      }
    }
    return lines.join('\n');
  }
}
