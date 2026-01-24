import fs from 'fs/promises';
import type { FileOperationResult } from '../types/common.js';

/**
 * Read file with error handling
 */
export async function readFile(filePath: string): Promise<FileOperationResult> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    return { success: true, path: filePath, content };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Write file with error handling
 */
export async function writeFile(
  filePath: string,
  content: string
): Promise<FileOperationResult> {
  try {
    await fs.writeFile(filePath, content, 'utf-8');
    return { success: true, path: filePath };
  } catch (error) {
    return {
      success: false,
      path: filePath,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Check if file exists
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
 * Resolve symlinks to real path
 */
export async function resolveRealPath(filePath: string): Promise<string> {
  try {
    return await fs.realpath(filePath);
  } catch {
    return filePath;
  }
}
