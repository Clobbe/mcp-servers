import type { PRDInput } from '../utils/types.js';

/**
 * Get full-stack application template
 */
export function getFullStackTemplate(projectName: string): PRDInput {
  return {
    title: projectName,
    description: `A complete full-stack application with modern frontend, robust backend API, and scalable database architecture.`,
    features: [
      {
        name: 'Frontend UI',
        description: 'Modern, responsive user interface with component-based architecture',
        priority: 'high',
      },
      {
        name: 'Backend API',
        description: 'RESTful API with comprehensive endpoints for all frontend operations',
        priority: 'high',
      },
      {
        name: 'Database Layer',
        description: 'Efficient data modeling with migrations and seeding support',
        priority: 'high',
      },
      {
        name: 'Authentication',
        description: 'End-to-end authentication flow with secure session management',
        priority: 'high',
      },
    ],
    requirements: [
      {
        description: 'Horizontal scalability to handle increased traffic',
        priority: 'must',
      },
      {
        description: 'Secure API communication with HTTPS and CORS',
        priority: 'must',
      },
      {
        description: 'Automated deployment pipeline with CI/CD',
        priority: 'should',
      },
      {
        description: 'Monitoring and logging for production issues',
        priority: 'should',
      },
    ],
    technicalDetails: {
      languages: ['TypeScript', 'JavaScript'],
      frameworks: ['React', 'Next.js', 'Express'],
      databases: ['PostgreSQL', 'Redis'],
      infrastructure: ['Docker', 'AWS', 'Vercel'],
    },
  };
}
