import type { PRDInput } from '../utils/types.js';

/**
 * Get web application template
 */
export function getWebAppTemplate(projectName: string): PRDInput {
  return {
    title: projectName,
    description: `A modern web application providing an intuitive user interface and responsive design. Built for scalability and maintainability.`,
    features: [
      {
        name: 'User Authentication',
        description: 'Secure user registration, login, and session management with JWT tokens',
        priority: 'high',
      },
      {
        name: 'Responsive Design',
        description: 'Mobile-first responsive layout that works seamlessly across all devices',
        priority: 'high',
      },
      {
        name: 'Dashboard',
        description: 'Central hub displaying key metrics and user activity',
        priority: 'medium',
      },
    ],
    requirements: [
      {
        description: 'Page load time under 2 seconds',
        priority: 'must',
      },
      {
        description: 'Support modern browsers (Chrome, Firefox, Safari, Edge)',
        priority: 'must',
      },
      {
        description: 'WCAG 2.1 AA accessibility compliance',
        priority: 'should',
      },
    ],
    technicalDetails: {
      languages: ['TypeScript', 'JavaScript'],
      frameworks: ['React', 'Next.js'],
      databases: ['PostgreSQL'],
      infrastructure: ['Vercel', 'AWS'],
    },
  };
}
