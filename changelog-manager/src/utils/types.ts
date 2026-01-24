// Type definitions for changelog management

export interface ChangelogEntry {
  date: string; // YYYY-MM-DD or "Unreleased"
  description?: string;
  sections: ChangelogSection[];
}

export interface ChangelogSection {
  type: SectionType;
  items: string[];
}

export type SectionType =
  | 'Added'
  | 'Changed'
  | 'Deprecated'
  | 'Removed'
  | 'Fixed'
  | 'Security'
  | 'Documentation'
  | 'Testing'
  | 'Performance'
  | 'Dependencies'
  | 'Breaking Changes';

export const VALID_SECTIONS: SectionType[] = [
  'Added',
  'Changed',
  'Deprecated',
  'Removed',
  'Fixed',
  'Security',
  'Documentation',
  'Testing',
  'Performance',
  'Dependencies',
  'Breaking Changes',
];

export interface ChangelogStructure {
  title: string;
  description: string;
  entries: ChangelogEntry[];
}

export interface GitCommit {
  hash: string;
  message: string;
  author: string;
  date: string;
  files: string[];
}

export interface GitStatus {
  added: string[];
  modified: string[];
  deleted: string[];
  renamed: string[];
  untracked: string[];
}

export interface ValidationResult {
  valid: boolean;
  errors: ValidationIssue[];
  warnings: ValidationIssue[];
  info: ValidationIssue[];
}

export interface ValidationIssue {
  line?: number;
  message: string;
  severity: 'error' | 'warning' | 'info';
  suggestion?: string;
}
