import { test, expect, describe } from '@playwright/test';
import { generateWorkflow } from '../../src/utils/task-generator.js';
import type { ParsedPRD, TechnologyStack } from '../../src/utils/types.js';

describe('generateWorkflow', () => {
  const basicPRD: ParsedPRD = {
    title: 'Test Project',
    description: 'A test project',
    features: [
      { name: 'Feature 1', description: 'First feature', priority: 'high' },
      { name: 'Feature 2', description: 'Second feature', priority: 'medium' },
    ],
    requirements: [{ category: 'functional', description: 'Must work', priority: 'must' }],
  };

  const basicTech: TechnologyStack = {
    languages: ['typescript'],
    frameworks: ['react'],
    databases: ['postgresql'],
    infrastructure: ['docker'],
    tools: ['git', 'playwright'],
  };

  describe('metadata generation', () => {
    test('should generate metadata with project name and timestamp', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      expect(workflow.metadata.projectName).toBe('Test Project');
      expect(workflow.metadata.generatedAt).toBeDefined();
      expect(workflow.metadata.technologyStack).toEqual(basicTech);
    });

    test('should include ISO timestamp', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);
      const timestamp = new Date(workflow.metadata.generatedAt);

      expect(timestamp.toString()).not.toBe('Invalid Date');
    });
  });

  describe('phase generation', () => {
    test('should generate standard phases', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const phaseNames = workflow.phases.map((p) => p.name);
      expect(phaseNames).toContain('Project Setup');
      expect(phaseNames).toContain('Testing & QA');
      expect(phaseNames).toContain('Deployment');
    });

    test('should generate setup phase with database task when database specified', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const setupPhase = workflow.phases.find((p) => p.name === 'Project Setup');
      expect(setupPhase).toBeDefined();
      expect(setupPhase?.tasks.length).toBeGreaterThanOrEqual(3);

      const dbTask = setupPhase?.tasks.find((t) => t.description.includes('postgresql'));
      expect(dbTask).toBeDefined();
    });

    test('should not include database task when no database', async () => {
      const noDatabaseTech = { ...basicTech, databases: [] };
      const workflow = generateWorkflow(basicPRD, noDatabaseTech);

      const setupPhase = workflow.phases.find((p) => p.name === 'Project Setup');
      expect(setupPhase?.tasks.length).toBe(2);
    });
  });

  describe('implementation phases', () => {
    test('should create Core Features phase for high-priority features', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const corePhase = workflow.phases.find((p) => p.name === 'Core Features');
      expect(corePhase).toBeDefined();
      expect(corePhase?.tasks.length).toBe(1);
      expect(corePhase?.tasks[0].description).toContain('Feature 1');
    });

    test('should create Enhanced Features phase for medium-priority features', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const enhancedPhase = workflow.phases.find((p) => p.name === 'Enhanced Features');
      expect(enhancedPhase).toBeDefined();
      expect(enhancedPhase?.tasks.length).toBe(1);
      expect(enhancedPhase?.tasks[0].description).toContain('Feature 2');
    });

    test('should include validation steps for high-priority features', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const corePhase = workflow.phases.find((p) => p.name === 'Core Features');
      const task = corePhase?.tasks[0];

      expect(task?.validationSteps).toBeDefined();
      expect(task?.validationSteps).toContain('Write unit tests');
      expect(task?.validationSteps).toContain('Run all tests');
    });

    test('should suggest files for each feature', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const corePhase = workflow.phases.find((p) => p.name === 'Core Features');
      const task = corePhase?.tasks[0];

      expect(task?.files).toBeDefined();
      expect(task?.files?.length).toBeGreaterThan(0);
      expect(task?.files?.[0]).toContain('feature-1');
      expect(task?.files?.[0]).toContain('.ts');
    });

    test('should handle low-priority features', async () => {
      const prdWithLowPriority: ParsedPRD = {
        ...basicPRD,
        features: [
          ...basicPRD.features,
          { name: 'Feature 3', description: 'Third feature', priority: 'low' },
        ],
      };

      const workflow = generateWorkflow(prdWithLowPriority, basicTech);
      const additionalPhase = workflow.phases.find((p) => p.name === 'Additional Features');

      expect(additionalPhase).toBeDefined();
      expect(additionalPhase?.tasks.length).toBe(1);
    });
  });

  describe('testing phase', () => {
    test('should use Playwright when specified in tools', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const testPhase = workflow.phases.find((p) => p.name === 'Testing & QA');
      const testTask = testPhase?.tasks[0];

      expect(testTask?.description).toContain('Playwright');
    });

    test('should use Jest when Playwright not specified', async () => {
      const noPlaywrightTech = { ...basicTech, tools: ['git'] };
      const workflow = generateWorkflow(basicPRD, noPlaywrightTech);

      const testPhase = workflow.phases.find((p) => p.name === 'Testing & QA');
      const testTask = testPhase?.tasks[0];

      expect(testTask?.description).toContain('Jest');
    });

    test('should include coverage task', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const testPhase = workflow.phases.find((p) => p.name === 'Testing & QA');
      const coverageTask = testPhase?.tasks.find((t) => t.description.includes('coverage'));

      expect(coverageTask).toBeDefined();
      expect(coverageTask?.commands).toContain('npm test -- --coverage');
    });
  });

  describe('deployment phase', () => {
    test('should include build task', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const deployPhase = workflow.phases.find((p) => p.name === 'Deployment');
      const buildTask = deployPhase?.tasks.find((t) => t.description.includes('Build'));

      expect(buildTask).toBeDefined();
      expect(buildTask?.commands).toContain('npm run build');
    });

    test('should reference infrastructure in deploy task', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const deployPhase = workflow.phases.find((p) => p.name === 'Deployment');
      const deployTask = deployPhase?.tasks.find((t) => t.description.includes('Deploy'));

      expect(deployTask?.description).toContain('docker');
    });

    test('should use "production" when no infrastructure specified', async () => {
      const noInfraTech = { ...basicTech, infrastructure: [] };
      const workflow = generateWorkflow(basicPRD, noInfraTech);

      const deployPhase = workflow.phases.find((p) => p.name === 'Deployment');
      const deployTask = deployPhase?.tasks.find((t) => t.description.includes('Deploy'));

      expect(deployTask?.description).toContain('production');
    });
  });

  describe('task commands generation', () => {
    test('should generate TypeScript init commands', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      const setupPhase = workflow.phases.find((p) => p.name === 'Project Setup');
      const initTask = setupPhase?.tasks[0];

      expect(initTask?.commands).toContain('npm init -y');
      expect(initTask?.commands).toContain('npm install -D typescript @types/node');
      expect(initTask?.commands).toContain('npx tsc --init');
    });

    test('should generate Python init commands when Python is language', async () => {
      const pythonTech = { ...basicTech, languages: ['python'] };
      const workflow = generateWorkflow(basicPRD, pythonTech);

      const setupPhase = workflow.phases.find((p) => p.name === 'Project Setup');
      const initTask = setupPhase?.tasks[0];

      expect(initTask?.commands).toContain('python -m venv venv');
      expect(initTask?.commands).toContain('source venv/bin/activate');
    });

    test('should generate config commands for tools', async () => {
      const techWithTools: TechnologyStack = {
        ...basicTech,
        tools: ['eslint', 'prettier', 'playwright'],
      };
      const workflow = generateWorkflow(basicPRD, techWithTools);

      const setupPhase = workflow.phases.find((p) => p.name === 'Project Setup');
      const configTask = setupPhase?.tasks[1];

      expect(configTask?.commands).toContain('npm install -D eslint');
      expect(configTask?.commands).toContain('npm install -D prettier');
      expect(configTask?.commands).toContain('npm install -D @playwright/test');
    });
  });

  describe('estimated times', () => {
    test('should include estimated time for all tasks', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      for (const phase of workflow.phases) {
        for (const task of phase.tasks) {
          expect(task.estimatedTime).toBeDefined();
          expect(task.estimatedTime).toMatch(/\d+/);
        }
      }
    });

    test('should include estimated duration for phases', async () => {
      const workflow = generateWorkflow(basicPRD, basicTech);

      for (const phase of workflow.phases) {
        expect(phase.estimatedDuration).toBeDefined();
      }
    });
  });
});
