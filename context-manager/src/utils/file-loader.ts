/**
 * File loading utilities for context management
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import type { ContextFile } from './types.js';

/**
 * Load a file and create a context file entry
 */
export async function loadFile(filePath: string): Promise<ContextFile> {
  const content = await fs.readFile(filePath, 'utf-8');
  const stats = await fs.stat(filePath);
  const ext = path.extname(filePath).toLowerCase();

  const language = getLanguageFromExtension(ext);

  return {
    path: filePath,
    content,
    language,
    size: stats.size,
  };
}

/**
 * Determine language from file extension
 */
function getLanguageFromExtension(ext: string): string {
  const languageMap: Record<string, string> = {
    '.ts': 'typescript',
    '.tsx': 'typescript',
    '.js': 'javascript',
    '.jsx': 'javascript',
    '.py': 'python',
    '.java': 'java',
    '.cpp': 'cpp',
    '.c': 'c',
    '.h': 'c',
    '.hpp': 'cpp',
    '.cs': 'csharp',
    '.go': 'go',
    '.rs': 'rust',
    '.rb': 'ruby',
    '.php': 'php',
    '.swift': 'swift',
    '.kt': 'kotlin',
    '.scala': 'scala',
    '.md': 'markdown',
    '.json': 'json',
    '.xml': 'xml',
    '.yaml': 'yaml',
    '.yml': 'yaml',
    '.html': 'html',
    '.css': 'css',
    '.scss': 'scss',
    '.sql': 'sql',
    '.sh': 'shell',
    '.bash': 'shell',
    '.zsh': 'shell',
  };

  return languageMap[ext] || 'text';
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get file stats
 */
export async function getFileStats(filePath: string): Promise<{
  size: number;
  lines: number;
}> {
  const content = await fs.readFile(filePath, 'utf-8');
  const lines = content.split('\n').length;
  const stats = await fs.stat(filePath);

  return {
    size: stats.size,
    lines,
  };
}
