import { test, expect } from '@playwright/test';
import { ralphLoop } from '../../src/tools/ralph-loop.js';
import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { tmpdir } from 'os';
import { execSync } from 'child_process';

test.describe('ralphLoop', () => {
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

  test.describe('successful execution', () => {
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

  test.describe('iteration limits', () => {
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

  test.describe('auto_commit parameter', () => {
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

  test.describe('error handling', () => {
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

  test.describe('execution tracking', () => {
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

  test.describe('summary reporting', () => {
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

  test.describe('workflow structure validation', () => {
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

  test.describe('real command execution', () => {
    const echoWorkflow = (tasks: object[]) => ({
      metadata: {
        projectName: 'cmd-test',
        generatedAt: new Date().toISOString(),
        technologyStack: {
          languages: [],
          frameworks: [],
          databases: [],
          infrastructure: [],
          tools: [],
        },
      },
      phases: [{ name: 'p1', description: 'd', tasks }],
    });

    test('should execute commands and capture output', async () => {
      const wf = echoWorkflow([
        { id: 't1', phase: 'p1', description: 'say hello', commands: ['echo hello'] },
      ]);
      const wfPath = join(tempDir, 'echo-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      const result = await ralphLoop({ workflow_path: wfPath, working_dir: tempDir });

      const data = result.data as any;
      expect(data.completed).toBe(1);
      expect(data.failed).toBe(0);
      expect(data.results[0].status).toBe('completed');
      expect(data.results[0].output).toContain('hello');
    });

    test('should mark task as failed when command exits non-zero', async () => {
      const wf = echoWorkflow([
        { id: 'fail-1', phase: 'p1', description: 'will fail', commands: ['false'] },
      ]);
      const wfPath = join(tempDir, 'fail-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      const result = await ralphLoop({ workflow_path: wfPath, working_dir: tempDir });

      const data = result.data as any;
      expect(data.failed).toBe(1);
      expect(data.completed).toBe(0);
      expect(data.results[0].status).toBe('failed');
    });

    test('should stop after first failure when continue_on_failure is false', async () => {
      const wf = echoWorkflow([
        { id: 'a', phase: 'p1', description: 'fail', commands: ['false'] },
        { id: 'b', phase: 'p1', description: 'should not run', commands: ['echo ok'] },
      ]);
      const wfPath = join(tempDir, 'stop-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      const result = await ralphLoop({
        workflow_path: wfPath,
        working_dir: tempDir,
        continue_on_failure: false,
      });

      const data = result.data as any;
      expect(data.results.length).toBe(1);
      expect(data.results[0].taskId).toBe('a');
      expect(data.results[0].status).toBe('failed');
    });

    test('should continue after failure when continue_on_failure is true', async () => {
      const wf = echoWorkflow([
        { id: 'a', phase: 'p1', description: 'fail', commands: ['false'] },
        { id: 'b', phase: 'p1', description: 'still runs', commands: ['echo ok'] },
      ]);
      const wfPath = join(tempDir, 'continue-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      const result = await ralphLoop({
        workflow_path: wfPath,
        working_dir: tempDir,
        continue_on_failure: true,
      });

      const data = result.data as any;
      expect(data.results.length).toBe(2);
      expect(data.results[0].status).toBe('failed');
      expect(data.results[1].status).toBe('completed');
    });

    test('should not execute commands in dry_run mode and mark tasks completed', async () => {
      const wf = echoWorkflow([
        { id: 't1', phase: 'p1', description: 'dry task', commands: ['false'] },
      ]);
      const wfPath = join(tempDir, 'dry-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      const result = await ralphLoop({
        workflow_path: wfPath,
        working_dir: tempDir,
        dry_run: true,
      });

      expect(result.summary).toContain('✅');
      const data = result.data as any;
      expect(data.completed).toBe(1);
      expect(data.failed).toBe(0);
      expect(data.results[0].output).toContain('[dry-run]');
      expect(data.results[0].output).toContain('false');
    });

    test('should skip task when a dependency failed', async () => {
      const wf = echoWorkflow([
        { id: 'a', phase: 'p1', description: 'fails', commands: ['false'] },
        { id: 'b', phase: 'p1', description: 'depends on a', commands: ['echo ok'], dependencies: ['a'] },
      ]);
      const wfPath = join(tempDir, 'dep-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      const result = await ralphLoop({
        workflow_path: wfPath,
        working_dir: tempDir,
        continue_on_failure: true,
      });

      const data = result.data as any;
      expect(data.results.length).toBe(2);
      expect(data.results[0].status).toBe('failed');
      expect(data.results[1].status).toBe('skipped');
      expect(data.skipped).toBe(1);
    });

    test('should run commands in the specified working_dir', async () => {
      const wf = echoWorkflow([
        { id: 't1', phase: 'p1', description: 'print dir', commands: ['pwd'] },
      ]);
      const wfPath = join(tempDir, 'wd-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      const result = await ralphLoop({
        workflow_path: wfPath,
        working_dir: tempDir,
      });

      const data = result.data as any;
      expect(data.results[0].status).toBe('completed');
      expect(data.results[0].output).toContain(tempDir);
    });
  });

  test.describe('commit_per_phase parameter', () => {
    function initGitRepo(dir: string): void {
      execSync('git init', { cwd: dir, stdio: 'pipe' });
      execSync('git config user.email "test@example.com"', { cwd: dir, stdio: 'pipe' });
      execSync('git config user.name "Test User"', { cwd: dir, stdio: 'pipe' });
    }

    function gitLog(dir: string): string {
      return execSync('git log --oneline', { cwd: dir, encoding: 'utf-8', stdio: 'pipe' });
    }

    function makePhaseWorkflow(phases: { name: string; tasks: object[] }[]) {
      return {
        metadata: {
          projectName: 'phase-commit-test',
          generatedAt: new Date().toISOString(),
          technologyStack: {
            languages: [],
            frameworks: [],
            databases: [],
            infrastructure: [],
            tools: [],
          },
        },
        phases: phases.map((p) => ({ name: p.name, description: p.name, tasks: p.tasks })),
      };
    }

    test('should create a phase commit after a completed phase', async () => {
      initGitRepo(tempDir);

      const wf = makePhaseWorkflow([
        {
          name: 'Build',
          tasks: [
            { id: 't1', phase: 'build', description: 'touch file', commands: [`touch ${join(tempDir, 'out.txt')}`] },
          ],
        },
      ]);
      const wfPath = join(tempDir, 'phase-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      await ralphLoop({ workflow_path: wfPath, working_dir: tempDir, commit_per_phase: true });

      const log = gitLog(tempDir);
      expect(log).toContain('Build');
    });

    test('should use the correct commit message format', async () => {
      initGitRepo(tempDir);

      const wf = makePhaseWorkflow([
        {
          name: 'Deploy',
          tasks: [
            { id: 't1', phase: 'deploy', description: 'write file', commands: [`touch ${join(tempDir, 'deploy.txt')}`] },
          ],
        },
      ]);
      const wfPath = join(tempDir, 'msg-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      await ralphLoop({ workflow_path: wfPath, working_dir: tempDir, commit_per_phase: true });

      const log = gitLog(tempDir);
      expect(log).toMatch(/feat: complete phase "Deploy" \(1\/1 tasks\)/);
    });

    test('should not commit when no tasks in the phase completed', async () => {
      initGitRepo(tempDir);

      const wf = makePhaseWorkflow([
        {
          name: 'WillFail',
          tasks: [
            { id: 'f1', phase: 'fail', description: 'fail task', commands: ['false'] },
          ],
        },
      ]);
      const wfPath = join(tempDir, 'nofail-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      await ralphLoop({ workflow_path: wfPath, working_dir: tempDir, commit_per_phase: true });

      let hasCommits = true;
      try {
        gitLog(tempDir);
      } catch {
        hasCommits = false;
      }
      expect(hasCommits).toBe(false);
    });

    test('should not commit when dry_run is true', async () => {
      initGitRepo(tempDir);

      const wf = makePhaseWorkflow([
        {
          name: 'DryPhase',
          tasks: [
            { id: 't1', phase: 'dry', description: 'dry task', commands: ['false'] },
          ],
        },
      ]);
      const wfPath = join(tempDir, 'dryrun-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      await ralphLoop({ workflow_path: wfPath, working_dir: tempDir, commit_per_phase: true, dry_run: true });

      let hasCommits = true;
      try {
        gitLog(tempDir);
      } catch {
        hasCommits = false;
      }
      expect(hasCommits).toBe(false);
    });

    test('should create one commit per phase for multiple phases', async () => {
      initGitRepo(tempDir);

      const wf = makePhaseWorkflow([
        {
          name: 'PhaseOne',
          tasks: [
            { id: 'p1t1', phase: 'one', description: 'create file 1', commands: [`touch ${join(tempDir, 'file1.txt')}`] },
          ],
        },
        {
          name: 'PhaseTwo',
          tasks: [
            { id: 'p2t1', phase: 'two', description: 'create file 2', commands: [`touch ${join(tempDir, 'file2.txt')}`] },
          ],
        },
      ]);
      const wfPath = join(tempDir, 'multi-phase-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      await ralphLoop({ workflow_path: wfPath, working_dir: tempDir, commit_per_phase: true });

      const log = gitLog(tempDir);
      const lines = log.trim().split('\n').filter(Boolean);
      expect(lines.length).toBe(2);
      expect(log).toContain('PhaseOne');
      expect(log).toContain('PhaseTwo');
    });

    test('should not create phase commits when commit_per_phase is not set', async () => {
      initGitRepo(tempDir);

      const wf = makePhaseWorkflow([
        {
          name: 'SilentPhase',
          tasks: [
            { id: 't1', phase: 'silent', description: 'touch file', commands: [`touch ${join(tempDir, 'silent.txt')}`] },
          ],
        },
      ]);
      const wfPath = join(tempDir, 'nocommit-wf.json');
      await writeFile(wfPath, JSON.stringify(wf));

      // commit_per_phase not passed — defaults to false
      await ralphLoop({ workflow_path: wfPath, working_dir: tempDir });

      let hasCommits = true;
      try {
        gitLog(tempDir);
      } catch {
        hasCommits = false;
      }
      expect(hasCommits).toBe(false);
    });
  });
});
