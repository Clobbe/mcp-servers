/**
 * Tests for changelog_export tool
 */

import { test, expect } from '@playwright/test';
import { changelogExport } from '../../src/tools/changelog-export.js';
import {
  createTempDir,
  cleanupTempDir,
  createTestChangelog,
  readFile,
  SAMPLE_CHANGELOG,
} from '../helpers.js';
import * as path from 'path';

test.describe('changelog_export', () => {
  test.describe('JSON export', () => {
    test('should export to JSON format', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);
      const outputPath = path.join(tempDir, 'changelog.json');

      const result = await changelogExport({
        format: 'json',
        output_path: outputPath,
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('JSON');
      expect(result.outputPath).toBe(outputPath);
      expect(result.format).toBe('json');

      // Verify output file exists and is valid JSON
      const content = await readFile(outputPath);
      const parsed = JSON.parse(content);

      expect(parsed.title).toBeDefined();
      expect(parsed.entries).toBeDefined();
      expect(Array.isArray(parsed.entries)).toBe(true);

      await cleanupTempDir(tempDir);
    });

    test('should include all changelog data in JSON', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);
      const outputPath = path.join(tempDir, 'changelog.json');

      await changelogExport({
        format: 'json',
        output_path: outputPath,
        file_path: filePath,
      });

      const content = await readFile(outputPath);
      const parsed = JSON.parse(content);

      // Should have Unreleased entry
      const unreleased = parsed.entries.find((e: any) => e.date === 'Unreleased');
      expect(unreleased).toBeDefined();
      expect(unreleased.sections).toBeDefined();

      await cleanupTempDir(tempDir);
    });
  });

  test.describe('HTML export', () => {
    test('should export to HTML format', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);
      const outputPath = path.join(tempDir, 'changelog.html');

      const result = await changelogExport({
        format: 'html',
        output_path: outputPath,
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('HTML');
      expect(result.format).toBe('html');

      // Verify output file exists and is valid HTML
      const content = await readFile(outputPath);
      expect(content).toContain('<!DOCTYPE html>');
      expect(content).toContain('<html');
      expect(content).toContain('</html>');

      await cleanupTempDir(tempDir);
    });

    test('should escape HTML special characters', async () => {
      const tempDir = await createTempDir();
      const changelogWithHTML = SAMPLE_CHANGELOG.replace(
        'New feature',
        'Feature with <script>alert("xss")</script>'
      );
      const filePath = await createTestChangelog(tempDir, changelogWithHTML);
      const outputPath = path.join(tempDir, 'changelog.html');

      await changelogExport({
        format: 'html',
        output_path: outputPath,
        file_path: filePath,
      });

      const content = await readFile(outputPath);

      // Should escape the script tag
      expect(content).toContain('&lt;script&gt;');
      expect(content).not.toContain('<script>alert');

      await cleanupTempDir(tempDir);
    });

    test('should include CSS styling in HTML', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);
      const outputPath = path.join(tempDir, 'changelog.html');

      await changelogExport({
        format: 'html',
        output_path: outputPath,
        file_path: filePath,
      });

      const content = await readFile(outputPath);
      expect(content).toContain('<style>');
      expect(content).toContain('</style>');

      await cleanupTempDir(tempDir);
    });
  });

  test.describe('text export', () => {
    test('should export to plain text format', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);
      const outputPath = path.join(tempDir, 'changelog.txt');

      const result = await changelogExport({
        format: 'text',
        output_path: outputPath,
        file_path: filePath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('TEXT'); // Summary uses uppercase
      expect(result.format).toBe('text');

      // Verify output file exists
      const content = await readFile(outputPath);
      expect(content.length).toBeGreaterThan(0);

      // Should have version markers
      expect(content).toContain('[Unreleased]');
      expect(content).toContain('[2024-01-15]');

      await cleanupTempDir(tempDir);
    });

    test('should use plain text formatting', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);
      const outputPath = path.join(tempDir, 'changelog.txt');

      await changelogExport({
        format: 'text',
        output_path: outputPath,
        file_path: filePath,
      });

      const content = await readFile(outputPath);

      // Should use bullet points
      expect(content).toContain('•');

      // Should not contain HTML or Markdown
      expect(content).not.toContain('<');
      expect(content).not.toContain('>');

      await cleanupTempDir(tempDir);
    });
  });

  test.describe('error handling', () => {
    test('should handle missing source file', async () => {
      const tempDir = await createTempDir();
      const outputPath = path.join(tempDir, 'output.json');

      const result = await changelogExport({
        format: 'json',
        output_path: outputPath,
        file_path: '/nonexistent/CHANGELOG.md',
      });

      expect(result.summary).toContain('❌');

      await cleanupTempDir(tempDir);
    });

    test('should handle invalid output path', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);

      const result = await changelogExport({
        format: 'json',
        output_path: '/invalid/path/changelog.json',
        file_path: filePath,
      });

      expect(result.summary).toContain('❌');

      await cleanupTempDir(tempDir);
    });
  });

  test.describe('edge cases', () => {
    test('should report file size in summary', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);
      const outputPath = path.join(tempDir, 'changelog.json');

      const result = await changelogExport({
        format: 'json',
        output_path: outputPath,
        file_path: filePath,
      });

      expect(result.summary).toContain('bytes');

      await cleanupTempDir(tempDir);
    });

    test('should handle different file extensions', async () => {
      const tempDir = await createTempDir();
      const filePath = await createTestChangelog(tempDir, SAMPLE_CHANGELOG);
      const outputPath = path.join(tempDir, 'output.whatever');

      const result = await changelogExport({
        format: 'json',
        output_path: outputPath,
        file_path: filePath,
      });

      // Should work regardless of extension
      expect(result.summary).toContain('✅');

      await cleanupTempDir(tempDir);
    });
  });
});
