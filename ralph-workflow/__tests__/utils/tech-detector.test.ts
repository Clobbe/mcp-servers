import { test, expect, describe } from '@playwright/test';
import { detectTechnology } from '../../src/utils/tech-detector.js';

describe('detectTechnology', () => {
  describe('language detection', () => {
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

  describe('framework detection', () => {
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

    test('should detect Express', async () => {
      const prd = 'API server using Express framework';
      const tech = detectTechnology(prd);
      expect(tech.frameworks).toContain('express');
    });

    test('should return empty array when no frameworks mentioned', async () => {
      const prd = 'A vanilla JavaScript project';
      const tech = detectTechnology(prd);
      expect(tech.frameworks).toHaveLength(0);
    });
  });

  describe('database detection', () => {
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

    test('should detect Redis', async () => {
      const prd = 'Caching layer with Redis';
      const tech = detectTechnology(prd);
      expect(tech.databases).toContain('redis');
    });
  });

  describe('infrastructure detection', () => {
    test('should detect Docker', async () => {
      const prd = 'Containerized with Docker';
      const tech = detectTechnology(prd);
      expect(tech.infrastructure).toContain('docker');
    });

    test('should detect AWS', async () => {
      const prd = 'Deployed on AWS cloud';
      const tech = detectTechnology(prd);
      expect(tech.infrastructure).toContain('aws');
    });

    test('should detect Vercel', async () => {
      const prd = 'Hosted on Vercel platform';
      const tech = detectTechnology(prd);
      expect(tech.infrastructure).toContain('vercel');
    });
  });

  describe('tools detection', () => {
    test('should detect Git', async () => {
      const prd = 'Version control with Git';
      const tech = detectTechnology(prd);
      expect(tech.tools).toContain('git');
    });

    test('should detect Playwright', async () => {
      const prd = 'Testing with Playwright';
      const tech = detectTechnology(prd);
      expect(tech.tools).toContain('playwright');
    });

    test('should detect ESLint and Prettier', async () => {
      const prd = 'Code quality enforced with ESLint and Prettier';
      const tech = detectTechnology(prd);
      expect(tech.tools).toContain('eslint');
      expect(tech.tools).toContain('prettier');
    });
  });

  describe('case insensitivity', () => {
    test('should detect technologies regardless of case', async () => {
      const prd = 'Using TYPESCRIPT, React, POSTGRESQL, and Docker';
      const tech = detectTechnology(prd);
      expect(tech.languages).toContain('typescript');
      expect(tech.frameworks).toContain('react');
      expect(tech.databases).toContain('postgresql');
      expect(tech.infrastructure).toContain('docker');
    });
  });

  describe('multiple technologies', () => {
    test('should detect multiple technologies from complex PRD', async () => {
      const prd = `
        # E-commerce Platform
        
        Built with TypeScript and Node.js using Next.js framework.
        PostgreSQL for relational data, Redis for caching.
        Deployed on AWS with Docker containers.
        Testing with Playwright, code quality with ESLint and Prettier.
        Version control with Git and GitHub.
      `;
      const tech = detectTechnology(prd);

      expect(tech.languages).toContain('typescript');
      expect(tech.languages).toContain('javascript');
      expect(tech.frameworks).toContain('nextjs');
      expect(tech.databases).toContain('postgresql');
      expect(tech.databases).toContain('redis');
      expect(tech.infrastructure).toContain('aws');
      expect(tech.infrastructure).toContain('docker');
      expect(tech.tools).toContain('playwright');
      expect(tech.tools).toContain('eslint');
      expect(tech.tools).toContain('prettier');
      expect(tech.tools).toContain('git');
      expect(tech.tools).toContain('github');
    });
  });
});
