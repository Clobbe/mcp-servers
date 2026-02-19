import { readFile } from 'fs/promises';
import { execSync } from 'child_process';
import { dirname } from 'path';
import type { Workflow, WorkflowPhase, WorkflowTask, TaskExecutionResult } from '../utils/types.js';
import { validateWorktree } from '../utils/worktree-validator.js';

export const ralphLoopSchema = {
  name: 'ralph_loop',
  description: 'Execute workflow tasks iteratively with progress tracking',
  inputSchema: {
    type: 'object',
    properties: {
      workflow_path: {
        type: 'string',
        description: 'Path to workflow JSON file',
      },
      max_iterations: {
        type: 'number',
        description: 'Maximum number of iterations',
        default: 10,
      },
      auto_commit: {
        type: 'boolean',
        description: 'Automatically commit after each task',
        default: false,
      },
      working_dir: {
        type: 'string',
        description: 'Working directory for commands; defaults to directory containing workflow file',
      },
      continue_on_failure: {
        type: 'boolean',
        description: 'Keep running after a task fails',
        default: true,
      },
      dry_run: {
        type: 'boolean',
        description: 'Log commands without executing them',
        default: false,
      },
      commit_per_phase: {
        type: 'boolean',
        description: 'Commit after each phase completes (summary commit per wave)',
        default: false,
      },
    },
    required: ['workflow_path'],
  },
};

function autoCommit(task: WorkflowTask, workingDir: string): void {
  try {
    const status = execSync('git status --porcelain', {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    if (!status.trim()) return;

    if (task.files && task.files.length > 0) {
      const fileArgs = task.files.map((f) => JSON.stringify(f)).join(' ');
      execSync(`git add ${fileArgs}`, { cwd: workingDir, stdio: 'pipe' });
    } else {
      execSync('git add -A', { cwd: workingDir, stdio: 'pipe' });
    }

    const msg = `feat: complete task ${task.id} - ${task.description}`;
    execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: workingDir, stdio: 'pipe' });
  } catch {
    // best-effort, swallow errors silently
  }
}

function phaseCommit(
  phase: WorkflowPhase,
  phaseResults: TaskExecutionResult[],
  workingDir: string
): void {
  try {
    const completedCount = phaseResults.filter((r) => r.status === 'completed').length;
    if (completedCount === 0) return;

    const status = execSync('git status --porcelain', {
      cwd: workingDir,
      encoding: 'utf-8',
      stdio: 'pipe',
    });
    if (!status.trim()) return;

    execSync('git add -A', { cwd: workingDir, stdio: 'pipe' });

    const msg = `feat: complete phase "${phase.name}" (${completedCount}/${phase.tasks.length} tasks)`;
    execSync(`git commit -m ${JSON.stringify(msg)}`, { cwd: workingDir, stdio: 'pipe' });
  } catch {
    // best-effort, swallow errors silently
  }
}

export async function ralphLoop(args: {
  workflow_path: string;
  max_iterations?: number;
  auto_commit?: boolean;
  working_dir?: string;
  continue_on_failure?: boolean;
  dry_run?: boolean;
  commit_per_phase?: boolean;
}): Promise<{ summary: string; data?: unknown }> {
  try {
    const content = await readFile(args.workflow_path, 'utf-8');
    const workflow: Workflow = JSON.parse(content);

    const worktreeValidation = validateWorktree(
      workflow.metadata?.projectName || 'workflow-execution'
    );

    const workingDir = args.working_dir ?? dirname(args.workflow_path);
    const continueOnFailure = args.continue_on_failure !== false;
    const dryRun = args.dry_run ?? false;
    const maxIterations = args.max_iterations !== undefined ? args.max_iterations : 10;

    const results: TaskExecutionResult[] = [];
    const failedIds = new Set<string>();
    let iteration = 0;
    let stopped = false;

    for (const phase of workflow.phases) {
      if (stopped) break;
      const phaseStartIdx = results.length;

      for (const task of phase.tasks) {
        if (stopped || iteration >= maxIterations) break;

        // Skip tasks whose dependencies failed
        const hasFailedDep = task.dependencies?.some((dep) => failedIds.has(dep));
        if (hasFailedDep) {
          const now = new Date();
          results.push({
            taskId: task.id,
            status: 'skipped',
            startTime: now,
            endTime: now,
            duration: 0,
          });
          iteration++;
          continue;
        }

        const startTime = new Date();
        const outputParts: string[] = [];
        let taskFailed = false;

        for (const command of task.commands ?? []) {
          if (dryRun) {
            outputParts.push(`[dry-run] ${command}`);
            continue;
          }

          try {
            const cmdOutput = execSync(command, {
              cwd: workingDir,
              timeout: 60000,
              encoding: 'utf-8',
              stdio: 'pipe',
            });
            if (cmdOutput) outputParts.push(cmdOutput.trimEnd());
          } catch (err: unknown) {
            taskFailed = true;
            const e = err as Record<string, unknown>;
            const errMsg = (
              (e['stderr'] as Buffer | string | undefined)?.toString() ||
              (e['stdout'] as Buffer | string | undefined)?.toString() ||
              (err instanceof Error ? err.message : String(err))
            ).trim();
            if (errMsg) outputParts.push(errMsg);
            break;
          }
        }

        const endTime = new Date();
        const status: TaskExecutionResult['status'] = taskFailed ? 'failed' : 'completed';

        if (taskFailed) {
          failedIds.add(task.id);
        }

        const result: TaskExecutionResult = {
          taskId: task.id,
          status,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
        };

        if (outputParts.length > 0) {
          if (taskFailed) {
            result.error = outputParts.join('\n');
          } else {
            result.output = outputParts.join('\n');
          }
        }

        results.push(result);
        iteration++;

        if (taskFailed && !continueOnFailure) {
          stopped = true;
          break;
        }

        if (!taskFailed && args.auto_commit && !dryRun) {
          autoCommit(task, workingDir);
        }
      }

      if (args.commit_per_phase && !dryRun) {
        const phaseResults = results.slice(phaseStartIdx);
        phaseCommit(phase, phaseResults, workingDir);
      }
    }

    const completed = results.filter((r) => r.status === 'completed').length;
    const failed = results.filter((r) => r.status === 'failed').length;
    const skipped = results.filter((r) => r.status === 'skipped').length;

    const summaryParts = [
      `✅ Executed ${completed} tasks (${failed} failed) in ${iteration} iterations`,
    ];

    if (!worktreeValidation.isWorktree) {
      summaryParts.push('\n\n' + worktreeValidation.suggestion);
    }

    return {
      summary: summaryParts.join(''),
      data: { results, totalTasks: results.length, completed, failed, skipped },
    };
  } catch (error) {
    return {
      summary: `❌ Error executing workflow: ${error instanceof Error ? error.message : String(error)}`,
    };
  }
}
