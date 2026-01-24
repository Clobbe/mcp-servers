/**
 * Tests for changelog_search tool
 */

import { test, expect, describe } from '@playwright/test';
import { changelogSearch } from '../../src/tools/changelog-search.js';
import {
  createTempDir,
  cleanupTempDir,
  createTestChangelog,
  SAMPLE_CHANGELOG,
} from '../helpers.js';

describe('changelog_search', () => {
  describe('happy path', () => {
    test('should search and find matching entries', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: 'authentication',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('Found');
      expect(result.totalMatches).toBeGreaterThan(0);
      expect(result.matches.length).toBeGreaterThan(0);

      await cleanupTempDir(tempDir);
    });

    test('should be case-insensitive', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: 'AUTHENTICATION',
        file_path: filePath,
      });

      expect(result.totalMatches).toBeGreaterThan(0);

      await cleanupTempDir(tempDir);
    });

    test('should filter by category', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: 'bug',
        category: 'Fixed',
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('Fixed');

      // All matches should be in Fixed category
      for (const match of result.matches) {
        expect(match.category).toBe('Fixed');
      }

      await cleanupTempDir(tempDir);
    });

    test('should filter by version', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: 'feature',
        version: 'Unreleased',
        file_path: filePath,
      });

      // All matches should be from Unreleased
      for (const match of result.matches) {
        expect(match.version).toBe('Unreleased');
      }

      await cleanupTempDir(tempDir);
    });

    test('should filter by both category and version', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: 'bug',
        category: 'Fixed',
        version: '2024-01-15',
        file_path: filePath,
      });

      // All matches should match both filters
      for (const match of result.matches) {
        expect(match.category).toBe('Fixed');
        expect(match.version).toBe('2024-01-15');
      }

      await cleanupTempDir(tempDir);
    });
  });

  describe('error handling', () => {
    test('should handle empty query', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: '',
        file_path: filePath,
      });

      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('empty');

      await cleanupTempDir(tempDir);
    });

    test('should handle no matches', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: 'xyznonexistent',
        file_path: filePath,
      });

      expect(result.summary).toContain('No matches found');
      expect(result.totalMatches).toBe(0);
      expect(result.matches.length).toBe(0);

      await cleanupTempDir(tempDir);
    });

    test('should handle missing file', async () => {
      const result = await changelogSearch({
        query: 'test',
        file_path: '/nonexistent/CHANGELOG.md',
      });

      expect(result.summary).toContain('❌');
    });
  });

  describe('edge cases', () => {
    test('should handle partial word matches', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: 'auth',
        file_path: filePath,
      });

      // Should match "authentication"
      expect(result.totalMatches).toBeGreaterThan(0);

      await cleanupTempDir(tempDir);
    });

    test('should group results by version and category', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogSearch({
        query: 'feature',
        file_path: filePath,
      });

      expect(result.summary).toContain('##'); // Version headers
      expect(result.summary).toContain('###'); // Category headers

      await cleanupTempDir(tempDir);
    });

    test('should handle special regex characters in query', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      // Query with special characters shouldn't break
      const result = await changelogSearch({
        query: 'user.',
        file_path: filePath,
      });

      // Should not throw error
      expect(result.summary).toBeDefined();

      await cleanupTempDir(tempDir);
    });
  });
});
