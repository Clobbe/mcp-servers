import { test, expect } from '@playwright/test';
import { detectTechnology } from '../../src/utils/tech-detector.js';

test.describe('detectTechnology', () => {
  test.describe('language detection', () => {
    test('should detect TypeScript', async () => {
      const prd = 'We will use TypeScript for type safety';
      const tech = detectTechnology(prd);
      expect(tech.languages).toContain('typescript');
    });

    test('should detect JavaScript', async () => {
      const prd = 'The project uses Node.js and JavaScript';
      const tech = detectTechnology(prd);
      expect(tech.languages).toContain('javascript');
    });

    test('should detect Python', async () => {
      const prd = 'Backend will be built with Python';
      const tech = detectTechnology(prd);
      expect(tech.languages).toContain('python');
    });

    test('should default to JavaScript when no language specified', async () => {
      const prd = 'A simple web application';
      const tech = detectTechnology(prd);
      expect(tech.languages).toContain('javascript');
    });
  });

  test.describe('framework detection', () => {
    test('should detect React', async () => {
      const prd = 'Frontend built with React';
      const tech = detectTechnology(prd);
      expect(tech.frameworks).toContain('react');
    });

    test('should detect Next.js', async () => {
      const prd = 'We will use Next.js for server-side rendering';
      const tech = detectTechnology(prd);
      expect(tech.frameworks).toContain('nextjs');
    });

    test('should return empty array when no frameworks mentioned', async () => {
      const prd = 'A vanilla JavaScript project';
      const tech = detectTechnology(prd);
      expect(tech.frameworks).toHaveLength(0);
    });
  });

  test.describe('database detection', () => {
    test('should detect PostgreSQL', async () => {
      const prd = 'Data stored in PostgreSQL database';
      const tech = detectTechnology(prd);
      expect(tech.databases).toContain('postgresql');
    });

    test('should detect MongoDB', async () => {
      const prd = 'We use MongoDB for document storage';
      const tech = detectTechnology(prd);
      expect(tech.databases).toContain('mongodb');
    });
  });

  test.describe('case insensitivity', () => {
    test('should detect technologies regardless of case', async () => {
      const prd = 'Using TYPESCRIPT, React, POSTGRESQL, and Docker';
      const tech = detectTechnology(prd);
      expect(tech.languages).toContain('typescript');
      expect(tech.frameworks).toContain('react');
      expect(tech.databases).toContain('postgresql');
      expect(tech.infrastructure).toContain('docker');
    });
  });
});
