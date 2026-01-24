/**
 * Type definitions for context management
 */

export interface ContextFile {
  path: string;
  content: string;
  language: string;
  size: number;
}

export interface ContextBundleMetadata {
  created: string;
  modified: string;
  totalSize: number;
  fileCount: number;
}

export interface ContextBundle {
  name: string;
  description: string;
  files: ContextFile[];
  metadata: ContextBundleMetadata;
}

export interface SearchResult {
  filePath: string;
  line: number;
  content: string;
  match: string;
}

export interface BundleStats {
  name: string;
  fileCount: number;
  totalSize: number;
  totalLines: number;
  languages: Record<string, number>;
  largestFile: string;
  created: string;
  modified: string;
}
