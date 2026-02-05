/**
 * Protocol tests
 */

import { describe, it, expect } from 'vitest';
import {
  isControlRequest,
  isControlResponse,
  isStreamMessage,
  type ControlRequest,
  type ControlResponse
} from '../src/protocol/index.js';

describe('Protocol', () => {
  describe('Type Guards', () => {
    describe('isControlRequest', () => {
      it('should return true for valid control request', () => {
        const request: ControlRequest = {
          type: 'control_request',
          request_id: 'req-123',
          request: {
            subtype: 'initialize',
            hooks: null
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
          request: { subtype: 'initialize', hooks: null }
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
          response: {
            subtype: 'success',
            request_id: 'req-123',
            response: { ok: true }
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
        const message = {
          type: 'assistant',
          message: { content: [] }
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
});
