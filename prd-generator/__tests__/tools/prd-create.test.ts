import { test, expect } from '@playwright/test';
import { handlePRDCreate } from '../../src/tools/prd-create.js';

test.describe('prd_create tool', () => {
  test('should create PRD with all fields (markdown)', async () => {
    const input = {
      title: 'Test Project',
      description: 'A test project description',
      features: [
        { name: 'Feature 1', description: 'First feature', priority: 'high' as const },
        { name: 'Feature 2', description: 'Second feature', priority: 'medium' as const },
      ],
      requirements: [{ description: 'Must be secure', priority: 'must' as const }],
      technicalDetails: {
        languages: ['TypeScript'],
        frameworks: ['React'],
      },
      output_format: 'markdown' as const,
    };

    const result = await handlePRDCreate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(true);
    expect(response.format).toBe('markdown');
    expect(response.content).toContain('# Test Project');
    expect(response.content).toContain('Feature 1');
    expect(response.content).toContain('Must be secure');
    expect(response.metadata?.featureCount).toBe(2);
  });

  test('should create PRD in JSON format', async () => {
    const input = {
      title: 'Test Project',
      description: 'A test project',
      features: [{ name: 'Feature 1', description: 'Test feature' }],
      output_format: 'json' as const,
    };

    const result = await handlePRDCreate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(true);
    expect(response.format).toBe('json');
    const content = JSON.parse(response.content);
    expect(content.title).toBe('Test Project');
    expect(content.features).toHaveLength(1);
  });

  test('should return error for missing title', async () => {
    const input = {
      description: 'A test project',
      features: [{ name: 'Feature 1', description: 'Test feature' }],
    };

    const result = await handlePRDCreate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(false);
    expect(response.error).toContain('title is required');
    expect(response.field).toBe('title');
  });

  test('should return error for empty features', async () => {
    const input = {
      title: 'Test',
      description: 'Test',
      features: [],
    };

    const result = await handlePRDCreate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(false);
    expect(response.error).toContain('at least one feature is required');
  });

  test('should return error for invalid priority', async () => {
    const input = {
      title: 'Test',
      description: 'Test',
      features: [{ name: 'Feature', description: 'Test', priority: 'invalid' }],
    };

    const result = await handlePRDCreate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(false);
    expect(response.error).toContain('invalid priority');
  });
});
