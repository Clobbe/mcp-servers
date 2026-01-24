/**
 * Tests for changelog_diff tool
 */

import { test, expect } from '@playwright/test';
import { changelogDiff } from '../../src/tools/changelog-diff.js';
import {
  createTempDir,
  cleanupTempDir,
  createTestChangelog,
  SAMPLE_CHANGELOG,
} from '../helpers.js';

test.describe('changelog_diff', () => {
  test.describe('happy path', () => {
    test('should compare two versions successfully', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogDiff({
        version1: '2024-01-15',
        version2: '2024-01-10',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('2024-01-15');
      expect(result.summary).toContain('2024-01-10');
      expect(result.version1).toBe('2024-01-15');
      expect(result.version2).toBe('2024-01-10');
      expect(result.differences).toBeDefined();

      await cleanupTempDir(tempDir);
    });

    test('should show common and unique items', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogDiff({
        version1: '2024-01-15',
        version2: '2024-01-10',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      // Should show total items
      expect(result.summary).toMatch(/\d+ total items/);

      await cleanupTempDir(tempDir);
    });

    test('should compare Unreleased with a version', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogDiff({
        version1: 'Unreleased',
        version2: '2024-01-15',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('Unreleased');
      expect(result.version1).toBe('Unreleased');

      await cleanupTempDir(tempDir);
    });
  });

  test.describe('error handling', () => {
    test('should handle missing first version', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogDiff({
        version1: '2099-12-31',
        version2: '2024-01-10',
        file_path: filePath,
      });

      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('not found');

      await cleanupTempDir(tempDir);
    });

    test('should handle missing second version', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogDiff({
        version1: '2024-01-15',
        version2: '2099-12-31',
        file_path: filePath,
      });

      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('not found');

      await cleanupTempDir(tempDir);
    });

    test('should handle missing file', async () => {
      const result = await changelogDiff({
        version1: '2024-01-15',
        version2: '2024-01-10',
        file_path: '/nonexistent/CHANGELOG.md',
      });

      expect(result.summary).toContain('❌');
    });
  });

  test.describe('edge cases', () => {
    test('should handle comparing version with itself', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogDiff({
        version1: '2024-01-15',
        version2: '2024-01-15',
        file_path: filePath,
      });

      // Comparing same version should show no differences or all common
      expect(result.summary).toContain('✅');

      await cleanupTempDir(tempDir);
    });

    test('should show section breakdown', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogDiff({
        version1: '2024-01-15',
        version2: '2024-01-10',
        file_path: filePath,
      });

      // Should include section information
      expect(result.differences.length).toBeGreaterThan(0);

      await cleanupTempDir(tempDir);
    });
  });
});
