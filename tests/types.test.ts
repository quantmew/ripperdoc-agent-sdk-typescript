/**
 * Type definition tests
 */

import { describe, it, expect } from 'vitest';
import type {
  PermissionMode,
  ContentBlock,
  TextBlock,
  ThinkingBlock,
  ToolUseBlock,
  ToolResultBlock,
  Message,
  UserMessage,
  AssistantMessage,
  SystemMessage,
  ResultMessage,
  StreamEvent,
  RipperdocAgentOptions,
  McpServerConfig,
  AgentDefinition,
  HookMatcher,
  PermissionResult,
  ToolPermissionContext
} from '../src/types/index.js';

describe('Type Definitions', () => {
  describe('PermissionMode', () => {
    it('should accept valid permission modes', () => {
      const modes: PermissionMode[] = ['default', 'acceptEdits', 'plan', 'bypassPermissions'];
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
        thinking: 'Let me think... ',
        signature: 'sig'
      };
      expect(block.type).toBe('thinking');
      expect(block.signature).toBe('sig');
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
        tool_use_id: 'tool-123',
        content: 'Command output',
        is_error: false
      };
      expect(block.type).toBe('tool_result');
      expect(block.content).toBe('Command output');
    });

    it('should allow ContentBlock union', () => {
      const blocks: ContentBlock[] = [
        { type: 'text', text: 'Hi' },
        { type: 'tool_use', id: 't1', name: 'Read', input: { path: 'x' } }
      ];
      expect(blocks).toHaveLength(2);
    });
  });

  describe('Messages', () => {
    it('should create valid UserMessage', () => {
      const message: UserMessage = {
        type: 'user',
        content: 'Hello'
      };
      expect(message.type).toBe('user');
    });

    it('should create valid AssistantMessage', () => {
      const message: AssistantMessage = {
        type: 'assistant',
        model: 'test-model',
        content: [{ type: 'text', text: 'Hi there!' }]
      };
      expect(message.type).toBe('assistant');
      expect(message.model).toBe('test-model');
    });

    it('should create valid SystemMessage', () => {
      const message: SystemMessage = {
        type: 'system',
        subtype: 'info',
        data: { foo: 'bar' }
      };
      expect(message.type).toBe('system');
      expect(message.subtype).toBe('info');
    });

    it('should create valid ResultMessage', () => {
      const message: ResultMessage = {
        type: 'result',
        subtype: 'success',
        duration_ms: 10,
        duration_api_ms: 5,
        is_error: false,
        num_turns: 1,
        session_id: 'sess-1'
      };
      expect(message.type).toBe('result');
      expect(message.session_id).toBe('sess-1');
    });

    it('should create valid StreamEvent', () => {
      const event: StreamEvent = {
        type: 'stream_event',
        uuid: 'evt-1',
        session_id: 'sess-1',
        event: { type: 'delta' }
      };
      expect(event.type).toBe('stream_event');
    });

    it('should allow Message union', () => {
      const messages: Message[] = [
        { type: 'user', content: 'Hi' },
        { type: 'assistant', model: 'm', content: [] }
      ];
      expect(messages).toHaveLength(2);
    });
  });

  describe('RipperdocAgentOptions', () => {
    it('should accept minimal options', () => {
      const options: RipperdocAgentOptions = {};
      expect(options).toBeDefined();
    });

    it('should accept full options', () => {
      const options: RipperdocAgentOptions = {
        model: 'test-model',
        permission_mode: 'default',
        allowed_tools: ['Bash', 'Read'],
        disallowed_tools: ['Write'],
        max_turns: 10,
        max_thinking_tokens: 20000,
        cwd: '/project',
        system_prompt: 'Custom prompt',
        mcp_servers: {
          server: { type: 'stdio', command: 'node', args: ['server.js'] }
        },
        agents: {
          reviewer: { description: 'Reviewer', prompt: 'Review code', tools: ['Read'] }
        },
        hooks: {
          PreToolUse: [{ matcher: 'Bash', hooks: [] }]
        }
      };
      expect(options.permission_mode).toBe('default');
      expect(options.allowed_tools).toHaveLength(2);
    });
  });

  describe('McpServerConfig', () => {
    it('should create valid stdio config', () => {
      const config: McpServerConfig = {
        type: 'stdio',
        command: 'node',
        args: ['server.js'],
        env: { NODE_ENV: 'test' }
      };
      expect(config.command).toBe('node');
    });
  });

  describe('AgentDefinition', () => {
    it('should create valid definition', () => {
      const config: AgentDefinition = {
        description: 'Test agent',
        prompt: 'Analyze code',
        tools: ['Read', 'Grep']
      };
      expect(config.description).toBe('Test agent');
    });
  });

  describe('HookMatcher', () => {
    it('should create valid matcher', () => {
      const matcher: HookMatcher = {
        matcher: 'Bash',
        hooks: []
      };
      expect(matcher.matcher).toBe('Bash');
    });
  });

  describe('Permission types', () => {
    it('should accept allow result', () => {
      const result: PermissionResult = { behavior: 'allow' };
      expect(result.behavior).toBe('allow');
    });

    it('should accept deny result', () => {
      const result: PermissionResult = { behavior: 'deny', message: 'Nope' };
      expect(result.behavior).toBe('deny');
    });

    it('should accept permission context', () => {
      const context: ToolPermissionContext = { suggestions: [] };
      expect(context.suggestions).toHaveLength(0);
    });
  });
});
