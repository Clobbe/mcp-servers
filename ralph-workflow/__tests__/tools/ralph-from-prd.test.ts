import { test, expect, describe } from '@playwright/test';
import { ralphFromPrd } from '../../src/tools/ralph-from-prd.js';

describe('ralphFromPrd', () => {
  const samplePRD = `
# E-Commerce Platform

## Description

A modern e-commerce platform for online shopping.

## Features

- **Product Catalog**: Browse and search products
- **Shopping Cart**: Add items and checkout (must have)
- **User Accounts**: Registration and login

## Requirements

- Must support high traffic
- Secure payment processing
- RESTful API for mobile apps

## Technical Details

Built with TypeScript and React.
PostgreSQL database.
Deployed on AWS.
  `;

  describe('successful workflow generation', () => {
    test('should generate workflow from valid PRD', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('E-Commerce Platform');
      expect(result.data).toBeDefined();
    });

    test('should include metadata in result', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      expect(result.data).toHaveProperty('metadata');
      const data = result.data as any;
      expect(data.metadata.projectName).toBe('E-Commerce Platform');
      expect(data.metadata.technologyStack).toBeDefined();
    });

    test('should count phases correctly', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      expect(result.summary).toMatch(/\d+ phases/);
    });
  });

  describe('output formats', () => {
    test('should generate JSON format when requested', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      expect(result.data).toHaveProperty('workflow');
      const data = result.data as any;
      expect(() => JSON.parse(data.workflow)).not.toThrow();
    });

    test('should generate markdown format by default', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
      });

      expect(result.data).toHaveProperty('workflow');
      const data = result.data as any;
      expect(data.workflow).toContain('# E-Commerce Platform');
      expect(data.workflow).toContain('## Technology Stack');
      expect(data.workflow).toContain('## Project Setup');
    });

    test('should include technology stack in markdown', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'markdown',
      });

      const data = result.data as any;
      expect(data.workflow).toContain('TypeScript');
      expect(data.workflow).toContain('React');
      expect(data.workflow).toContain('PostgreSQL');
      expect(data.workflow).toContain('AWS');
    });

    test('should include phases in markdown', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'markdown',
      });

      const data = result.data as any;
      expect(data.workflow).toContain('## Project Setup');
      expect(data.workflow).toContain('## Core Features');
      expect(data.workflow).toContain('## Testing & QA');
      expect(data.workflow).toContain('## Deployment');
    });

    test('should include task details in markdown', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'markdown',
      });

      const data = result.data as any;
      expect(data.workflow).toContain('### ');
      expect(data.workflow).toContain('**Time**:');
      expect(data.workflow).toContain('**Commands**:');
    });
  });

  describe('PRD parsing integration', () => {
    test('should extract project title', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      const data = result.data as any;
      expect(data.metadata.projectName).toBe('E-Commerce Platform');
    });

    test('should detect technologies from PRD', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      const data = result.data as any;
      const tech = data.metadata.technologyStack;

      expect(tech.languages).toContain('typescript');
      expect(tech.frameworks).toContain('react');
      expect(tech.databases).toContain('postgresql');
      expect(tech.infrastructure).toContain('aws');
    });

    test('should identify features from PRD', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      const data = result.data as any;
      const workflow = JSON.parse(data.workflow);

      const implementationPhases = workflow.phases.filter((p: any) => p.name.includes('Features'));

      expect(implementationPhases.length).toBeGreaterThan(0);
    });
  });

  describe('error handling', () => {
    test('should handle empty PRD', async () => {
      const result = await ralphFromPrd({
        prd_content: '',
      });

      expect(result.summary).toBeDefined();
      expect(result.data).toBeDefined();
    });

    test('should handle PRD with minimal content', async () => {
      const minimalPRD = '# Project\n\nSome text';
      const result = await ralphFromPrd({
        prd_content: minimalPRD,
      });

      expect(result.summary).toContain('✅');
      expect(result.data).toBeDefined();
    });

    test('should handle PRD without features', async () => {
      const noFeaturesPRD = `
# Simple Project

## Description

Just a description, no features listed.
      `;

      const result = await ralphFromPrd({
        prd_content: noFeaturesPRD,
      });

      expect(result.summary).toContain('✅');
    });

    test('should handle invalid JSON structure gracefully', async () => {
      const weirdPRD = '# Project\n\n```json\n{"broken": json}\n```';
      const result = await ralphFromPrd({
        prd_content: weirdPRD,
      });

      // Should not throw, should return some result
      expect(result).toBeDefined();
      expect(result.summary).toBeDefined();
    });
  });

  describe('workflow quality', () => {
    test('should generate workflow with all standard phases', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      const data = result.data as any;
      const workflow = JSON.parse(data.workflow);

      const phaseNames = workflow.phases.map((p: any) => p.name);
      expect(phaseNames).toContain('Project Setup');
      expect(phaseNames).toContain('Testing & QA');
      expect(phaseNames).toContain('Deployment');
    });

    test('should include tasks in each phase', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      const data = result.data as any;
      const workflow = JSON.parse(data.workflow);

      for (const phase of workflow.phases) {
        expect(phase.tasks.length).toBeGreaterThan(0);
      }
    });

    test('should include estimated times', async () => {
      const result = await ralphFromPrd({
        prd_content: samplePRD,
        output_format: 'json',
      });

      const data = result.data as any;
      const workflow = JSON.parse(data.workflow);

      for (const phase of workflow.phases) {
        for (const task of phase.tasks) {
          expect(task.estimatedTime).toBeDefined();
        }
      }
    });
  });

  describe('complex PRD scenarios', () => {
    test('should handle PRD with multiple languages', async () => {
      const multiLangPRD = `
# Full Stack App

## Technical Details

Frontend: TypeScript with React
Backend: Python with Django
Database: PostgreSQL
Deployment: Docker on AWS
      `;

      const result = await ralphFromPrd({
        prd_content: multiLangPRD,
        output_format: 'json',
      });

      const data = result.data as any;
      const tech = data.metadata.technologyStack;

      expect(tech.languages).toContain('typescript');
      expect(tech.languages).toContain('python');
      expect(tech.frameworks).toContain('react');
      expect(tech.frameworks).toContain('django');
    });

    test('should handle PRD with many features', async () => {
      const manyFeaturesPRD = `
# Feature Rich App

## Features

- **Feature 1**: Description 1 (high priority)
- **Feature 2**: Description 2 (medium)
- **Feature 3**: Description 3 (high priority)
- **Feature 4**: Description 4 (low)
- **Feature 5**: Description 5 (medium)
- **Feature 6**: Description 6 (low)
      `;

      const result = await ralphFromPrd({
        prd_content: manyFeaturesPRD,
        output_format: 'json',
      });

      const data = result.data as any;
      const workflow = JSON.parse(data.workflow);

      const allTasks = workflow.phases.flatMap((p: any) => p.tasks);
      expect(allTasks.length).toBeGreaterThan(6);
    });
  });
});
