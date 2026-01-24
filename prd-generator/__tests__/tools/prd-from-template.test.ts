import { test, expect } from '@playwright/test';
import { handlePRDFromTemplate } from '../../src/tools/prd-from-template.js';

test.describe('prd_from_template tool', () => {
  test('should create PRD from web-app template', async () => {
    const input = {
      template: 'web-app' as const,
      projectName: 'MyWebApp',
    };

    const result = await handlePRDFromTemplate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(true);
    expect(response.content).toContain('# MyWebApp');
    expect(response.content).toContain('User Authentication');
    expect(response.content).toContain('Responsive Design');
  });

  test('should create PRD from api-service template', async () => {
    const input = {
      template: 'api-service' as const,
      projectName: 'MyAPI',
    };

    const result = await handlePRDFromTemplate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(true);
    expect(response.content).toContain('# MyAPI');
    expect(response.content).toContain('RESTful Endpoints');
  });

  test('should support JSON output format', async () => {
    const input = {
      template: 'library' as const,
      projectName: 'MyLib',
      output_format: 'json' as const,
    };

    const result = await handlePRDFromTemplate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(true);
    expect(response.format).toBe('json');
    const content = JSON.parse(response.content);
    expect(content.title).toBe('MyLib');
  });

  test('should return error for missing projectName', async () => {
    const input = {
      template: 'web-app' as const,
    };

    const result = await handlePRDFromTemplate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(false);
    expect(response.error).toContain('projectName is required');
  });

  test('should return error for invalid template', async () => {
    const input = {
      template: 'invalid-template',
      projectName: 'Test',
    };

    const result = await handlePRDFromTemplate(input);
    const response = JSON.parse(result.content[0].text);

    expect(response.success).toBe(false);
    expect(response.error).toContain('invalid template');
  });
});
