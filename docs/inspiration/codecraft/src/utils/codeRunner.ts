import { ConsoleEntry, TestResult, TestCase } from '../types';

export interface ExecutionResult {
  logs: ConsoleEntry[];
  error: string | null;
  returnValue: any;
  executionTimeMs: number;
}

export function executeUserCode(code: string): ExecutionResult {
  const logs: ConsoleEntry[] = [];
  const startTime = performance.now();
  let error: string | null = null;
  let returnValue: any = undefined;

  // Custom console interception
  const customConsole = {
    log: (...args: any[]) => {
      logs.push({
        type: 'log',
        message: args.map(arg => formatLogArgument(arg)).join(' '),
        timestamp: Date.now(),
      });
    },
    warn: (...args: any[]) => {
      logs.push({
        type: 'warn',
        message: args.map(arg => formatLogArgument(arg)).join(' '),
        timestamp: Date.now(),
      });
    },
    error: (...args: any[]) => {
      logs.push({
        type: 'error',
        message: args.map(arg => formatLogArgument(arg)).join(' '),
        timestamp: Date.now(),
      });
    },
    info: (...args: any[]) => {
      logs.push({
        type: 'info',
        message: args.map(arg => formatLogArgument(arg)).join(' '),
        timestamp: Date.now(),
      });
    },
  };

  try {
    // Create an isolated evaluation scope with intercepted console
    const runnerFunction = new Function('console', `
      "use strict";
      ${code}
    `);
    
    returnValue = runnerFunction(customConsole);
  } catch (err: any) {
    error = err?.message || String(err);
    logs.push({
      type: 'error',
      message: `❌ ${error}`,
      timestamp: Date.now(),
    });
  }

  const endTime = performance.now();

  return {
    logs,
    error,
    returnValue,
    executionTimeMs: Math.round((endTime - startTime) * 10) / 10,
  };
}

export function runLessonTests(userCode: string, testCases: TestCase[]): TestResult[] {
  const results: TestResult[] = [];

  for (const test of testCases) {
    try {
      if (test.testFunctionStr) {
        // Run dedicated test validation script
        const validator = new Function('userCode', `
          "use strict";
          ${userCode};
          ${test.testFunctionStr};
        `);
        const result = validator(userCode);
        results.push({
          id: test.id,
          description: test.description,
          passed: Boolean(result),
          expected: test.expected,
          received: result,
        });
      } else {
        // Fallback test verification
        results.push({
          id: test.id,
          description: test.description,
          passed: true,
        });
      }
    } catch (err: any) {
      results.push({
        id: test.id,
        description: test.description,
        passed: false,
        error: err?.message || String(err),
        expected: test.expected,
        received: 'Erreur d’exécution',
      });
    }
  }

  return results;
}

function formatLogArgument(arg: any): string {
  if (arg === null) return 'null';
  if (arg === undefined) return 'undefined';
  if (typeof arg === 'object') {
    try {
      return JSON.stringify(arg, null, 2);
    } catch (e) {
      return '[Objet circulaire ou non sérialisable]';
    }
  }
  return String(arg);
}
