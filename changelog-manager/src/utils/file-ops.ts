// File operations for changelog management
import * as fs from 'fs/promises';
import * as path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);

/**
 * Locate CHANGELOG.md in common locations
 */
export async function locateChangelog(cwd: string = process.cwd()): Promise<string | null> {
  const possibleLocations = [
    path.join(cwd, 'CHANGELOG.md'),
    path.join(cwd, '.claude', 'CHANGELOG.md'),
    path.join(cwd, 'docs', 'CHANGELOG.md'),
  ];

  for (const location of possibleLocations) {
    try {
      await fs.access(location);
      return location;
    } catch {
      // Continue to next location
    }
  }

  return null;
}

/**
 * Resolve symlink to get real file path
 */
export async function resolveSymlink(filePath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(`readlink -f "${filePath}" 2>/dev/null || realpath "${filePath}" 2>/dev/null`);
    const resolved = stdout.trim();
    return resolved || filePath;
  } catch {
    return filePath;
  }
}

/**
 * Check if a file is a symlink
 */
export async function isSymlink(filePath: string): Promise<boolean> {
  try {
    const stats = await fs.lstat(filePath);
    return stats.isSymbolicLink();
  } catch {
    return false;
  }
}

/**
 * Read changelog file, following symlinks
 */
export async function readChangelog(filePath: string): Promise<string> {
  try {
    const realPath = await resolveSymlink(filePath);
    const content = await fs.readFile(realPath, 'utf-8');
    return content;
  } catch (error) {
    throw new Error(`Failed to read changelog: ${error}`);
  }
}

/**
 * Write changelog file, following symlinks
 */
export async function writeChangelog(filePath: string, content: string): Promise<void> {
  try {
    const realPath = await resolveSymlink(filePath);
    await fs.writeFile(realPath, content, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to write changelog: ${error}`);
  }
}

/**
 * Create a new changelog file
 */
export async function createChangelog(filePath: string, initialContent: string): Promise<void> {
  try {
    // Ensure directory exists
    const dir = path.dirname(filePath);
    await fs.mkdir(dir, { recursive: true });
    
    // Write file
    await fs.writeFile(filePath, initialContent, 'utf-8');
  } catch (error) {
    throw new Error(`Failed to create changelog: ${error}`);
  }
}

/**
 * Create a symlink
 */
export async function createSymlink(target: string, linkPath: string): Promise<void> {
  try {
    // Ensure target directory exists
    const targetDir = path.dirname(target);
    await fs.mkdir(targetDir, { recursive: true });
    
    // Create symlink
    await fs.symlink(target, linkPath);
  } catch (error) {
    throw new Error(`Failed to create symlink: ${error}`);
  }
}

/**
 * Get file modification time
 */
export async function getFileModTime(filePath: string): Promise<Date> {
  try {
    const stats = await fs.stat(filePath);
    return stats.mtime;
  } catch (error) {
    throw new Error(`Failed to get file modification time: ${error}`);
  }
}
