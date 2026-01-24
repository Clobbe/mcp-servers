/**
 * Test helpers for changelog manager tests
 */

import { promises as fs } from 'fs';
import * as path from 'path';
import * as os from 'os';

/**
 * Create a temporary test directory
 */
export async function createTempDir(): Promise<string> {
  const tempDir = await fs.mkdtemp(path.join(os.tmpdir(), 'changelog-test-'));
  return tempDir;
}

/**
 * Clean up temporary directory
 */
export async function cleanupTempDir(dir: string): Promise<void> {
  try {
    await fs.rm(dir, { recursive: true, force: true });
  } catch (error) {
    // Ignore cleanup errors
  }
}

/**
 * Create a test changelog file
 */
export async function createTestChangelog(dir: string, content: string): Promise<string> {
  const filePath = path.join(dir, 'CHANGELOG.md');
  await fs.writeFile(filePath, content, 'utf-8');
  return filePath;
}

/**
 * Read a file's contents
 */
export async function readFile(filePath: string): Promise<string> {
  return await fs.readFile(filePath, 'utf-8');
}

/**
 * Sample changelog content for testing
 */
export const SAMPLE_CHANGELOG = `# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/),
and this project adheres to date-based versioning.

---

## [Unreleased]

### Added
- New feature for user authentication
- Support for custom themes

### Fixed
- Bug in login form validation

---

## [2024-01-15] - Version 1.1.0

### Added
- Dashboard analytics
- Export to PDF feature

### Changed
- Updated UI components
- Improved performance

### Fixed
- Memory leak in data processing
- Navigation bug on mobile

---

## [2024-01-10] - Version 1.0.0

### Added
- Initial release
- Basic user management
- Project creation

### Fixed
- Initial bug fixes

---
`;

/**
 * Empty changelog template
 */
export const EMPTY_CHANGELOG = `# Changelog

All notable changes to this project will be documented in this file.

---

## [Unreleased]

---
`;
