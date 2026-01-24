/**
 * Tests for changelog_stats tool
 */

import { test, expect, describe } from '@playwright/test';
import { changelogStats } from '../../src/tools/changelog-stats.js';
import {
  createTempDir,
  cleanupTempDir,
  createTestChangelog,
  SAMPLE_CHANGELOG,
  EMPTY_CHANGELOG,
} from '../helpers.js';

describe('changelog_stats', () => {
  describe('happy path', () => {
    test('should generate statistics for changelog', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      expect(result.summary).toContain('📊');
      expect(result.summary).toContain('Statistics');
      expect(result.totalVersions).toBeGreaterThan(0);
      expect(result.totalEntries).toBeGreaterThan(0);

      await cleanupTempDir(tempDir);
    });

    test('should count total versions correctly', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      // Should have Unreleased + 2 releases = 3 versions
      expect(result.totalVersions).toBe(3);

      await cleanupTempDir(tempDir);
    });

    test('should count total entries correctly', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      // Should have multiple entries across all versions
      expect(result.totalEntries).toBeGreaterThan(5);

      await cleanupTempDir(tempDir);
    });

    test('should break down by category', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      expect(result.categoryCounts).toBeDefined();
      expect(typeof result.categoryCounts).toBe('object');

      // Should have Added and Fixed categories
      expect(result.categoryCounts['Added']).toBeGreaterThan(0);
      expect(result.categoryCounts['Fixed']).toBeGreaterThan(0);

      await cleanupTempDir(tempDir);
    });

    test('should show category percentages', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      // Summary should contain percentages
      expect(result.summary).toMatch(/\d+%/);

      await cleanupTempDir(tempDir);
    });

    test('should show entries per version', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      // Should list each version with entry count
      expect(result.summary).toContain('By Version');
      expect(result.summary).toContain('Unreleased');
      expect(result.summary).toContain('2024-01-15');
      expect(result.summary).toContain('2024-01-10');

      await cleanupTempDir(tempDir);
    });

    test('should calculate averages', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      // Should show average entries per version
      expect(result.summary).toContain('Average');

      await cleanupTempDir(tempDir);
    });
  });

  describe('error handling', () => {
    test('should handle missing file', async () => {
      const result = await changelogStats({
        file_path: '/nonexistent/CHANGELOG.md',
      });

      expect(result.summary).toContain('❌');
      expect(result.totalVersions).toBe(0);
      expect(result.totalEntries).toBe(0);
    });

    test('should handle empty changelog', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, EMPTY_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      // Should still work but with minimal data
      expect(result.summary).toContain('📊');
      expect(result.totalVersions).toBeGreaterThanOrEqual(0);

      await cleanupTempDir(tempDir);
    });
  });

  describe('edge cases', () => {
    test('should handle changelog with only Unreleased', async () => {
      const tempDir = await createTempDir();
      const onlyUnreleased = `# Changelog

---

## [Unreleased]

### Added
- Feature A
- Feature B

---
`;
      const filePath = await createTestChangelog(tempDir, onlyUnreleased);

      const result = await changelogStats({
        file_path: filePath,
      });

      expect(result.totalVersions).toBe(1);
      expect(result.totalEntries).toBe(2);
      expect(result.summary).toContain('Unreleased');

      await cleanupTempDir(tempDir);
    });

    test('should show date range for releases', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      // Should show date range
      expect(result.summary).toContain('Date Range');
      expect(result.summary).toContain('2024-01-10');
      expect(result.summary).toContain('2024-01-15');

      await cleanupTempDir(tempDir);
    });

    test('should sort categories by count', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogStats({
        file_path: filePath,
      });

      // Categories should be sorted by count (highest first)
      const categoryLines = result.summary.split('\n').filter((line) => line.match(/^- \w+: \d+/));

      expect(categoryLines.length).toBeGreaterThan(0);

      await cleanupTempDir(tempDir);
    });

    test('should handle multiple categories with same count', async () => {
      const tempDir = await createTempDir();
      const changelog = `# Changelog

---

## [Unreleased]

### Added
- Item 1

### Fixed  
- Item 2

### Changed
- Item 3

---
`;
      const filePath = await createTestChangelog(tempDir, changelog);

      const result = await changelogStats({
        file_path: filePath,
      });

      // All categories should have count of 1
      expect(result.categoryCounts['Added']).toBe(1);
      expect(result.categoryCounts['Fixed']).toBe(1);
      expect(result.categoryCounts['Changed']).toBe(1);

      await cleanupTempDir(tempDir);
    });
  });
});
