import type { PRDInput } from '../utils/types.js';

/**
 * Get library/package template
 */
export function getLibraryTemplate(projectName: string): PRDInput {
  return {
    title: projectName,
    description: `A reusable library/package providing well-documented, type-safe functionality for developers to integrate into their projects.`,
    features: [
      {
        name: 'Public API',
        description: 'Clean, intuitive API with consistent naming and clear functionality',
        priority: 'high',
      },
      {
        name: 'Documentation',
        description: 'Comprehensive documentation with examples, API reference, and guides',
        priority: 'high',
      },
      {
        name: 'Testing',
        description: 'Extensive test coverage with unit and integration tests',
        priority: 'medium',
      },
    ],
    requirements: [
      {
        description: 'Tree-shakeable for optimal bundle size',
        priority: 'must',
      },
      {
        description: 'Full TypeScript support with type definitions',
        priority: 'must',
      },
      {
        description: 'Browser and Node.js compatibility',
        priority: 'should',
      },
    ],
    technicalDetails: {
      languages: ['TypeScript'],
      frameworks: ['Jest', 'Vitest'],
      databases: [],
      infrastructure: ['npm', 'GitHub Actions'],
    },
  };
}
