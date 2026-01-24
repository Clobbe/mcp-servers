/**
 * Bundle management utilities
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';
import type { ContextBundle, ContextFile, ContextBundleMetadata } from './types.js';

const BUNDLES_DIR = path.join(os.homedir(), '.mcp-context-bundles');

/**
 * Ensure bundles directory exists
 */
async function ensureBundlesDir(): Promise<void> {
  try {
    await fs.mkdir(BUNDLES_DIR, { recursive: true });
  } catch (error) {
    // Ignore if already exists
  }
}

/**
 * Get bundle file path
 */
function getBundlePath(bundleName: string): string {
  return path.join(BUNDLES_DIR, `${bundleName}.json`);
}

/**
 * Create a new empty bundle
 */
export async function createBundle(name: string, description: string = ''): Promise<ContextBundle> {
  await ensureBundlesDir();

  const bundle: ContextBundle = {
    name,
    description,
    files: [],
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      totalSize: 0,
      fileCount: 0,
    },
  };

  await saveBundle(bundle);
  return bundle;
}

/**
 * Save bundle to disk
 */
export async function saveBundle(bundle: ContextBundle): Promise<void> {
  await ensureBundlesDir();

  // Update metadata
  bundle.metadata.modified = new Date().toISOString();
  bundle.metadata.fileCount = bundle.files.length;
  bundle.metadata.totalSize = bundle.files.reduce((sum, f) => sum + f.size, 0);

  const bundlePath = getBundlePath(bundle.name);
  await fs.writeFile(bundlePath, JSON.stringify(bundle, null, 2), 'utf-8');
}

/**
 * Load bundle from disk
 */
export async function loadBundle(bundleName: string): Promise<ContextBundle> {
  await ensureBundlesDir();

  const bundlePath = getBundlePath(bundleName);
  const content = await fs.readFile(bundlePath, 'utf-8');
  return JSON.parse(content) as ContextBundle;
}

/**
 * Check if bundle exists
 */
export async function bundleExists(bundleName: string): Promise<boolean> {
  await ensureBundlesDir();

  const bundlePath = getBundlePath(bundleName);
  try {
    await fs.access(bundlePath);
    return true;
  } catch {
    return false;
  }
}

/**
 * List all bundles
 */
export async function listBundles(): Promise<string[]> {
  await ensureBundlesDir();

  try {
    const files = await fs.readdir(BUNDLES_DIR);
    return files.filter((f) => f.endsWith('.json')).map((f) => f.replace('.json', ''));
  } catch {
    return [];
  }
}

/**
 * Delete a bundle
 */
export async function deleteBundle(bundleName: string): Promise<void> {
  await ensureBundlesDir();

  const bundlePath = getBundlePath(bundleName);
  await fs.unlink(bundlePath);
}

/**
 * Add file to bundle
 */
export async function addFileToBundle(
  bundleName: string,
  file: ContextFile
): Promise<ContextBundle> {
  const bundle = await loadBundle(bundleName);

  // Remove existing file with same path if it exists
  bundle.files = bundle.files.filter((f) => f.path !== file.path);

  // Add new file
  bundle.files.push(file);

  await saveBundle(bundle);
  return bundle;
}

/**
 * Remove file from bundle
 */
export async function removeFileFromBundle(
  bundleName: string,
  filePath: string
): Promise<ContextBundle> {
  const bundle = await loadBundle(bundleName);

  bundle.files = bundle.files.filter((f) => f.path !== filePath);

  await saveBundle(bundle);
  return bundle;
}

/**
 * Merge multiple bundles
 */
export async function mergeBundles(
  bundleNames: string[],
  outputName: string,
  description: string = 'Merged bundle'
): Promise<ContextBundle> {
  const mergedFiles: ContextFile[] = [];
  const seenPaths = new Set<string>();

  for (const bundleName of bundleNames) {
    const bundle = await loadBundle(bundleName);

    for (const file of bundle.files) {
      if (!seenPaths.has(file.path)) {
        mergedFiles.push(file);
        seenPaths.add(file.path);
      }
    }
  }

  const mergedBundle: ContextBundle = {
    name: outputName,
    description,
    files: mergedFiles,
    metadata: {
      created: new Date().toISOString(),
      modified: new Date().toISOString(),
      totalSize: mergedFiles.reduce((sum, f) => sum + f.size, 0),
      fileCount: mergedFiles.length,
    },
  };

  await saveBundle(mergedBundle);
  return mergedBundle;
}
