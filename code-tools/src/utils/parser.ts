/**
 * Code parsing utilities using TypeScript Compiler API for function listing
 * and simple regex for other operations (hybrid approach)
 */

import * as ts from 'typescript';
import fs from 'fs/promises';
import type { FunctionInfo } from './types.js';

/**
 * Parse TypeScript/JavaScript file using TS Compiler API
 */
export async function parseSourceFile(filePath: string): Promise<ts.SourceFile | null> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const sourceFile = ts.createSourceFile(filePath, content, ts.ScriptTarget.Latest, true);
    return sourceFile;
  } catch (error) {
    console.error(`Error parsing file ${filePath}:`, error);
    return null;
  }
}

/**
 * Extract all functions from a source file using TS Compiler API
 */
export function extractFunctions(sourceFile: ts.SourceFile): FunctionInfo[] {
  const functions: FunctionInfo[] = [];

  function visit(node: ts.Node): void {
    // Function declarations
    if (ts.isFunctionDeclaration(node)) {
      const func = extractFunctionInfo(node, sourceFile);
      if (func) functions.push(func);
    }
    // Arrow functions and function expressions assigned to variables
    else if (ts.isVariableStatement(node)) {
      node.declarationList.declarations.forEach((decl) => {
        if (
          decl.initializer &&
          (ts.isArrowFunction(decl.initializer) || ts.isFunctionExpression(decl.initializer))
        ) {
          const func = extractVariableFunctionInfo(decl, sourceFile);
          if (func) functions.push(func);
        }
      });
    }
    // Method declarations in classes
    else if (ts.isMethodDeclaration(node)) {
      const func = extractMethodInfo(node, sourceFile);
      if (func) functions.push(func);
    }

    ts.forEachChild(node, visit);
  }

  visit(sourceFile);
  return functions;
}

/**
 * Extract function information from function declaration
 */
function extractFunctionInfo(
  node: ts.FunctionDeclaration,
  sourceFile: ts.SourceFile
): FunctionInfo | null {
  if (!node.name) return null;

  const name = node.name.text;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const isExported = hasExportModifier(node);
  const isAsync = hasModifier(node, ts.SyntaxKind.AsyncKeyword);
  const parameters = extractParameters(node);
  const returnType = node.type ? node.type.getText(sourceFile) : undefined;
  const signature = node.getText(sourceFile).split('\n')[0].trim();

  return { name, line, signature, isExported, isAsync, parameters, returnType };
}

/**
 * Extract function information from variable declaration with function expression
 */
function extractVariableFunctionInfo(
  decl: ts.VariableDeclaration,
  sourceFile: ts.SourceFile
): FunctionInfo | null {
  if (!ts.isIdentifier(decl.name)) return null;
  if (!decl.initializer) return null;
  if (!ts.isArrowFunction(decl.initializer) && !ts.isFunctionExpression(decl.initializer)) {
    return null;
  }

  const name = decl.name.text;
  const line = sourceFile.getLineAndCharacterOfPosition(decl.getStart()).line + 1;
  const isExported = false; // Variable exports handled separately
  const isAsync = hasModifier(decl.initializer, ts.SyntaxKind.AsyncKeyword);
  const parameters = extractParameters(decl.initializer);
  const returnType = decl.initializer.type ? decl.initializer.type.getText(sourceFile) : undefined;
  const signature = decl.getText(sourceFile).split('\n')[0].trim();

  return { name, line, signature, isExported, isAsync, parameters, returnType };
}

/**
 * Extract method information from class method
 */
function extractMethodInfo(
  node: ts.MethodDeclaration,
  sourceFile: ts.SourceFile
): FunctionInfo | null {
  if (!ts.isIdentifier(node.name)) return null;

  const name = node.name.text;
  const line = sourceFile.getLineAndCharacterOfPosition(node.getStart()).line + 1;
  const isExported = false; // Methods are part of classes
  const isAsync = hasModifier(node, ts.SyntaxKind.AsyncKeyword);
  const parameters = extractParameters(node);
  const returnType = node.type ? node.type.getText(sourceFile) : undefined;
  const signature = node.getText(sourceFile).split('\n')[0].trim();

  return { name, line, signature, isExported, isAsync, parameters, returnType };
}

/**
 * Extract parameter names from function-like declaration
 */
function extractParameters(
  node: ts.FunctionDeclaration | ts.ArrowFunction | ts.FunctionExpression | ts.MethodDeclaration
): string[] {
  return node.parameters.map((param) => {
    if (ts.isIdentifier(param.name)) {
      return param.name.text;
    }
    return param.getText();
  });
}

/**
 * Check if node has export modifier
 */
function hasExportModifier(node: ts.Node): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  return modifiers?.some((mod) => mod.kind === ts.SyntaxKind.ExportKeyword) ?? false;
}

/**
 * Check if node has specific modifier
 */
function hasModifier(node: ts.Node, kind: ts.SyntaxKind): boolean {
  if (!ts.canHaveModifiers(node)) return false;
  const modifiers = ts.getModifiers(node);
  return modifiers?.some((mod) => mod.kind === kind) ?? false;
}

/**
 * Simple regex-based function extraction (fallback)
 */
export function extractFunctionsSimple(content: string): Array<{ name: string; line: number }> {
  const functions: Array<{ name: string; line: number }> = [];
  const lines = content.split('\n');

  // Match function declarations, arrow functions, and methods
  const patterns = [
    /^(?:export\s+)?(?:async\s+)?function\s+(\w+)/,
    /^(?:export\s+)?const\s+(\w+)\s*=\s*(?:async\s+)?\([^)]*\)\s*=>/,
    /^\s*(?:async\s+)?(\w+)\s*\([^)]*\)\s*\{/,
  ];

  lines.forEach((line, index) => {
    for (const pattern of patterns) {
      const match = line.match(pattern);
      if (match) {
        functions.push({ name: match[1], line: index + 1 });
        break;
      }
    }
  });

  return functions;
}

/**
 * Read file content
 */
export async function readFileContent(filePath: string): Promise<string> {
  return fs.readFile(filePath, 'utf-8');
}

/**
 * Check if file is TypeScript/JavaScript
 */
export function isTypeScriptOrJavaScript(filePath: string): boolean {
  return /\.(ts|tsx|js|jsx|mjs|cjs)$/.test(filePath);
}
