import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

const ALLOWED_EXTENSIONS = [
  '.ts', '.tsx', '.js', '.jsx', '.json', '.md', '.css', '.html',
  '.env.example', '.sql',
];

const MAX_FILE_SIZE_BYTES = 100_000; // 100KB
const ROOT_PATHS_ALLOWED = [
  'D:\\Malik\\agentic_ui\\src',
  'D:\\Malik\\agentic_api\\src',
];

@Injectable()
export class FileReaderTool {
  private isPathAllowed(filePath: string): boolean {
    const normalized = path.resolve(filePath);
    return ROOT_PATHS_ALLOWED.some((root) =>
      normalized.startsWith(path.resolve(root)),
    );
  }

  readFile(filePath: string): { content?: string; error?: string } {
    if (!this.isPathAllowed(filePath)) {
      return { error: 'Access denied: Path is outside allowed directories.' };
    }

    const ext = path.extname(filePath);
    if (!ALLOWED_EXTENSIONS.includes(ext) && !filePath.endsWith('.example')) {
      return { error: `File type '${ext}' is not allowed for reading.` };
    }

    try {
      const stats = fs.statSync(filePath);
      if (!stats.isFile()) {
        return { error: 'Path is not a file.' };
      }
      if (stats.size > MAX_FILE_SIZE_BYTES) {
        return { error: `File too large (${stats.size} bytes). Max: ${MAX_FILE_SIZE_BYTES} bytes.` };
      }
      const content = fs.readFileSync(filePath, 'utf-8');
      return { content };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `Cannot read file: ${msg}` };
    }
  }

  listDirectory(dirPath: string): { files?: string[]; error?: string } {
    if (!this.isPathAllowed(dirPath)) {
      return { error: 'Access denied: Path is outside allowed directories.' };
    }

    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });
      const files = entries.map((e) => ({
        name: e.name,
        type: e.isDirectory() ? 'directory' : 'file',
        path: path.join(dirPath, e.name),
      }));
      return { files: files.map((f) => `[${f.type}] ${f.path}`) };
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : String(err);
      return { error: `Cannot list directory: ${msg}` };
    }
  }

  listDirectoryRecursive(
    dirPath: string,
    maxDepth = 4,
  ): { structure?: string; error?: string } {
    if (!this.isPathAllowed(dirPath)) {
      return { error: 'Access denied: Path is outside allowed directories.' };
    }

    const lines: string[] = [];

    const traverse = (dir: string, depth: number, prefix: string) => {
      if (depth > maxDepth) return;
      try {
        const entries = fs.readdirSync(dir, { withFileTypes: true });
        const allowedEntries = entries.filter(
          (e) => !['node_modules', '.git', 'dist', '.next', 'build'].includes(e.name),
        );
        allowedEntries.forEach((entry, idx) => {
          const isLast = idx === allowedEntries.length - 1;
          const connector = isLast ? '└── ' : '├── ';
          lines.push(`${prefix}${connector}${entry.name}`);
          if (entry.isDirectory()) {
            traverse(
              path.join(dir, entry.name),
              depth + 1,
              prefix + (isLast ? '    ' : '│   '),
            );
          }
        });
      } catch {
        // skip unreadable
      }
    };

    lines.push(dirPath);
    traverse(dirPath, 0, '');
    return { structure: lines.join('\n') };
  }
}
