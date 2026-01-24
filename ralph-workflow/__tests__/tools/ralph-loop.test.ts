import { test, expect, describe } from '@playwright/test';
import { ralphLoop } from '../../src/tools/ralph-loop.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';

describe('ralphLoop', () => {
  let tempDir: string;
  let workflowPath: string;

  const sampleWorkflow = {
    metadata: {
      projectName: 'Test Project',
      generatedAt: new Date().toISOString(),
      technologyStack: {
        languages: ['typescript'],
        frameworks: ['react'],
        databases: ['postgresql'],
        infrastructure: ['docker'],
        tools: ['git'],
      },
    },
    phases: [
      {
        name: 'Project Setup',
        description: 'Initialize project',
        tasks: [
          {
            id: 'setup-1',
            phase: 'setup',
            description: 'Initialize package.json',
            commands: ['npm init -y'],
            estimatedTime: '5 minutes',
          },
          {
            id: 'setup-2',
            phase: 'setup',
            description: 'Install dependencies',
            commands: ['npm install'],
            estimatedTime: '10 minutes',
          },
        ],
        estimatedDuration: '15 minutes',
      },
      {
        name: 'Implementation',
        description: 'Build features',
        tasks: [
          {
            id: 'impl-1',
            phase: 'implementation',
            description: 'Implement feature A',
            estimatedTime: '2 hours',
          },
          {
            id: 'impl-2',
            phase: 'implementation',
            description: 'Implement feature B',
            estimatedTime: '1 hour',
          },
        ],
      },
    ],
  };

  test.beforeEach(async () => {
    // Create temp directory and workflow file
    tempDir = join(tmpdir(), `ralph-test-${Date.now()}`);
    await mkdir(tempDir, { recursive: true });
    workflowPath = join(tempDir, 'workflow.json');
    await writeFile(workflowPath, JSON.stringify(sampleWorkflow, null, 2));
  });

  describe('successful execution', () => {
    test('should execute workflow from file', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      expect(result.summary).toContain('✅');
      expect(result.summary).toContain('Executed');
      expect(result.data).toBeDefined();
    });

    test('should track all tasks', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      const data = result.data as any;
      expect(data.totalTasks).toBe(4); // 2 setup + 2 implementation
      expect(data.results.length).toBe(4);
    });

    test('should mark tasks as completed', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      const data = result.data as any;
      expect(data.completed).toBe(4);
      expect(data.failed).toBe(0);
    });

    test('should include task IDs in results', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      const data = result.data as any;
      const taskIds = data.results.map((r: any) => r.taskId);

      expect(taskIds).toContain('setup-1');
      expect(taskIds).toContain('setup-2');
      expect(taskIds).toContain('impl-1');
      expect(taskIds).toContain('impl-2');
    });
  });

  describe('iteration limits', () => {
    test('should respect max_iterations parameter', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
        max_iterations: 2,
      });

      const data = result.data as any;
      expect(data.results.length).toBe(2);
      expect(data.totalTasks).toBe(2);
    });

    test('should use default max_iterations of 10', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      const data = result.data as any;
      // Should execute all 4 tasks since it's under 10
      expect(data.results.length).toBe(4);
    });

    test('should handle max_iterations = 0', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
        max_iterations: 0,
      });

      const data = result.data as any;
      expect(data.results.length).toBe(0);
    });

    test('should stop at max_iterations even with more tasks', async () => {
      const largeWorkflow = {
        ...sampleWorkflow,
        phases: Array(5)
          .fill(null)
          .map((_, i) => ({
            name: `Phase ${i}`,
            description: 'Test phase',
            tasks: Array(3)
              .fill(null)
              .map((_, j) => ({
                id: `task-${i}-${j}`,
                phase: 'test',
                description: `Task ${i}-${j}`,
              })),
          })),
      };

      const largePath = join(tempDir, 'large-workflow.json');
      await writeFile(largePath, JSON.stringify(largeWorkflow, null, 2));

      const result = await ralphLoop({
        workflow_path: largePath,
        max_iterations: 5,
      });

      const data = result.data as any;
      expect(data.results.length).toBe(5);
    });
  });

  describe('auto_commit parameter', () => {
    test('should accept auto_commit parameter', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
        auto_commit: true,
      });

      expect(result.summary).toContain('✅');
    });

    test('should work with auto_commit false', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
        auto_commit: false,
      });

      expect(result.summary).toContain('✅');
    });
  });

  describe('error handling', () => {
    test('should handle non-existent file', async () => {
      const result = await ralphLoop({
        workflow_path: '/nonexistent/path/workflow.json',
      });

      expect(result.summary).toContain('❌');
      expect(result.summary).toContain('Error');
    });

    test('should handle invalid JSON', async () => {
      const invalidPath = join(tempDir, 'invalid.json');
      await writeFile(invalidPath, 'not valid json{]');

      const result = await ralphLoop({
        workflow_path: invalidPath,
      });

      expect(result.summary).toContain('❌');
    });

    test('should handle empty file', async () => {
      const emptyPath = join(tempDir, 'empty.json');
      await writeFile(emptyPath, '');

      const result = await ralphLoop({
        workflow_path: emptyPath,
      });

      expect(result.summary).toContain('❌');
    });

    test('should handle workflow without phases', async () => {
      const noPhasesWorkflow = {
        metadata: sampleWorkflow.metadata,
        phases: [],
      };

      const noPhasesPath = join(tempDir, 'no-phases.json');
      await writeFile(noPhasesPath, JSON.stringify(noPhasesWorkflow, null, 2));

      const result = await ralphLoop({
        workflow_path: noPhasesPath,
      });

      expect(result.summary).toContain('✅');
      const data = result.data as any;
      expect(data.totalTasks).toBe(0);
    });

    test('should handle workflow with empty phases', async () => {
      const emptyPhasesWorkflow = {
        metadata: sampleWorkflow.metadata,
        phases: [
          {
            name: 'Empty Phase',
            description: 'No tasks',
            tasks: [],
          },
        ],
      };

      const emptyPhasesPath = join(tempDir, 'empty-phases.json');
      await writeFile(emptyPhasesPath, JSON.stringify(emptyPhasesWorkflow, null, 2));

      const result = await ralphLoop({
        workflow_path: emptyPhasesPath,
      });

      expect(result.summary).toContain('✅');
      const data = result.data as any;
      expect(data.totalTasks).toBe(0);
    });
  });

  describe('execution tracking', () => {
    test('should include start and end times for tasks', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      const data = result.data as any;
      for (const taskResult of data.results) {
        expect(taskResult.startTime).toBeDefined();
        expect(taskResult.endTime).toBeDefined();
      }
    });

    test('should calculate duration for tasks', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      const data = result.data as any;
      for (const taskResult of data.results) {
        expect(taskResult.duration).toBeDefined();
        expect(taskResult.duration).toBeGreaterThanOrEqual(0);
      }
    });

    test('should set task status', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      const data = result.data as any;
      for (const taskResult of data.results) {
        expect(taskResult.status).toBe('completed');
      }
    });
  });

  describe('summary reporting', () => {
    test('should report number of completed tasks', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      expect(result.summary).toMatch(/Executed \d+ tasks/);
      expect(result.summary).toContain('4 tasks');
    });

    test('should report number of failed tasks', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      expect(result.summary).toContain('0 failed');
    });

    test('should report number of iterations', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      expect(result.summary).toMatch(/\d+ iterations/);
    });
  });

  describe('workflow structure validation', () => {
    test('should handle workflow with metadata', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      expect(result.summary).toContain('✅');
    });

    test('should process tasks in order', async () => {
      const result = await ralphLoop({
        workflow_path: workflowPath,
      });

      const data = result.data as any;
      expect(data.results[0].taskId).toBe('setup-1');
      expect(data.results[1].taskId).toBe('setup-2');
      expect(data.results[2].taskId).toBe('impl-1');
      expect(data.results[3].taskId).toBe('impl-2');
    });
  });
});
