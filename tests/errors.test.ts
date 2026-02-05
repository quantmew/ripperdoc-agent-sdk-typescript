/**
 * Error tests
 */

import { describe, it, expect } from 'vitest';
import {
  RipperdocSDKError,
  CLIConnectionError,
  CLINotFoundError,
  ProcessError,
  CLIJSONDecodeError,
  MessageParseError
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
    it('should create with default message', () => {
      const error = new CLINotFoundError();
      expect(error.message).toContain('Ripperdoc Code not found');
      expect(error.name).toBe('CLINotFoundError');
    });

    it('should create with custom path', () => {
      const error = new CLINotFoundError('Not found', '/custom/path/to/cli');
      expect(error.message).toContain('/custom/path/to/cli');
    });
  });

  describe('ProcessError', () => {
    it('should create with exit code', () => {
      const error = new ProcessError('Process exited', 1);
      expect(error.message).toContain('exit code: 1');
      expect(error.exitCode).toBe(1);
    });

    it('should create with stderr', () => {
      const error = new ProcessError('Process exited', 1, 'bad');
      expect(error.message).toContain('Error output: bad');
      expect(error.stderr).toBe('bad');
    });
  });

  describe('CLIJSONDecodeError', () => {
    it('should include line snippet', () => {
      const error = new CLIJSONDecodeError('line', new Error('bad'));
      expect(error.message).toContain('Failed to decode JSON');
      expect(error.line).toBe('line');
    });
  });

  describe('MessageParseError', () => {
    it('should create parse error', () => {
      const error = new MessageParseError('Failed to parse');
      expect(error.message).toBe('Failed to parse');
      expect(error.data).toBeUndefined();
    });

    it('should store data', () => {
      const data = { bad: 'data' };
      const error = new MessageParseError('Parse error', data);
      expect(error.data).toBe(data);
    });
  });
});
