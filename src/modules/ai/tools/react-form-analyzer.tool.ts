import { Injectable } from '@nestjs/common';
import { FileReaderTool } from './file-reader.tool';

export interface FormField {
  name: string;
  type: string;
  validation?: string[];
  defaultValue?: string;
  required: boolean;
}

export interface ReactFormAnalysis {
  file: string;
  formName?: string;
  fields: FormField[];
  submitHandler?: string;
}

@Injectable()
export class ReactFormAnalyzerTool {
  constructor(private readonly fileReader: FileReaderTool) {}

  analyzeForm(filePath: string): ReactFormAnalysis | { error: string } {
    const result = this.fileReader.readFile(filePath);
    if (!result.content) {
      return { error: result.error || 'Could not read file' };
    }

    const content = result.content;
    const fields: FormField[] = [];

    // Extract react-hook-form register calls
    const registerPattern = /register\(['"](\w+)['"]/g;
    let match: RegExpExecArray | null;
    while ((match = registerPattern.exec(content)) !== null) {
      const name = match[1];
      if (!fields.find((f) => f.name === name)) {
        fields.push({ name, type: 'string', required: false });
      }
    }

    // Extract zod schema fields
    const zodPattern = /(\w+):\s*z\.(string|number|boolean|array|object|enum)\(/g;
    while ((match = zodPattern.exec(content)) !== null) {
      const [, name, type] = match;
      const existing = fields.find((f) => f.name === name);
      if (existing) {
        existing.type = type;
      } else {
        fields.push({ name, type, required: true });
      }
    }

    // Extract form submission handler
    const submitMatch = content.match(
      /onSubmit.*?=.*?(?:async\s+)?\((?:\w+)\)\s*=>/,
    );
    const submitHandler = submitMatch ? submitMatch[0].split('=')[0].trim() : undefined;

    // Extract component/form name
    const formNameMatch = content.match(/(?:export\s+(?:default\s+)?(?:function|const)\s+(\w+))/);
    const formName = formNameMatch ? formNameMatch[1] : undefined;

    return {
      file: filePath,
      formName,
      fields,
      submitHandler,
    };
  }

  formatFormSummary(analysis: ReactFormAnalysis): string {
    const lines = [
      `Form Component: ${analysis.formName || 'Unknown'}`,
      `File: ${analysis.file}`,
      'Fields:',
    ];
    for (const field of analysis.fields) {
      const req = field.required ? ' (required)' : ' (optional)';
      lines.push(`  - ${field.name}: ${field.type}${req}`);
    }
    if (analysis.submitHandler) {
      lines.push(`Submit: ${analysis.submitHandler}`);
    }
    return lines.join('\n');
  }
}
