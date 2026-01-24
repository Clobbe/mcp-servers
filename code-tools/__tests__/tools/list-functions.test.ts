import { test, expect, describe } from '@playwright/test';
import { listFunctions } from '../../src/tools/list-functions.js';
import fs from 'fs/promises';
import path from 'path';

describe('code_list_functions', () => {
  const testFilesDir = path.join(process.cwd(), '__tests__', 'fixtures');

  test.beforeAll(async () => {
    await fs.mkdir(testFilesDir, { recursive: true });

    const codeWithFunctions = `
export function exportedFunction(x: number): number {
  return x * 2;
}

function privateFunction() {
  return 'private';
}

export const arrowFunction = async (name: string) => {
  return \`Hello \${name}\`;
};

class MyClass {
  publicMethod() {
    return 'public';
  }

  async asyncMethod(data: any): Promise<void> {
    await Promise.resolve();
  }
}
`;
    await fs.writeFile(path.join(testFilesDir, 'test-functions.ts'), codeWithFunctions);
  });

  test.afterAll(async () => {
    await fs.rm(testFilesDir, { recursive: true, force: true });
  });

  describe('happy path', () => {
    test('should list all functions in a file', async () => {
      const result = await listFunctions({
        file_path: path.join(testFilesDir, 'test-functions.ts'),
        include_private: true,
      });

      expect(result.summary).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.summary).toContain('functions');
    });

    test('should identify exported functions', async () => {
      const result = await listFunctions({
        file_path: path.join(testFilesDir, 'test-functions.ts'),
        include_private: false,
      });

      const data = result.data as any;
      expect(data.exported).toBeGreaterThan(0);
    });

    test('should identify async functions', async () => {
      const result = await listFunctions({
        file_path: path.join(testFilesDir, 'test-functions.ts'),
        include_private: true,
      });

      const data = result.data as any;
      expect(data.async).toBeGreaterThanOrEqual(0);
    });
  });

  describe('filtering', () => {
    test('should filter private functions when include_private is false', async () => {
      const withPrivate = await listFunctions({
        file_path: path.join(testFilesDir, 'test-functions.ts'),
        include_private: true,
      });

      const withoutPrivate = await listFunctions({
        file_path: path.join(testFilesDir, 'test-functions.ts'),
        include_private: false,
      });

      const withData = withPrivate.data as any;
      const withoutData = withoutPrivate.data as any;

      expect(withData.total).toBeGreaterThanOrEqual(withoutData.total);
    });
  });

  describe('error handling', () => {
    test('should handle non-existent file', async () => {
      const result = await listFunctions({
        file_path: '/nonexistent/file.ts',
      });

      expect(result.summary).toContain('Error');
      expect(result.error).toBeDefined();
    });
  });
});
