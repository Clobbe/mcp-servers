import type { PRDInput } from '../utils/types.js';

/**
 * Get API service template
 */
export function getAPIServiceTemplate(projectName: string): PRDInput {
  return {
    title: projectName,
    description: `A RESTful API service providing robust backend functionality with secure authentication and data management capabilities.`,
    features: [
      {
        name: 'RESTful Endpoints',
        description: 'Comprehensive CRUD operations with proper HTTP methods and status codes',
        priority: 'high',
      },
      {
        name: 'Authentication',
        description: 'Token-based authentication with JWT and refresh token support',
        priority: 'high',
      },
      {
        name: 'Database Integration',
        description: 'Efficient data persistence with ORM and migration support',
        priority: 'medium',
      },
    ],
    requirements: [
      {
        description: 'API response time under 200ms for 95th percentile',
        priority: 'must',
      },
      {
        description: 'Comprehensive API documentation with OpenAPI/Swagger',
        priority: 'must',
      },
      {
        description: 'Rate limiting and request throttling',
        priority: 'should',
      },
    ],
    technicalDetails: {
      languages: ['TypeScript', 'JavaScript'],
      frameworks: ['Express', 'Fastify'],
      databases: ['PostgreSQL', 'Redis'],
      infrastructure: ['Docker', 'AWS'],
    },
  };
}
