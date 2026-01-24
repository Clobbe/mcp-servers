import { test, expect } from '@playwright/test';
import { parsePRD } from '../../src/utils/prd-parser.js';

test.test.describe('parsePRD', () => {
  test.test.describe('title extraction', () => {
    test('should extract title from H1 heading', async () => {
      const prd = '# My Awesome Project\n\nSome description';
      const parsed = parsePRD(prd);
      expect(parsed.title).toBe('My Awesome Project');
    });

    test('should return default title when no H1 found', async () => {
      const prd = 'Just some text without a title';
      const parsed = parsePRD(prd);
      expect(parsed.title).toBe('Untitled Project');
    });
  });

  test.test.describe('description extraction', () => {
    test('should extract description from Description section', async () => {
      const prd = `
# Project Title

## Description

This is a detailed description
of the project.

## Features
      `;
      const parsed = parsePRD(prd);
      expect(parsed.description).toContain('detailed description');
      expect(parsed.description).toContain('of the project');
    });

    test('should extract description from Overview section', async () => {
      const prd = `
# Project Title

## Overview

Project overview text here.

## Features
      `;
      const parsed = parsePRD(prd);
      expect(parsed.description).toContain('Project overview');
    });

    test('should return empty string when no description section', async () => {
      const prd = '# Project Title\n\n## Features';
      const parsed = parsePRD(prd);
      expect(parsed.description).toBe('');
    });
  });

  test.test.describe('features extraction', () => {
    test('should extract features with bold names', async () => {
      const prd = `
# Project

## Features

- **User Authentication**: Users can sign up and log in
- **Dashboard**: View analytics and metrics
- **Notifications**: Real-time alerts
      `;
      const parsed = parsePRD(prd);
      expect(parsed.features).toHaveLength(3);
      expect(parsed.features[0].name).toBe('User Authentication');
      expect(parsed.features[0].description).toContain('sign up and log in');
      expect(parsed.features[1].name).toBe('Dashboard');
      expect(parsed.features[2].name).toBe('Notifications');
    });

    test('should determine priority from feature text', async () => {
      const prd = `
## Features

- **Critical Feature**: High priority must-have
- **Medium Feature**: Should have this
- **Optional Feature**: Could implement later
      `;
      const parsed = parsePRD(prd);
      expect(parsed.features[0].priority).toBe('must');
      expect(parsed.features[1].priority).toBe('should');
      expect(parsed.features[2].priority).toBe('could');
    });

    test('should return empty array when no features section', async () => {
      const prd = '# Project\n\n## Description\n\nText here';
      const parsed = parsePRD(prd);
      expect(parsed.features).toHaveLength(0);
    });
  });

  test.test.describe('requirements extraction', () => {
    test('should extract requirements from list', async () => {
      const prd = `
## Requirements

- Fast performance under load
- Secure authentication with OAuth
- API for third-party integrations
      `;
      const parsed = parsePRD(prd);
      expect(parsed.requirements).toHaveLength(3);
      expect(parsed.requirements[0].description).toContain('performance');
      expect(parsed.requirements[1].description).toContain('authentication');
      expect(parsed.requirements[2].description).toContain('API');
    });

    test('should categorize requirements correctly', async () => {
      const prd = `
## Requirements

- High performance and scalability
- Secure data encryption
- RESTful API design
- User-friendly interface
      `;
      const parsed = parsePRD(prd);

      const nonFunctional = parsed.requirements.find((r) => r.description.includes('performance'));
      expect(nonFunctional?.category).toBe('non-functional');

      const technical = parsed.requirements.find((r) => r.description.includes('API'));
      expect(technical?.category).toBe('technical');

      const functional = parsed.requirements.find((r) => r.description.includes('interface'));
      expect(functional?.category).toBe('functional');
    });
  });

  test.test.describe('technical details extraction', () => {
    test('should extract technical details section', async () => {
      const prd = `
## Technical Details

The system will use microservices architecture
with event-driven communication.

## Other Section
      `;
      const parsed = parsePRD(prd);
      expect(parsed.technicalDetails).toContain('microservices');
      expect(parsed.technicalDetails).toContain('event-driven');
    });

    test('should extract from Implementation section', async () => {
      const prd = `
## Implementation

Using TypeScript and Node.js for backend.
      `;
      const parsed = parsePRD(prd);
      expect(parsed.technicalDetails).toContain('TypeScript');
    });

    test('should return undefined when no technical section', async () => {
      const prd = '# Project\n\n## Features';
      const parsed = parsePRD(prd);
      expect(parsed.technicalDetails).toBeUndefined();
    });
  });

  test.test.describe('complete PRD parsing', () => {
    test('should parse complex PRD correctly', async () => {
      const prd = `
# E-Commerce Platform

## Description

A modern e-commerce platform for online retail.
Support for multiple vendors and product categories.

## Features

- **Product Catalog**: Browse and search products with filters
- **Shopping Cart**: Add items and manage quantities (MUST have)
- **Payment Processing**: Secure checkout with multiple payment options (critical)
- **Order Tracking**: View order status and history (should have)

## Requirements

- Must support 10,000 concurrent users
- Secure payment processing with PCI compliance
- RESTful API for mobile apps
- User-friendly checkout flow

## Technical Details

Built with TypeScript and Next.js.
PostgreSQL for data storage.
Deployed on AWS with auto-scaling.
      `;

      const parsed = parsePRD(prd);

      expect(parsed.title).toBe('E-Commerce Platform');
      expect(parsed.description).toContain('modern e-commerce');
      expect(parsed.features).toHaveLength(4);
      expect(parsed.requirements).toHaveLength(4);
      expect(parsed.technicalDetails).toContain('TypeScript');

      // Check feature priorities
      const cart = parsed.features.find((f) => f.name === 'Shopping Cart');
      expect(cart?.priority).toBe('must');

      const payment = parsed.features.find((f) => f.name === 'Payment Processing');
      expect(payment?.priority).toBe('must');

      // Check requirement categories
      const performance = parsed.requirements.find((r) => r.description.includes('concurrent'));
      expect(performance?.category).toBe('non-functional');

      const api = parsed.requirements.find((r) => r.description.includes('API'));
      expect(api?.category).toBe('technical');
    });
  });
});
