/**
 * Client tests
 */

import { describe, it, expect } from 'vitest';
import {
  RipperdocSDKClient,
  query
} from '../src/client/index.js';
import {
  CLIConnectionError
} from '../src/errors/index.js';

describe('RipperdocSDKClient', () => {
  describe('Construction', () => {
    it('should create client with default options', () => {
      const client = new RipperdocSDKClient();
      expect(client).toBeDefined();
    });

    it('should create client with options', () => {
      const client = new RipperdocSDKClient({
        model: 'test-model',
        permission_mode: 'bypassPermissions'
      });
      expect(client).toBeDefined();
    });
  });

  describe('Connection', () => {
    it('should throw when operations called without connection', async () => {
      const client = new RipperdocSDKClient();

      await expect(client.query('test')).rejects.toThrow(CLIConnectionError);
      await expect(client.setPermissionMode('default')).rejects.toThrow(CLIConnectionError);
    });
  });

  describe('Type Checks', () => {
    it('should allow async iterators', async () => {
      const client = new RipperdocSDKClient();
      const iterator = client.receiveMessages();
      expect(typeof iterator[Symbol.asyncIterator]).toBe('function');
    });
  });
});

describe('query function', () => {
  it('should return an async generator', () => {
    const generator = query({ prompt: 'test' });
    expect(generator).toBeDefined();
    expect(typeof generator[Symbol.asyncIterator]).toBe('function');
  });

  it('should accept options', () => {
    const generator = query({
      prompt: 'test',
      options: {
        model: 'test-model',
        permission_mode: 'default'
      }
    });
    expect(generator).toBeDefined();
  });
});
