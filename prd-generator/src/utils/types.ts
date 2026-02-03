/**
 * PRD input for structured creation
 */
export interface PRDInput {
  title: string;
  description: string;
  features: FeatureInput[];
  requirements?: RequirementInput[];
  technicalDetails?: TechnicalDetailsInput;
  output_format?: 'markdown' | 'json';
}

/**
 * Feature input for PRD creation
 */
export interface FeatureInput {
  name: string;
  description: string;
  priority?: 'high' | 'medium' | 'low';
}

/**
 * Requirement input for PRD creation
 */
export interface RequirementInput {
  description: string;
  priority?: 'must' | 'should' | 'could';
}

/**
 * Technical details for PRD
 */
export interface TechnicalDetailsInput {
  languages?: string[];
  frameworks?: string[];
  databases?: string[];
  infrastructure?: string[];
}

/**
 * Template types available
 */
export type TemplateType = 'web-app' | 'api-service' | 'mobile-app' | 'library' | 'full-stack';

/**
 * Template input for PRD creation from template
 */
export interface TemplateInput {
  template: TemplateType;
  projectName: string;
  output_format?: 'markdown' | 'json';
}

/**
 * Validation input
 */
export interface ValidationInput {
  prd_content: string;
  check_compatibility?: boolean;
  output_format?: 'markdown' | 'json';
}

/**
 * Validation result
 */
export interface ValidationResult {
  isValid: boolean;
  score: number;
  issues: ValidationIssue[];
  statistics: PRDStatistics;
  compatibility: CompatibilityCheck;
}

/**
 * Individual validation issue
 */
export interface ValidationIssue {
  severity: 'error' | 'warning' | 'info';
  section: string;
  message: string;
  suggestion?: string;
}

/**
 * PRD statistics
 */
export interface PRDStatistics {
  sectionCount: number;
  featureCount: number;
  requirementCount: number;
  wordCount: number;
}

/**
 * Compatibility check result
 */
export interface CompatibilityCheck {
  ralphWorkflow: boolean;
  parsedSuccessfully: boolean;
  detectedTechnologies: string[];
}

/**
 * PRD output format
 */
export interface PRDOutput {
  content: string;
  format: 'markdown' | 'json';
  metadata?: {
    generatedAt: string;
    wordCount: number;
    featureCount: number;
    requirementCount: number;
  };
}

/**
 * Tool response format
 */
export interface ToolResponse {
  success: boolean;
  content?: string;
  format?: 'markdown' | 'json';
  metadata?: Record<string, unknown>;
  validation?: ValidationResult;
  error?: string;
  field?: string;
  worktreeWarning?: string;
}
