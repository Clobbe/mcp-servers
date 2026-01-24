import { test, expect } from '@playwright/test';
import { handlePRDValidate } from '../../src/tools/prd-validate.js';

test.describe('prd_validate tool', () => {
  const validPRD = `# Test Project

## Description

A comprehensive test project.

## Features

- **Feature 1**: First feature (high priority)
- **Feature 2**: Second feature (medium priority)

## Requirements

- Must be secure (must)
- Should be fast (should)

## Technical Details

Built with TypeScript and React.
PostgreSQL database.
`;

  test('should validate a valid PRD (markdown output)', async () => {
    const input = {
      prd_content: validPRD,
      output_format: 'markdown' as const,
    };

    const result = await handlePRDValidate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(true);
    expect(response.format).toBe('markdown');
    expect(response.content).toContain('# PRD Validation Report');
    expect(response.content).toContain('✅');
    expect(response.validation.isValid).toBe(true);
    expect(response.validation.score).toBeGreaterThan(80);
  });

  test('should validate PRD with JSON output', async () => {
    const input = {
      prd_content: validPRD,
      output_format: 'json' as const,
    };

    const result = await handlePRDValidate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(true);
    expect(response.format).toBe('json');
    const content = JSON.parse(response.content);
    expect(content.validation.isValid).toBe(true);
  });

  test('should detect missing title', async () => {
    const prd = `## Description\nNo title here`;

    const result = await handlePRDValidate({ prd_content: prd });
    const response = JSON.parse(result.content[0].text);

    expect(response.validation.isValid).toBe(false);
    const hasError = response.validation.issues.some(
      (i: { severity: string; message: string }) =>
        i.severity === 'error' && i.message.includes('title')
    );
    expect(hasError).toBe(true);
  });

  test('should detect missing features', async () => {
    const prd = `# Test\n\n## Description\nTest`;

    const result = await handlePRDValidate({ prd_content: prd });
    const response = JSON.parse(result.content[0].text);

    expect(response.validation.isValid).toBe(false);
    expect(response.validation.statistics.featureCount).toBe(0);
  });

  test('should return error for empty prd_content', async () => {
    const input = { prd_content: '' };

    const result = await handlePRDValidate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(false);
    expect(response.error).toContain('prd_content is required');
  });

  test('should check ralph-workflow compatibility', async () => {
    const result = await handlePRDValidate({ prd_content: validPRD, check_compatibility: true });
    const response = JSON.parse(result.content[0].text);

    expect(response.validation.compatibility.ralphWorkflow).toBe(true);
    expect(response.validation.compatibility.parsedSuccessfully).toBe(true);
    expect(response.validation.compatibility.detectedTechnologies.length).toBeGreaterThan(0);
  });
});
