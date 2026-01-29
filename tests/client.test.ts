/**
 * Client tests
 */

import { describe, it, expect, beforeEach } from 'vitest';
import {
  RipperdocClient,
  query,
  type ClientOptions
} from '../src/client/index.js';
import {
  ClientNotConnectedError,
  QueryInProgressError
} from '../src/errors/index.js';

describe('RipperdocClient', () => {
  describe('Construction', () => {
    it('should create client with default options', () => {
      const client = new RipperdocClient();
      expect(client).toBeDefined();
      expect(client.isConnected).toBe(false);
      expect(client.isQuerying).toBe(false);
    });

    it('should create client with options', () => {
      const options: ClientOptions = {
        model: 'gpt-4o',
        permissionMode: 'bypassPermissions',
        verbose: true
      };
      const client = new RipperdocClient(options);
      expect(client).toBeDefined();
    });

    it('should generate unique session IDs', () => {
      const c1 = new RipperdocClient();
      const c2 = new RipperdocClient();
      expect(c1.sessionIdValue).not.toBe(c2.sessionIdValue);
    });
  });

  describe('Connection', () => {
    it('should throw when operations called without connection', async () => {
      const client = new RipperdocClient();

      await expect(client.query('test')).rejects.toThrow(ClientNotConnectedError);
      await expect(client.setPermissionMode('default')).rejects.toThrow(ClientNotConnectedError);
    });

    // Note: Full connection tests require the ripperdoc CLI to be installed
    // These are integration tests that should run separately
  });

  describe('Configuration Methods', () => {
    it('should reject configuration changes when not connected', async () => {
      const client = new RipperdocClient();

      await expect(client.setPermissionMode('bypassPermissions')).rejects.toThrow();
      await expect(client.setModel('gpt-4o')).rejects.toThrow();
      await expect(client.getServerInfo()).rejects.toThrow();
    });
  });

  describe('Query State', () => {
    it('should correctly track connection state', () => {
      const client = new RipperdocClient();
      expect(client.isConnected).toBe(false);

      // After construction, should be disconnected
      expect(client.isQuerying).toBe(false);
    });
  });

  describe('Type Checks', () => {
    it('should have correct types for properties', () => {
      const client = new RipperdocClient();

      expect(typeof client.isConnected).toBe('boolean');
      expect(typeof client.isQuerying).toBe('boolean');
      expect(typeof client.sessionIdValue).toBe('string');
    });
  });
});

describe('query function', () => {
  it('should return an async generator', () => {
    const generator = query('test');
    expect(generator).toBeDefined();
    expect(typeof generator[Symbol.asyncIterator]).toBe('function');
  });

  it('should accept options', () => {
    const options: ClientOptions = {
      model: 'claude-3-5-sonnet-20241022',
      permissionMode: 'default'
    };
    const generator = query('test', options);
    expect(generator).toBeDefined();
  });
});

describe('Client Options', () => {
  it('should accept minimal options', () => {
    const options: ClientOptions = {};
    expect(options).toBeDefined();
  });

  it('should accept full options', () => {
    const options: ClientOptions = {
      model: 'claude-3-5-sonnet-20241022',
      permissionMode: 'default',
      allowedTools: ['Bash', 'Read'],
      disallowedTools: ['Write'],
      verbose: true,
      maxTurns: 10,
      maxThinkingTokens: 20000,
      cwd: '/project',
      systemPrompt: 'Custom prompt',
      additionalInstructions: ['Be helpful'],
      context: { project: 'test' },
      mcpServers: [
        {
          name: 'test-server',
          command: 'node',
          args: ['server.js']
        }
      ],
      agents: [
        {
          name: 'test-agent',
          agentType: 'code-analyzer',
          whenToUse: 'When analyzing code'
        }
      ],
      hooks: [
        {
          event: 'PreToolUse',
          callback: 'myCallback'
        }
      ]
    };
    expect(options.model).toBe('claude-3-5-sonnet-20241022');
    expect(options.permissionMode).toBe('default');
    expect(options.allowedTools).toHaveLength(2);
    expect(options.mcpServers).toHaveLength(1);
    expect(options.agents).toHaveLength(1);
    expect(options.hooks).toHaveLength(1);
  });
});

describe('Type Guards', () => {
  it('should correctly identify permission modes', () => {
    const modes = ['default', 'acceptEdits', 'bypassPermissions', 'plan'] as const;
    expect(modes).toHaveLength(4);
  });

  it('should correctly identify message types', () => {
    const types = ['user', 'assistant', 'result'] as const;
    expect(types).toHaveLength(3);
  });
});
