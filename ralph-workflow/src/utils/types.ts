/**
 * Technology stack detected from PRD
 */
export interface TechnologyStack {
  languages: string[];
  frameworks: string[];
  databases: string[];
  infrastructure: string[];
  tools: string[];
}

/**
 * Parsed PRD structure
 */
export interface ParsedPRD {
  title: string;
  description: string;
  features: Feature[];
  requirements: Requirement[];
  technicalDetails?: string;
}

export interface Feature {
  name: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  dependencies?: string[];
}

export interface Requirement {
  category: 'functional' | 'non-functional' | 'technical';
  description: string;
  priority: 'must' | 'should' | 'could';
}

/**
 * Generated workflow task
 */
export interface WorkflowTask {
  id: string;
  phase: string;
  description: string;
  commands?: string[];
  files?: string[];
  dependencies?: string[];
  estimatedTime?: string;
  validationSteps?: string[];
}

/**
 * Complete workflow structure
 */
export interface Workflow {
  metadata: {
    projectName: string;
    generatedAt: string;
    technologyStack: TechnologyStack;
  };
  phases: WorkflowPhase[];
}

export interface WorkflowPhase {
  name: string;
  description: string;
  tasks: WorkflowTask[];
  estimatedDuration?: string;
}

/**
 * Task execution result
 */
export interface TaskExecutionResult {
  taskId: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  output?: string;
  error?: string;
  startTime?: Date;
  endTime?: Date;
  duration?: number;
}
