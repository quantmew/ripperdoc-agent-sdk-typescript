/**
 * Type definition tests
 */

import { describe, it, expect } from 'vitest';
import type {
  // Permission Modes
  PermissionMode,

  // Content Blocks
  ContentBlock,
  TextBlock,
  ThinkingBlock,
  ToolUseBlock,
  ToolResultBlock,
  ImageBlock,

  // Messages
  Message,
  UserMessage,
  AssistantMessage,
  SystemMessage,
  ResultMessage,
  StreamEvent,

  // Options
  RipperdocOptions,
  McpServerConfig,
  AgentConfig,
  HookConfig,

  // Permission Types
  PermissionRequest,
  PermissionResult,

  // Hook Types
  HookContext,

  // Server Types
  ServerInfo
} from '../src/types/index.js';

describe('Type Definitions', () => {
  describe('PermissionMode', () => {
    it('should accept valid permission modes', () => {
      const modes: PermissionMode[] = ['default', 'acceptEdits', 'bypassPermissions', 'plan'];
      expect(modes).toHaveLength(4);
    });
  });

  describe('ContentBlock', () => {
    it('should create valid TextBlock', () => {
      const block: TextBlock = {
        type: 'text',
        text: 'Hello, world!'
      };
      expect(block.type).toBe('text');
      expect(block.text).toBe('Hello, world!');
    });

    it('should create valid ThinkingBlock', () => {
      const block: ThinkingBlock = {
        type: 'thinking',
        thinking: 'Let me think...'
      };
      expect(block.type).toBe('thinking');
      expect(block.thinking).toBe('Let me think...');
    });

    it('should create valid ToolUseBlock', () => {
      const block: ToolUseBlock = {
        type: 'tool_use',
        id: 'tool-123',
        name: 'Bash',
        input: { command: 'ls' }
      };
      expect(block.type).toBe('tool_use');
      expect(block.name).toBe('Bash');
    });

    it('should create valid ToolResultBlock', () => {
      const block: ToolResultBlock = {
        type: 'tool_result',
        toolUseId: 'tool-123',
        content: 'Command output',
        isError: false
      };
      expect(block.type).toBe('tool_result');
      expect(block.content).toBe('Command output');
    });

    it('should create valid ImageBlock', () => {
      const block: ImageBlock = {
        type: 'image',
        source: {
          type: 'url',
          url: 'https://example.com/image.png'
        }
      };
      expect(block.type).toBe('image');
      expect(block.source.type).toBe('url');
    });
  });

  describe('Messages', () => {
    it('should create valid UserMessage', () => {
      const message: UserMessage = {
        type: 'user',
        role: 'user',
        content: [
          { type: 'text', text: 'Hello' }
        ]
      };
      expect(message.type).toBe('user');
      expect(message.role).toBe('user');
    });

    it('should create valid AssistantMessage', () => {
      const message: AssistantMessage = {
        type: 'assistant',
        role: 'assistant',
        content: [
          { type: 'text', text: 'Hi there!' }
        ]
      };
      expect(message.type).toBe('assistant');
      expect(message.role).toBe('assistant');
    });

    it('should create valid SystemMessage', () => {
      const message: SystemMessage = {
        type: 'system',
        role: 'system',
        content: 'You are a helpful assistant.'
      };
      expect(message.type).toBe('system');
      expect(message.role).toBe('system');
    });

    it('should create valid ResultMessage', () => {
      const message: ResultMessage = {
        type: 'result',
        result: {
          status: 'success',
          usage: {
            inputTokens: 100,
            outputTokens: 50
          }
        }
      };
      expect(message.type).toBe('result');
      expect(message.result.status).toBe('success');
    });
  });

  describe('RipperdocOptions', () => {
    it('should accept minimal options', () => {
      const options: RipperdocOptions = {};
      expect(options).toBeDefined();
    });

    it('should accept full options', () => {
      const options: RipperdocOptions = {
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
        mcpServers: [],
        agents: [],
        hooks: []
      };
      expect(options.model).toBe('claude-3-5-sonnet-20241022');
      expect(options.permissionMode).toBe('default');
    });
  });

  describe('McpServerConfig', () => {
    it('should create valid config', () => {
      const config: McpServerConfig = {
        name: 'test-server',
        command: 'node',
        args: ['server.js'],
        env: { NODE_ENV: 'test' }
      };
      expect(config.name).toBe('test-server');
      expect(config.command).toBe('node');
    });
  });

  describe('AgentConfig', () => {
    it('should create valid config', () => {
      const config: AgentConfig = {
        name: 'test-agent',
        agentType: 'code-analyzer',
        whenToUse: 'When analyzing code',
        tools: ['Read', 'Grep'],
        systemPrompt: 'You analyze code.',
        model: 'claude-3-5-sonnet-20241022'
      };
      expect(config.name).toBe('test-agent');
      expect(config.agentType).toBe('code-analyzer');
    });
  });

  describe('HookConfig', () => {
    it('should create valid config', () => {
      const config: HookConfig = {
        event: 'PreToolUse',
        callback: 'myCallback',
        pattern: {
          toolName: 'Bash'
        }
      };
      expect(config.event).toBe('PreToolUse');
      expect(config.callback).toBe('myCallback');
    });
  });

  describe('PermissionRequest', () => {
    it('should create valid request', () => {
      const request: PermissionRequest = {
        toolName: 'Bash',
        input: { command: 'rm -rf /' },
        reason: 'This is dangerous'
      };
      expect(request.toolName).toBe('Bash');
      expect(request.reason).toBe('This is dangerous');
    });
  });

  describe('PermissionResult', () => {
    it('should create allowed result', () => {
      const result: PermissionResult = {
        allowed: true
      };
      expect(result.allowed).toBe(true);
    });

    it('should create denied result with reason', () => {
      const result: PermissionResult = {
        allowed: false,
        reason: 'Too dangerous'
      };
      expect(result.allowed).toBe(false);
      expect(result.reason).toBe('Too dangerous');
    });
  });

  describe('HookContext', () => {
    it('should create valid context', () => {
      const context: HookContext = {
        toolName: 'Bash',
        input: { command: 'ls' },
        output: 'file1.txt\nfile2.txt'
      };
      expect(context.toolName).toBe('Bash');
    });
  });

  describe('ServerInfo', () => {
    it('should create valid server info', () => {
      const info: ServerInfo = {
        version: '1.0.0',
        features: ['stdio', 'mcp'],
        availableTools: ['Bash', 'Read'],
        availableModels: ['claude-3-5-sonnet-20241022']
      };
      expect(info.version).toBe('1.0.0');
      expect(info.features).toContain('stdio');
    });
  });
});
