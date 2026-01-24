import type { ParsedPRD, TechnologyStack, Workflow, WorkflowPhase, WorkflowTask } from './types.js';

/**
 * Generate workflow from parsed PRD and detected technology
 *
 * @param prd - Parsed PRD structure
 * @param tech - Detected technology stack
 * @returns Complete workflow with phases and tasks
 */
export function generateWorkflow(prd: ParsedPRD, tech: TechnologyStack): Workflow {
  return {
    metadata: {
      projectName: prd.title,
      generatedAt: new Date().toISOString(),
      technologyStack: tech,
    },
    phases: [
      generateSetupPhase(tech),
      ...generateImplementationPhases(prd, tech),
      generateTestingPhase(tech),
      generateDeploymentPhase(tech),
    ],
  };
}

function generateSetupPhase(tech: TechnologyStack): WorkflowPhase {
  const tasks: WorkflowTask[] = [
    {
      id: 'setup-1',
      phase: 'setup',
      description: 'Initialize project structure',
      commands: generateInitCommands(tech),
      estimatedTime: '15 minutes',
    },
    {
      id: 'setup-2',
      phase: 'setup',
      description: 'Configure development environment',
      commands: generateConfigCommands(tech),
      estimatedTime: '30 minutes',
    },
  ];

  if (tech.databases.length > 0) {
    tasks.push({
      id: 'setup-3',
      phase: 'setup',
      description: `Set up ${tech.databases.join(', ')} database`,
      estimatedTime: '20 minutes',
    });
  }

  return {
    name: 'Project Setup',
    description: 'Initialize project and configure development environment',
    tasks,
    estimatedDuration: '1-2 hours',
  };
}

function generateImplementationPhases(prd: ParsedPRD, tech: TechnologyStack): WorkflowPhase[] {
  const phases: WorkflowPhase[] = [];

  // Group features by priority
  const highPriority = prd.features.filter((f) => f.priority === 'high');
  const mediumPriority = prd.features.filter((f) => f.priority === 'medium');
  const lowPriority = prd.features.filter((f) => f.priority === 'low');

  if (highPriority.length > 0) {
    phases.push({
      name: 'Core Features',
      description: 'Implement high-priority features',
      tasks: highPriority.map((feature, idx) => ({
        id: `impl-high-${idx + 1}`,
        phase: 'implementation',
        description: `Implement ${feature.name}`,
        files: suggestFiles(feature.name, tech),
        estimatedTime: '2-4 hours',
        validationSteps: ['Write unit tests', 'Run all tests', 'Manual testing', 'Code review'],
      })),
      estimatedDuration: `${highPriority.length * 3} hours`,
    });
  }

  if (mediumPriority.length > 0) {
    phases.push({
      name: 'Enhanced Features',
      description: 'Implement medium-priority features',
      tasks: mediumPriority.map((feature, idx) => ({
        id: `impl-med-${idx + 1}`,
        phase: 'implementation',
        description: `Implement ${feature.name}`,
        estimatedTime: '1-2 hours',
      })),
    });
  }

  if (lowPriority.length > 0) {
    phases.push({
      name: 'Additional Features',
      description: 'Implement low-priority features',
      tasks: lowPriority.map((feature, idx) => ({
        id: `impl-low-${idx + 1}`,
        phase: 'implementation',
        description: `Implement ${feature.name}`,
        estimatedTime: '1 hour',
      })),
    });
  }

  return phases;
}

function generateTestingPhase(tech: TechnologyStack): WorkflowPhase {
  const testTool = tech.tools.includes('playwright') ? 'Playwright' : 'Jest';

  return {
    name: 'Testing & QA',
    description: 'Comprehensive testing and quality assurance',
    tasks: [
      {
        id: 'test-1',
        phase: 'testing',
        description: `Write ${testTool} tests for all features`,
        commands: ['npm test'],
        estimatedTime: '2-3 hours',
      },
      {
        id: 'test-2',
        phase: 'testing',
        description: 'Achieve 80%+ code coverage',
        commands: ['npm test -- --coverage'],
        estimatedTime: '1 hour',
      },
    ],
    estimatedDuration: '3-4 hours',
  };
}

function generateDeploymentPhase(tech: TechnologyStack): WorkflowPhase {
  return {
    name: 'Deployment',
    description: 'Deploy to production environment',
    tasks: [
      {
        id: 'deploy-1',
        phase: 'deployment',
        description: 'Build production bundle',
        commands: ['npm run build'],
        estimatedTime: '10 minutes',
      },
      {
        id: 'deploy-2',
        phase: 'deployment',
        description: `Deploy to ${tech.infrastructure[0] || 'production'}`,
        estimatedTime: '30 minutes',
      },
    ],
    estimatedDuration: '1 hour',
  };
}

function generateInitCommands(tech: TechnologyStack): string[] {
  const commands: string[] = [];

  if (tech.languages.includes('typescript') || tech.languages.includes('javascript')) {
    commands.push('npm init -y');
    if (tech.languages.includes('typescript')) {
      commands.push('npm install -D typescript @types/node');
      commands.push('npx tsc --init');
    }
  } else if (tech.languages.includes('python')) {
    commands.push('python -m venv venv');
    commands.push('source venv/bin/activate');
  }

  return commands;
}

function generateConfigCommands(tech: TechnologyStack): string[] {
  const commands: string[] = [];

  if (tech.tools.includes('eslint')) {
    commands.push('npm install -D eslint');
  }
  if (tech.tools.includes('prettier')) {
    commands.push('npm install -D prettier');
  }
  if (tech.tools.includes('playwright')) {
    commands.push('npm install -D @playwright/test');
  }

  return commands;
}

function suggestFiles(featureName: string, tech: TechnologyStack): string[] {
  const ext = tech.languages.includes('typescript') ? 'ts' : 'js';
  const kebabName = featureName.toLowerCase().replace(/\s+/g, '-');

  return [`src/${kebabName}.${ext}`, `src/__tests__/${kebabName}.test.${ext}`];
}
