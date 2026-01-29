/**
 * Configuration tests
 */

import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  DEFAULT_CONFIG,
  ANTHROPIC_MODELS,
  OPENAI_MODELS,
  DEEPSEEK_MODELS,
  ALL_MODELS,
  BUILTIN_TOOLS,
  READ_ONLY_TOOLS,
  DANGEROUS_TOOLS,
  PERMISSION_MODES,
  PERMISSION_MODE_DESCRIPTIONS,
  ENV_VARS,
  getEnv,
  getEnvBool,
  getEnvNumber,
  isReadOnlyTool,
  isDangerousTool,
  isValidModel,
  isValidPermissionMode,
  normalizeToolName,
  filterTools,
  cloneOptions,
  mergeOptions
} from '../src/config/index.js';

describe('Configuration', () => {
  describe('Constants', () => {
    it('should have default config values', () => {
      expect(DEFAULT_CONFIG.DEFAULT_MODEL).toBeDefined();
      expect(DEFAULT_CONFIG.DEFAULT_PERMISSION_MODE).toBe('default');
      expect(DEFAULT_CONFIG.STARTUP_TIMEOUT).toBe(10000);
    });

    it('should have anthropic models', () => {
      expect(ANTHROPIC_MODELS).toContain('claude-3-5-sonnet-20241022');
      expect(ANTHROPIC_MODELS).toContain('claude-3-5-haiku-20241022');
    });

    it('should have openai models', () => {
      expect(OPENAI_MODELS).toContain('gpt-4o');
      expect(OPENAI_MODELS).toContain('gpt-4o-mini');
    });

    it('should have deepseek models', () => {
      expect(DEEPSEEK_MODELS).toContain('deepseek-chat');
      expect(DEEPSEEK_MODELS).toContain('deepseek-coder');
    });

    it('should have all models combined', () => {
      expect(ALL_MODELS.length).toBeGreaterThan(0);
      expect(ALL_MODELS).toContain('claude-3-5-sonnet-20241022');
      expect(ALL_MODELS).toContain('gpt-4o');
      expect(ALL_MODELS).toContain('deepseek-chat');
    });

    it('should have builtin tools', () => {
      expect(BUILTIN_TOOLS).toContain('Bash');
      expect(BUILTIN_TOOLS).toContain('Read');
      expect(BUILTIN_TOOLS).toContain('Edit');
      expect(BUILTIN_TOOLS).toContain('Write');
    });

    it('should have read only tools', () => {
      expect(READ_ONLY_TOOLS).toContain('Read');
      expect(READ_ONLY_TOOLS).toContain('Glob');
      expect(READ_ONLY_TOOLS).toContain('Grep');
      expect(READ_ONLY_TOOLS).not.toContain('Bash');
    });

    it('should have dangerous tools', () => {
      expect(DANGEROUS_TOOLS).toContain('Bash');
      expect(DANGEROUS_TOOLS).toContain('Edit');
      expect(DANGEROUS_TOOLS).toContain('Write');
    });

    it('should have permission modes', () => {
      expect(PERMISSION_MODES).toContain('default');
      expect(PERMISSION_MODES).toContain('acceptEdits');
      expect(PERMISSION_MODES).toContain('bypassPermissions');
      expect(PERMISSION_MODES).toContain('plan');
    });

    it('should have permission mode descriptions', () => {
      expect(PERMISSION_MODE_DESCRIPTIONS.default).toBeDefined();
      expect(PERMISSION_MODE_DESCRIPTIONS.acceptEdits).toBeDefined();
      expect(PERMISSION_MODE_DESCRIPTIONS.bypassPermissions).toBeDefined();
      expect(PERMISSION_MODE_DESCRIPTIONS.plan).toBeDefined();
    });

    it('should have env vars', () => {
      expect(ENV_VARS.RIPPERDOC_PATH).toBe('RIPPERDOC_PATH');
      expect(ENV_VARS.RIPPERDOC_MODEL).toBe('RIPPERDOC_MODEL');
      expect(ENV_VARS.RIPPERDOC_PERMISSION_MODE).toBe('RIPPERDOC_PERMISSION_MODE');
    });
  });

  describe('Environment Variable Helpers', () => {
    const originalEnv = process.env;

    beforeEach(() => {
      // Reset environment
      process.env = { ...originalEnv };
    });

    afterEach(() => {
      process.env = originalEnv;
    });

    describe('getEnv', () => {
      it('should return value from environment', () => {
        process.env.TEST_VAR = 'test-value';
        expect(getEnv('TEST_VAR')).toBe('test-value');
      });

      it('should return default when not set', () => {
        expect(getEnv('NONEXISTENT_VAR', 'default')).toBe('default');
      });

      it('should return undefined when not set and no default', () => {
        expect(getEnv('NONEXISTENT_VAR')).toBeUndefined();
      });
    });

    describe('getEnvBool', () => {
      it('should return true for "1"', () => {
        process.env.TEST_BOOL = '1';
        expect(getEnvBool('TEST_BOOL')).toBe(true);
      });

      it('should return true for "true"', () => {
        process.env.TEST_BOOL = 'true';
        expect(getEnvBool('TEST_BOOL')).toBe(true);
      });

      it('should return true for "TRUE"', () => {
        process.env.TEST_BOOL = 'TRUE';
        expect(getEnvBool('TEST_BOOL')).toBe(true);
      });

      it('should return false for "0"', () => {
        process.env.TEST_BOOL = '0';
        expect(getEnvBool('TEST_BOOL')).toBe(false);
      });

      it('should return false for "false"', () => {
        process.env.TEST_BOOL = 'false';
        expect(getEnvBool('TEST_BOOL')).toBe(false);
      });

      it('should return default when not set', () => {
        expect(getEnvBool('NONEXISTENT_BOOL', true)).toBe(true);
        expect(getEnvBool('NONEXISTENT_BOOL')).toBe(false);
      });
    });

    describe('getEnvNumber', () => {
      it('should return parsed number', () => {
        process.env.TEST_NUMBER = '42';
        expect(getEnvNumber('TEST_NUMBER')).toBe(42);
      });

      it('should return default when not set', () => {
        expect(getEnvNumber('NONEXISTENT_NUMBER', 10)).toBe(10);
      });

      it('should return undefined when not set and no default', () => {
        expect(getEnvNumber('NONEXISTENT_NUMBER')).toBeUndefined();
      });

      it('should return default for invalid number', () => {
        process.env.TEST_NUMBER = 'not-a-number';
        expect(getEnvNumber('TEST_NUMBER', 10)).toBe(10);
      });
    });
  });

  describe('Tool Helpers', () => {
    describe('isReadOnlyTool', () => {
      it('should return true for read-only tools', () => {
        expect(isReadOnlyTool('Read')).toBe(true);
        expect(isReadOnlyTool('Glob')).toBe(true);
        expect(isReadOnlyTool('Grep')).toBe(true);
        expect(isReadOnlyTool('LS')).toBe(true);
        expect(isReadOnlyTool('LSP')).toBe(true);
      });

      it('should return false for non-read-only tools', () => {
        expect(isReadOnlyTool('Bash')).toBe(false);
        expect(isReadOnlyTool('Edit')).toBe(false);
        expect(isReadOnlyTool('Write')).toBe(false);
      });

      it('should be case-sensitive', () => {
        expect(isReadOnlyTool('read')).toBe(false);
        expect(isReadOnlyTool('READ')).toBe(false);
      });
    });

    describe('isDangerousTool', () => {
      it('should return true for dangerous tools', () => {
        expect(isDangerousTool('Bash')).toBe(true);
        expect(isDangerousTool('Edit')).toBe(true);
        expect(isDangerousTool('Write')).toBe(true);
        expect(isDangerousTool('BackgroundShell')).toBe(true);
      });

      it('should return false for safe tools', () => {
        expect(isDangerousTool('Read')).toBe(false);
        expect(isDangerousTool('Glob')).toBe(false);
      });
    });

    describe('normalizeToolName', () => {
      it('should trim whitespace', () => {
        expect(normalizeToolName('  Bash  ')).toBe('Bash');
      });

      it('should match case-insensitively for builtin tools', () => {
        expect(normalizeToolName('bash')).toBe('Bash');
        expect(normalizeToolName('BASH')).toBe('Bash');
        expect(normalizeToolName('read')).toBe('Read');
      });

      it('should preserve unknown tool names', () => {
        expect(normalizeToolName('custom-tool')).toBe('custom-tool');
        expect(normalizeToolName('CustomTool')).toBe('CustomTool');
      });
    });

    describe('filterTools', () => {
      const allTools = ['Bash', 'Read', 'Edit', 'Write', 'Glob', 'Grep'];

      it('should return all tools when no filters', () => {
        const filtered = filterTools(allTools);
        expect(filtered).toEqual(allTools);
      });

      it('should filter by allowed tools only', () => {
        const filtered = filterTools(allTools, ['Bash', 'Read']);
        expect(filtered).toEqual(['Bash', 'Read']);
      });

      it('should filter by disallowed tools', () => {
        const filtered = filterTools(allTools, undefined, ['Bash', 'Edit']);
        expect(filtered).toContain('Read');
        expect(filtered).toContain('Write');
        expect(filtered).not.toContain('Bash');
        expect(filtered).not.toContain('Edit');
      });

      it('should apply both allowed and disallowed filters', () => {
        const filtered = filterTools(allTools, ['Bash', 'Read', 'Edit', 'Write'], ['Edit']);
        expect(filtered).toEqual(['Bash', 'Read', 'Write']);
      });

      it('should be case-insensitive', () => {
        const filtered = filterTools(allTools, ['bash', 'read']);
        expect(filtered).toEqual(['Bash', 'Read']);
      });
    });
  });

  describe('Validation Helpers', () => {
    describe('isValidModel', () => {
      it('should return true for valid models', () => {
        expect(isValidModel('claude-3-5-sonnet-20241022')).toBe(true);
        expect(isValidModel('gpt-4o')).toBe(true);
        expect(isValidModel('deepseek-chat')).toBe(true);
      });

      it('should return false for invalid models', () => {
        expect(isValidModel('invalid-model')).toBe(false);
        expect(isValidModel('')).toBe(false);
      });
    });

    describe('isValidPermissionMode', () => {
      it('should return true for valid modes', () => {
        expect(isValidPermissionMode('default')).toBe(true);
        expect(isValidPermissionMode('acceptEdits')).toBe(true);
        expect(isValidPermissionMode('bypassPermissions')).toBe(true);
        expect(isValidPermissionMode('plan')).toBe(true);
      });

      it('should return false for invalid modes', () => {
        expect(isValidPermissionMode('invalid')).toBe(false);
        expect(isValidPermissionMode('')).toBe(false);
        expect(isValidPermissionMode('Default')).toBe(false);
      });
    });
  });

  describe('Utility Functions', () => {
    describe('cloneOptions', () => {
      it('should create deep copy of object', () => {
        const original = {
          string: 'value',
          number: 42,
          nested: { value: 'nested' },
          array: [1, 2, 3]
        };
        const cloned = cloneOptions(original);

        expect(cloned).toEqual(original);
        expect(cloned).not.toBe(original);
        expect(cloned.nested).not.toBe(original.nested);
        expect(cloned.array).not.toBe(original.array);
      });

      it('should handle empty objects', () => {
        expect(cloneOptions({})).toEqual({});
      });
    });

    describe('mergeOptions', () => {
      it('should return defaults when no options', () => {
        const defaults = { a: 1, b: 2 };
        expect(mergeOptions(defaults)).toEqual(defaults);
      });

      it('should merge options with defaults', () => {
        const defaults = { a: 1, b: 2 };
        const options = { b: 3, c: 4 };
        expect(mergeOptions(defaults, options)).toEqual({ a: 1, b: 3, c: 4 });
      });

      it('should not modify defaults', () => {
        const defaults = { a: 1, b: 2 };
        mergeOptions(defaults, { b: 3 });
        expect(defaults.b).toBe(2);
      });
    });
  });
});
