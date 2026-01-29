/**
 * Protocol tests
 */

import { describe, it, expect } from 'vitest';
import {
  ControlRequestBuilder,
  isControlRequest,
  isControlResponse,
  isStreamMessage,
  type ControlRequest,
  type ControlResponse,
  type StreamProtocolMessage
} from '../src/protocol/index.js';

describe('Protocol', () => {
  describe('ControlRequestBuilder', () => {
    it('should build initialize request', () => {
      const request = ControlRequestBuilder.initialize({
        sessionId: 'test-session',
        model: 'claude-3-5-sonnet-20241022'
      });

      expect(request.type).toBe('control_request');
      expect(request.request.subtype).toBe('initialize');
      expect(request.request.options).toBeDefined();
      expect((request.request.options as { sessionId: string }).sessionId).toBe('test-session');
    });

    it('should build query request', () => {
      const request = ControlRequestBuilder.query('Hello, Ripperdoc!');

      expect(request.type).toBe('control_request');
      expect(request.request.subtype).toBe('query');
      expect(request.request.prompt).toBe('Hello, Ripperdoc!');
    });

    it('should build setPermissionMode request', () => {
      const request = ControlRequestBuilder.setPermissionMode('bypassPermissions');

      expect(request.type).toBe('control_request');
      expect(request.request.subtype).toBe('set_permission_mode');
      expect(request.request.mode).toBe('bypassPermissions');
    });

    it('should build setModel request', () => {
      const request = ControlRequestBuilder.setModel('gpt-4o');

      expect(request.type).toBe('control_request');
      expect(request.request.subtype).toBe('set_model');
      expect(request.request.model).toBe('gpt-4o');
    });

    it('should build canUseTool request', () => {
      const request = ControlRequestBuilder.canUseTool('Bash', { command: 'ls' });

      expect(request.type).toBe('control_request');
      expect(request.request.subtype).toBe('can_use_tool');
      expect(request.request.tool_name).toBe('Bash');
      expect(request.request.input).toEqual({ command: 'ls' });
    });

    it('should build getServerInfo request', () => {
      const request = ControlRequestBuilder.getServerInfo();

      expect(request.type).toBe('control_request');
      expect(request.request.subtype).toBe('get_server_info');
    });

    it('should build close request', () => {
      const request = ControlRequestBuilder.close();

      expect(request.type).toBe('control_request');
      expect(request.request.subtype).toBe('close');
    });

    it('should generate unique request IDs', () => {
      const id1 = ControlRequestBuilder.generateRequestId();
      const id2 = ControlRequestBuilder.generateRequestId();

      expect(id1).not.toBe(id2);
    });
  });

  describe('Type Guards', () => {
    describe('isControlRequest', () => {
      it('should return true for valid control request', () => {
        const request: ControlRequest = {
          type: 'control_request',
          request_id: 'req-123',
          request: {
            subtype: 'initialize',
            options: {}
          }
        };

        expect(isControlRequest(request)).toBe(true);
      });

      it('should return false for invalid type', () => {
        const invalid = { type: 'invalid' };
        expect(isControlRequest(invalid)).toBe(false);
      });

      it('should return false for missing request_id', () => {
        const invalid = {
          type: 'control_request',
          request: { subtype: 'initialize' }
        };
        expect(isControlRequest(invalid)).toBe(false);
      });

      it('should return false for missing request', () => {
        const invalid = {
          type: 'control_request',
          request_id: 'req-123'
        };
        expect(isControlRequest(invalid)).toBe(false);
      });

      it('should return false for null', () => {
        expect(isControlRequest(null)).toBe(false);
      });

      it('should return false for non-object', () => {
        expect(isControlRequest('string')).toBe(false);
        expect(isControlRequest(123)).toBe(false);
      });
    });

    describe('isControlResponse', () => {
      it('should return true for valid control response', () => {
        const response: ControlResponse = {
          type: 'control_response',
          request_id: 'req-123',
          response: {
            subtype: 'initialized',
            success: true
          }
        };

        expect(isControlResponse(response)).toBe(true);
      });

      it('should return false for invalid type', () => {
        const invalid = { type: 'invalid' };
        expect(isControlResponse(invalid)).toBe(false);
      });

      it('should return false for null', () => {
        expect(isControlResponse(null)).toBe(false);
      });
    });

    describe('isStreamMessage', () => {
      it('should return true for assistant message', () => {
        const message: StreamProtocolMessage = {
          type: 'assistant',
          content: []
        };

        expect(isStreamMessage(message)).toBe(true);
      });

      it('should return true for user message', () => {
        const message: StreamProtocolMessage = {
          type: 'user',
          content: []
        };

        expect(isStreamMessage(message)).toBe(true);
      });

      it('should return true for result message', () => {
        const message: StreamProtocolMessage = {
          type: 'result',
          result: { status: 'success' }
        };

        expect(isStreamMessage(message)).toBe(true);
      });

      it('should return true for error message', () => {
        const message: StreamProtocolMessage = {
          type: 'error',
          error: 'Something went wrong'
        };

        expect(isStreamMessage(message)).toBe(true);
      });

      it('should return false for invalid type', () => {
        const message = { type: 'invalid' };
        expect(isStreamMessage(message)).toBe(false);
      });

      it('should return false for null', () => {
        expect(isStreamMessage(null)).toBe(false);
      });
    });
  });

  describe('Serialization', () => {
    it('should serialize and deserialize requests', () => {
      const original = ControlRequestBuilder.query('test prompt');
      const serialized = JSON.stringify(original);
      const deserialized = JSON.parse(serialized) as ControlRequest;

      expect(deserialized.type).toBe(original.type);
      expect(deserialized.request_id).toBe(original.request_id);
      expect(deserialized.request.subtype).toBe(original.request.subtype);
    });

    it('should handle special characters in prompt', () => {
      const prompt = 'Test with "quotes" and \'apostrophes\' and \n newlines';
      const request = ControlRequestBuilder.query(prompt);
      const serialized = JSON.stringify(request);
      const deserialized = JSON.parse(serialized) as ControlRequest;

      expect(deserialized.request.prompt).toBe(prompt);
    });
  });
});
