import { Injectable } from '@nestjs/common';
import { FileReaderTool } from './file-reader.tool';

export interface ApiRoute {
  method: string;
  path: string;
  handler: string;
  dtoType?: string;
  guards?: string[];
}

export interface ControllerAnalysis {
  file: string;
  controllerName: string;
  basePath: string;
  routes: ApiRoute[];
}

@Injectable()
export class ApiRouteAnalyzerTool {
  constructor(private readonly fileReader: FileReaderTool) {}

  analyzeController(filePath: string): ControllerAnalysis | { error: string } {
    const result = this.fileReader.readFile(filePath);
    if (!result.content) {
      return { error: result.error || 'Could not read file' };
    }

    const content = result.content;

    const classMatch = content.match(/export\s+class\s+(\w+)/);
    const controllerName = classMatch ? classMatch[1] : 'Unknown';

    const basePathMatch = content.match(/@Controller\(['"]([^'"]*)['"]\)/);
    const basePath = basePathMatch ? basePathMatch[1] : '';

    const routes: ApiRoute[] = [];
    const methodPattern =
      /@(Get|Post|Put|Patch|Delete)\(['"]?([^'")\s]*)?['"]?\)\s*(?:@\w+[^)]*\)\s*)*(?:async\s+)?(\w+)\s*\(([^)]*)\)/gi;

    let match: RegExpExecArray | null;
    while ((match = methodPattern.exec(content)) !== null) {
      const [, httpMethod, subPath = '', handlerName, params] = match;

      const dtoMatch = params.match(/:\s*(\w+Dto)/);
      const dtoType = dtoMatch ? dtoMatch[1] : undefined;

      routes.push({
        method: httpMethod.toUpperCase(),
        path: `/${basePath}${subPath ? '/' + subPath : ''}`.replace(/\/+/g, '/'),
        handler: handlerName,
        dtoType,
      });
    }

    return { file: filePath, controllerName, basePath, routes };
  }

  formatRoutesSummary(analysis: ControllerAnalysis): string {
    const lines = [
      `Controller: ${analysis.controllerName}`,
      `Base path: /${analysis.basePath}`,
      'Routes:',
    ];
    for (const route of analysis.routes) {
      const dto = route.dtoType ? ` [DTO: ${route.dtoType}]` : '';
      lines.push(`  ${route.method} ${route.path} → ${route.handler}()${dto}`);
    }
    return lines.join('\n');
  }
}
