/**
 * Integration tests with real ripperdoc CLI
 */

import { describe, it, expect } from 'vitest';
import { RipperdocClient, query } from '../src/client/index.js';

const RIPPERDOC_PATH = '/home/xiaohanhan/anaconda3/envs/ripperdoc/bin/ripperdoc';

describe('Integration Tests (with real ripperdoc CLI)', () => {
  describe('Basic Connection', () => {
    it('should connect to ripperdoc CLI', async () => {
      const client = new RipperdocClient({
        ripperdocPath: RIPPERDOC_PATH
      });

      try {
        await client.connect();
        expect(client.isConnected).toBe(true);
      } finally {
        await client.close();
      }
    }, 15000);
  });

  describe('Simple Query', () => {
    it('should perform a simple query', async () => {
      const messages: unknown[] = [];

      for await (const message of query('What is 2 + 2? Give a brief answer.', {
        ripperdocPath: RIPPERDOC_PATH,
        permissionMode: 'bypassPermissions'
      })) {
        messages.push(message);

        if (message.type === 'result') {
          break;
        }
      }

      expect(messages.length).toBeGreaterThan(0);

      // Find result message
      const result = messages.find((m: any) => m.type === 'result');
      expect(result).toBeDefined();
    }, 60000);

    it('should receive assistant messages', async () => {
      const assistantMessages: unknown[] = [];

      for await (const message of query('Say hello in one word.', {
        ripperdocPath: RIPPERDOC_PATH,
        permissionMode: 'bypassPermissions'
      })) {
        if (message.type === 'assistant') {
          assistantMessages.push(message);
        }

        if (message.type === 'result') {
          break;
        }
      }

      expect(assistantMessages.length).toBeGreaterThan(0);
    }, 60000);
  });

  describe('Persistent Client', () => {
    it('should handle multiple queries in one session', async () => {
      const client = new RipperdocClient({
        ripperdocPath: RIPPERDOC_PATH,
        permissionMode: 'bypassPermissions'
      });

      try {
        await client.connect();

        // First query
        await client.query('What is 1 + 1? Give a brief answer.');
        const messages1: unknown[] = [];
        for await (const message of client.receiveMessages()) {
          messages1.push(message);
          if (message.type === 'result') break;
        }

        // Second query
        await client.query('What is 2 + 2? Give a brief answer.');
        const messages2: unknown[] = [];
        for await (const message of client.receiveMessages()) {
          messages2.push(message);
          if (message.type === 'result') break;
        }

        expect(messages1.length).toBeGreaterThan(0);
        expect(messages2.length).toBeGreaterThan(0);
      } finally {
        await client.close();
      }
    }, 120000);
  });

  describe('Configuration Changes', () => {
    it('should change permission mode', async () => {
      const client = new RipperdocClient({
        ripperdocPath: RIPPERDOC_PATH
      });

      try {
        await client.connect();

        // Change to bypass permissions
        await client.setPermissionMode('bypassPermissions');

        // Should not throw
        await client.setPermissionMode('default');
      } finally {
        await client.close();
      }
    }, 15000);

    it('should change model', async () => {
      const client = new RipperdocClient({
        ripperdocPath: RIPPERDOC_PATH
      });

      try {
        await client.connect();

        // Change model
        await client.setModel('claude-3-5-haiku-20241022');
      } finally {
        await client.close();
      }
    }, 15000);
  });

  describe('Error Handling', () => {
    it('should throw when connecting to invalid path', async () => {
      const client = new RipperdocClient({
        ripperdocPath: '/nonexistent/ripperdoc'
      });

      await expect(client.connect()).rejects.toThrow();
    }, 10000);
  });
});
