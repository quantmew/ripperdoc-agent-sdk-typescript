/**
 * Error tests
 */

import { describe, it, expect } from 'vitest';
import {
  RipperdocSDKError,
  CLIConnectionError,
  CLINotFoundError,
  ProcessError,
  MessageParseError,
  InvalidMessageError,
  TransportError,
  WriteError,
  ReadError,
  StreamError,
  StreamClosedError,
  ClientError,
  ClientNotConnectedError,
  ClientAlreadyConnectedError,
  QueryInProgressError,
  NoActiveQueryError,
  ResponseError,
  QueryFailedError,
  InitializationError,
  TimeoutError,
  isRipperdocSDKError,
  isConnectionError,
  isProcessError,
  isTransportError,
  isClientError,
  getErrorMessage
} from '../src/errors/index.js';

describe('Errors', () => {
  describe('RipperdocSDKError', () => {
    it('should create base error', () => {
      const error = new RipperdocSDKError('Base error');
      expect(error.message).toBe('Base error');
      expect(error.name).toBe('RipperdocSDKError');
    });

    it('should be instance of Error', () => {
      const error = new RipperdocSDKError('test');
      expect(error instanceof Error).toBe(true);
    });
  });

  describe('CLIConnectionError', () => {
    it('should create connection error', () => {
      const error = new CLIConnectionError('Connection failed');
      expect(error.message).toBe('Connection failed');
      expect(error.name).toBe('CLIConnectionError');
    });

    it('should extend RipperdocSDKError', () => {
      const error = new CLIConnectionError('test');
      expect(error instanceof RipperdocSDKError).toBe(true);
    });
  });

  describe('CLINotFoundError', () => {
    it('should create with default path', () => {
      const error = new CLINotFoundError();
      expect(error.message).toContain('ripperdoc');
      expect(error.name).toBe('CLINotFoundError');
    });

    it('should create with custom path', () => {
      const error = new CLINotFoundError('/custom/path/to/cli');
      expect(error.message).toContain('/custom/path/to/cli');
    });
  });

  describe('ProcessError', () => {
    it('should create with exit code', () => {
      const error = new ProcessError('Process exited', 1);
      expect(error.message).toBe('Process exited');
      expect(error.exitCode).toBe(1);
      expect(error.signal).toBeNull();
    });

    it('should create with signal', () => {
      const error = new ProcessError('Process killed', null, 'SIGTERM');
      expect(error.signal).toBe('SIGTERM');
    });

    it('should format toString with exit code', () => {
      const error = new ProcessError('test', 127);
      expect(error.toString()).toContain('exit code: 127');
    });

    it('should format toString with signal', () => {
      const error = new ProcessError('test', null, 'SIGKILL');
      expect(error.toString()).toContain('signal: SIGKILL');
    });
  });

  describe('MessageParseError', () => {
    it('should create parse error', () => {
      const error = new MessageParseError('Failed to parse');
      expect(error.message).toBe('Failed to parse');
      expect(error.raw).toBeUndefined();
    });

    it('should store raw message', () => {
      const raw = '{"invalid": json}';
      const error = new MessageParseError('Parse error', raw);
      expect(error.raw).toBe(raw);
    });
  });

  describe('InvalidMessageError', () => {
    it('should extend MessageParseError', () => {
      const error = new InvalidMessageError('Invalid');
      expect(error instanceof MessageParseError).toBe(true);
    });
  });

  describe('TransportError', () => {
    it('should create without cause', () => {
      const error = new TransportError('Transport failed');
      expect(error.message).toBe('Transport failed');
      expect(error.cause).toBeUndefined();
    });

    it('should create with cause', () => {
      const cause = new Error('Underlying error');
      const error = new TransportError('Transport failed', cause);
      expect(error.cause).toBe(cause);
    });
  });

  describe('WriteError', () => {
    it('should extend TransportError', () => {
      const error = new WriteError('Write failed');
      expect(error instanceof TransportError).toBe(true);
    });
  });

  describe('ReadError', () => {
    it('should extend TransportError', () => {
      const error = new ReadError('Read failed');
      expect(error instanceof TransportError).toBe(true);
    });
  });

  describe('StreamError', () => {
    it('should create stream error', () => {
      const error = new StreamError('Stream error');
      expect(error.name).toBe('StreamError');
    });
  });

  describe('StreamClosedError', () => {
    it('should have default message', () => {
      const error = new StreamClosedError();
      expect(error.message).toBe('Stream has been closed');
    });
  });

  describe('ClientError', () => {
    it('should create client error', () => {
      const error = new ClientError('Client error');
      expect(error.name).toBe('ClientError');
    });
  });

  describe('ClientNotConnectedError', () => {
    it('should have default message', () => {
      const error = new ClientNotConnectedError();
      expect(error.message).toContain('not connected');
    });
  });

  describe('ClientAlreadyConnectedError', () => {
    it('should have default message', () => {
      const error = new ClientAlreadyConnectedError();
      expect(error.message).toContain('already connected');
    });
  });

  describe('QueryInProgressError', () => {
    it('should have default message', () => {
      const error = new QueryInProgressError();
      expect(error.message).toContain('already in progress');
    });
  });

  describe('NoActiveQueryError', () => {
    it('should have default message', () => {
      const error = new NoActiveQueryError();
      expect(error.message).toContain('No active query');
    });
  });

  describe('ResponseError', () => {
    it('should create without code', () => {
      const error = new ResponseError('Response error');
      expect(error.message).toBe('Response error');
      expect(error.code).toBeUndefined();
    });

    it('should create with code', () => {
      const error = new ResponseError('Response error', 'ERR_001');
      expect(error.code).toBe('ERR_001');
    });
  });

  describe('QueryFailedError', () => {
    it('should extend ResponseError', () => {
      const error = new QueryFailedError('Query failed');
      expect(error instanceof ResponseError).toBe(true);
    });
  });

  describe('InitializationError', () => {
    it('should extend ResponseError', () => {
      const error = new InitializationError('Init failed');
      expect(error instanceof ResponseError).toBe(true);
    });
  });

  describe('TimeoutError', () => {
    it('should store timeout value', () => {
      const error = new TimeoutError('Timeout occurred', 5000);
      expect(error.timeout).toBe(5000);
      expect(error.message).toBe('Timeout occurred');
    });
  });

  describe('Error Guards', () => {
    it('should identify SDK errors', () => {
      const error = new CLIConnectionError('test');
      expect(isRipperdocSDKError(error)).toBe(true);
      expect(isRipperdocSDKError(new Error('test'))).toBe(false);
    });

    it('should identify connection errors', () => {
      const error = new CLIConnectionError('test');
      expect(isConnectionError(error)).toBe(true);
      expect(isConnectionError(new ProcessError('test'))).toBe(false);
    });

    it('should identify process errors', () => {
      const error = new ProcessError('test', 1);
      expect(isProcessError(error)).toBe(true);
      expect(isProcessError(new CLIConnectionError('test'))).toBe(false);
    });

    it('should identify transport errors', () => {
      const error = new WriteError('test');
      expect(isTransportError(error)).toBe(true);
      expect(isTransportError(new ClientError('test'))).toBe(false);
    });

    it('should identify client errors', () => {
      const error = new ClientNotConnectedError();
      expect(isClientError(error)).toBe(true);
      expect(isClientError(new TransportError('test'))).toBe(false);
    });
  });

  describe('getErrorMessage', () => {
    it('should extract message from Error', () => {
      const error = new Error('Test error');
      expect(getErrorMessage(error)).toBe('Test error');
    });

    it('should convert non-Error to string', () => {
      expect(getErrorMessage('string error')).toBe('string error');
      expect(getErrorMessage(123)).toBe('123');
      expect(getErrorMessage(null)).toBe('null');
      expect(getErrorMessage(undefined)).toBe('undefined');
    });
  });
});
