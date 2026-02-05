/**
 * Integration tests with real ripperdoc CLI
 */

import { describe, it, expect } from 'vitest';
import { RipperdocSDKClient, query } from '../src/client/index.js';

const RIPPERDOC_PATH = '/home/xiaohanhan/anaconda3/envs/ripperdoc/bin/ripperdoc';

describe('Integration Tests (with real ripperdoc CLI)', () => {
  describe('Basic Connection', () => {
    it('should connect to ripperdoc CLI', async () => {
      const client = new RipperdocSDKClient({
        cli_path: RIPPERDOC_PATH
      });

      try {
        await client.connect();
        expect(true).toBe(true);
      } finally {
        await client.disconnect();
      }
    }, 15000);
  });

  describe('Simple Query', () => {
    it('should perform a simple query', async () => {
      const messages: unknown[] = [];

      for await (const message of query({
        prompt: 'What is 2 + 2? Give a brief answer.',
        options: {
          cli_path: RIPPERDOC_PATH,
          permission_mode: 'bypassPermissions'
        }
      })) {
        messages.push(message);

        if ((message as { type?: string }).type === 'result') {
          break;
        }
      }

      expect(messages.length).toBeGreaterThan(0);
      const result = messages.find((m: any) => m.type === 'result');
      expect(result).toBeDefined();
    }, 60000);

    it('should receive assistant messages', async () => {
      const assistantMessages: unknown[] = [];

      for await (const message of query({
        prompt: 'Say hello in one word.',
        options: {
          cli_path: RIPPERDOC_PATH,
          permission_mode: 'bypassPermissions'
        }
      })) {
        if ((message as { type?: string }).type === 'assistant') {
          assistantMessages.push(message);
        }

        if ((message as { type?: string }).type === 'result') {
          break;
        }
      }

      expect(assistantMessages.length).toBeGreaterThan(0);
    }, 60000);
  });
});
