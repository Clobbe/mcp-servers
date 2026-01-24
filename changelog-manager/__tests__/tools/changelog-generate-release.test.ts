/**
 * Tests for changelog_generate_release tool
 */

import { test, expect } from '@playwright/test';
import { changelogGenerateRelease } from '../../src/tools/changelog-generate-release.js';
import {
  createTempDir,
  cleanupTempDir,
  createTestChangelog,
  readFile,
  SAMPLE_CHANGELOG,
  EMPTY_CHANGELOG,
} from '../helpers.js';

test.describe('changelog_generate_release', () => {
  test.describe('happy path', () => {
    test('should generate release from Unreleased section', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogGenerateRelease({
        version: '1.2.0',
        date: '2024-01-20',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('1.2.0');
      expect(result.version).toBe('1.2.0');
      expect(result.date).toBe('2024-01-20');
      expect(result.entriesCount).toBeGreaterThan(0);

      // Verify the file was updated
      const content = await readFile(filePath);
      expect(content).toContain('[2024-01-20]');
      expect(content).toContain('Version 1.2.0');
      expect(content).toContain('## [Unreleased]');

      // Should have moved the entries
      const lines = content.split('\n');
      const unreleasedIndex = lines.findIndex((l) => l.includes('[Unreleased]'));
      const releaseIndex = lines.findIndex((l) => l.includes('[2024-01-20]'));

      // Unreleased should come before the new release
      expect(unreleasedIndex).toBeLessThan(releaseIndex);

      await cleanupTempDir(tempDir);
    });

    test('should use today as default date', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogGenerateRelease({
        version: '1.2.0',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');

      // Date should be in YYYY-MM-DD format
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      await cleanupTempDir(tempDir);
    });

    test('should accept "today" as date parameter', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogGenerateRelease({
        version: '2.0.0',
        date: 'today',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);

      await cleanupTempDir(tempDir);
    });
  });

  test.describe('error handling', () => {
    test('should reject invalid version format', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogGenerateRelease({
        version: 'invalid',
        file_path: filePath,
      });

      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('Invalid version format');

      await cleanupTempDir(tempDir);
    });

    test('should reject invalid date format', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogGenerateRelease({
        version: '1.0.0',
        date: 'invalid-date',
        file_path: filePath,
      });

      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('Invalid date format');

      await cleanupTempDir(tempDir);
    });

    test('should reject when Unreleased section is empty', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, EMPTY_CHANGELOG);

      const result = await changelogGenerateRelease({
        version: '1.0.0',
        file_path: filePath,
      });

      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('empty');

      await cleanupTempDir(tempDir);
    });

    test('should handle missing file', async () => {
      const result = await changelogGenerateRelease({
        version: '1.0.0',
        file_path: '/nonexistent/CHANGELOG.md',
      });

      expect(result.summary).toContain('❌');

      await cleanupTempDir(await createTempDir());
    });
  });

  test.describe('edge cases', () => {
    test('should handle version with patch number', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogGenerateRelease({
        version: '1.2.3',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.version).toBe('1.2.3');

      await cleanupTempDir(tempDir);
    });

    test('should create new empty Unreleased section', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      await changelogGenerateRelease({
        version: '1.2.0',
        file_path: filePath,
      });

      const content = await readFile(filePath);

      // Should have Unreleased section at the top
      const lines = content.split('\n');
      const unreleasedLine = lines.find((l) => l.includes('[Unreleased]'));
      expect(unreleasedLine).toBeDefined();

      await cleanupTempDir(tempDir);
    });
  });
});
