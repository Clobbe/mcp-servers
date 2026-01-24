import type { PRDInput } from '../utils/types.js';

/**
 * Get mobile application template
 */
export function getMobileAppTemplate(projectName: string): PRDInput {
  return {
    title: projectName,
    description: `A cross-platform mobile application delivering seamless user experience on iOS and Android devices with offline capabilities.`,
    features: [
      {
        name: 'User Authentication',
        description: 'Secure authentication with biometric support (Face ID, Touch ID)',
        priority: 'high',
      },
      {
        name: 'Offline Support',
        description: 'Local data caching and synchronization when connection is restored',
        priority: 'medium',
      },
      {
        name: 'Push Notifications',
        description: 'Real-time notifications for important updates and user engagement',
        priority: 'medium',
      },
    ],
    requirements: [
      {
        description: 'App startup time under 3 seconds',
        priority: 'must',
      },
      {
        description: 'Support iOS 14+ and Android 10+',
        priority: 'must',
      },
      {
        description: 'App store compliance (iOS App Store, Google Play)',
        priority: 'must',
      },
    ],
    technicalDetails: {
      languages: ['TypeScript', 'JavaScript'],
      frameworks: ['React Native', 'Expo'],
      databases: ['SQLite', 'AsyncStorage'],
      infrastructure: ['Firebase', 'AWS Amplify'],
    },
  };
}
