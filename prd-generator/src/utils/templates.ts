import type { PRDInput, TemplateType } from './types.js';
import { getWebAppTemplate } from '../templates/web-app.js';
import { getAPIServiceTemplate } from '../templates/api-service.js';
import { getMobileAppTemplate } from '../templates/mobile-app.js';
import { getLibraryTemplate } from '../templates/library.js';
import { getFullStackTemplate } from '../templates/full-stack.js';

/**
 * Get PRD template by type
 */
export function getTemplate(type: TemplateType, projectName: string): PRDInput {
  switch (type) {
    case 'web-app':
      return getWebAppTemplate(projectName);
    case 'api-service':
      return getAPIServiceTemplate(projectName);
    case 'mobile-app':
      return getMobileAppTemplate(projectName);
    case 'library':
      return getLibraryTemplate(projectName);
    case 'full-stack':
      return getFullStackTemplate(projectName);
    default:
      throw new Error(`Unknown template type: ${type}`);
  }
}

/**
 * Get list of available template types
 */
export function getAvailableTemplates(): TemplateType[] {
  return ['web-app', 'api-service', 'mobile-app', 'library', 'full-stack'];
}
