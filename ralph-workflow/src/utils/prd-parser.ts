import type { ParsedPRD, Feature, Requirement } from './types.js';

/**
 * Parse PRD markdown content into structured data
 *
 * @param content - Raw PRD markdown content
 * @returns Parsed PRD structure
 */
export function parsePRD(content: string): ParsedPRD {
  const lines = content.split('\n');

  return {
    title: extractTitle(lines),
    description: extractDescription(lines),
    features: extractFeatures(lines),
    requirements: extractRequirements(lines),
    technicalDetails: extractTechnicalDetails(lines),
  };
}

function extractTitle(lines: string[]): string {
  const titleLine = lines.find((line) => line.startsWith('# '));
  return titleLine?.replace(/^#\s+/, '').trim() || 'Untitled Project';
}

function extractDescription(lines: string[]): string {
  const descStart = lines.findIndex(
    (line) =>
      line.toLowerCase().includes('## description') || line.toLowerCase().includes('## overview')
  );

  if (descStart === -1) return '';

  const descEnd = lines.findIndex((line, idx) => idx > descStart && line.startsWith('##'));

  const descLines =
    descEnd === -1 ? lines.slice(descStart + 1) : lines.slice(descStart + 1, descEnd);

  return descLines.join('\n').trim();
}

function extractFeatures(lines: string[]): Feature[] {
  const features: Feature[] = [];
  const featureStart = lines.findIndex(
    (line) =>
      line.toLowerCase().includes('## feature') || line.toLowerCase().includes('## capabilities')
  );

  if (featureStart === -1) return features;

  const featureEnd = lines.findIndex((line, idx) => idx > featureStart && line.startsWith('##'));

  const featureLines =
    featureEnd === -1 ? lines.slice(featureStart + 1) : lines.slice(featureStart + 1, featureEnd);

  let currentFeature: Partial<Feature> | null = null;

  for (const line of featureLines) {
    if (line.match(/^[-*]\s+\*\*(.+?)\*\*/)) {
      if (currentFeature) features.push(currentFeature as Feature);
      const name = line.match(/\*\*(.+?)\*\*/)?.[1] || '';
      currentFeature = {
        name,
        description: line.replace(/^[-*]\s+\*\*.+?\*\*:?\s*/, '').trim(),
        priority: determineFeaturePriority(line),
      };
    } else if (currentFeature && line.trim()) {
      currentFeature.description += ' ' + line.trim();
    }
  }

  if (currentFeature) features.push(currentFeature as Feature);

  return features;
}

function extractRequirements(lines: string[]): Requirement[] {
  const requirements: Requirement[] = [];
  const reqStart = lines.findIndex((line) => line.toLowerCase().includes('## requirement'));

  if (reqStart === -1) return requirements;

  const reqEnd = lines.findIndex((line, idx) => idx > reqStart && line.startsWith('##'));

  const reqLines = reqEnd === -1 ? lines.slice(reqStart + 1) : lines.slice(reqStart + 1, reqEnd);

  for (const line of reqLines) {
    if (line.match(/^[-*]\s+/)) {
      requirements.push({
        category: determineCategory(line),
        description: line.replace(/^[-*]\s+/, '').trim(),
        priority: determineRequirementPriority(line),
      });
    }
  }

  return requirements;
}

function extractTechnicalDetails(lines: string[]): string | undefined {
  const techStart = lines.findIndex(
    (line) =>
      line.toLowerCase().includes('## technical') ||
      line.toLowerCase().includes('## implementation')
  );

  if (techStart === -1) return undefined;

  const techEnd = lines.findIndex((line, idx) => idx > techStart && line.startsWith('##'));

  const techLines =
    techEnd === -1 ? lines.slice(techStart + 1) : lines.slice(techStart + 1, techEnd);

  return techLines.join('\n').trim();
}

function determineFeaturePriority(text: string): 'high' | 'medium' | 'low' {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('must') || lower.includes('high')) {
    return 'high';
  }
  if (lower.includes('should') || lower.includes('medium')) {
    return 'medium';
  }
  return 'low';
}

function determineRequirementPriority(text: string): 'must' | 'should' | 'could' {
  const lower = text.toLowerCase();
  if (lower.includes('critical') || lower.includes('must') || lower.includes('high')) {
    return 'must';
  }
  if (lower.includes('should') || lower.includes('medium')) {
    return 'should';
  }
  return 'could';
}

function determineCategory(text: string): 'functional' | 'non-functional' | 'technical' {
  const lower = text.toLowerCase();
  if (
    lower.includes('performance') ||
    lower.includes('security') ||
    lower.includes('scalability') ||
    lower.includes('concurrent') ||
    lower.includes('availability') ||
    lower.includes('reliability')
  ) {
    return 'non-functional';
  }
  if (lower.includes('api') || lower.includes('database') || lower.includes('architecture')) {
    return 'technical';
  }
  return 'functional';
}
