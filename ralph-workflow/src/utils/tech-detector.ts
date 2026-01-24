import type { TechnologyStack } from './types.js';

/**
 * Detect technology stack from PRD content
 *
 * @param prdContent - Raw PRD markdown content
 * @returns Detected technology stack
 */
export function detectTechnology(prdContent: string): TechnologyStack {
  const content = prdContent.toLowerCase();

  return {
    languages: detectLanguages(content),
    frameworks: detectFrameworks(content),
    databases: detectDatabases(content),
    infrastructure: detectInfrastructure(content),
    tools: detectTools(content),
  };
}

function detectLanguages(content: string): string[] {
  const languages: string[] = [];
  const patterns = {
    typescript: /typescript|\.ts\b/,
    javascript: /javascript|\.js\b|node\.js/,
    python: /python|\.py\b/,
    go: /\bgo\b|golang/,
    rust: /\brust\b|\.rs\b/,
    java: /\bjava\b|\.java\b/,
  };

  for (const [lang, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      languages.push(lang);
    }
  }

  return languages.length > 0 ? languages : ['javascript']; // default
}

function detectFrameworks(content: string): string[] {
  const frameworks: string[] = [];
  const patterns = {
    react: /\breact\b/,
    nextjs: /next\.js|nextjs/,
    vue: /\bvue\b/,
    angular: /angular/,
    express: /express/,
    fastapi: /fastapi/,
    django: /django/,
    flask: /flask/,
  };

  for (const [framework, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      frameworks.push(framework);
    }
  }

  return frameworks;
}

function detectDatabases(content: string): string[] {
  const databases: string[] = [];
  const patterns = {
    postgresql: /postgres|postgresql/,
    mysql: /mysql/,
    mongodb: /mongodb|mongo/,
    redis: /redis/,
    sqlite: /sqlite/,
    dynamodb: /dynamodb/,
  };

  for (const [db, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      databases.push(db);
    }
  }

  return databases;
}

function detectInfrastructure(content: string): string[] {
  const infrastructure: string[] = [];
  const patterns = {
    docker: /docker/,
    kubernetes: /kubernetes|k8s/,
    aws: /\baws\b|amazon web services/,
    gcp: /\bgcp\b|google cloud/,
    azure: /azure/,
    vercel: /vercel/,
    netlify: /netlify/,
  };

  for (const [infra, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      infrastructure.push(infra);
    }
  }

  return infrastructure;
}

function detectTools(content: string): string[] {
  const tools: string[] = [];
  const patterns = {
    git: /\bgit\b/,
    github: /github/,
    gitlab: /gitlab/,
    jest: /jest/,
    playwright: /playwright/,
    eslint: /eslint/,
    prettier: /prettier/,
    webpack: /webpack/,
    vite: /vite/,
  };

  for (const [tool, pattern] of Object.entries(patterns)) {
    if (pattern.test(content)) {
      tools.push(tool);
    }
  }

  return tools;
}
