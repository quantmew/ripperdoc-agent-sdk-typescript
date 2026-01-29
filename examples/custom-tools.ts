/**
 * Custom tools and MCP server examples
 */

import { RipperdocClient } from '../src/index.js';

// ============================================================================
// Example 1: Using Custom MCP Servers
// ============================================================================

export async function example1_mcpServers() {
  console.log('=== Example 1: Custom MCP Servers ===\n');

  const client = new RipperdocClient({
    mcpServers: [
      {
        name: 'filesystem',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-filesystem', '/tmp']
      },
      {
        name: 'git',
        command: 'npx',
        args: ['-y', '@modelcontextprotocol/server-git']
      },
      {
        name: 'custom-server',
        command: 'node',
        args: ['./my-mcp-server.js'],
        env: {
          API_KEY: process.env.API_KEY ?? ''
        }
      }
    ]
  });

  try {
    await client.connect();
    await client.query('Use the filesystem and git tools to analyze this repository');

    for await (const message of client.receiveMessages()) {
      if (message.type === 'assistant') {
        const assistantMsg = message as any;
        for (const block of assistantMsg.content) {
          if (block.type === 'tool_use') {
            console.log(`\nUsing tool: ${block.name}`);
            if (block.name.startsWith('mcp_')) {
              console.log('  (MCP Server Tool)');
            }
          }
        }
      }

      if (message.type === 'result') {
        break;
      }
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Example 2: Using Programmatic Agents
// ============================================================================

export async function example2_programmaticAgents() {
  console.log('=== Example 2: Programmatic Agents ===\n');

  const client = new RipperdocClient({
    agents: [
      {
        name: 'code-reviewer',
        agentType: 'code-analyzer',
        whenToUse: 'When reviewing code for best practices and potential issues',
        tools: ['Read', 'Grep', 'Glob', 'LSP'],
        systemPrompt: 'You are a code reviewer. Analyze code for bugs, security issues, and best practices.',
        model: 'claude-3-5-sonnet-20241022'
      },
      {
        name: 'test-writer',
        agentType: 'test-generator',
        whenToUse: 'When writing unit tests for existing code',
        tools: ['Read', 'Write', 'Glob', 'Grep'],
        systemPrompt: 'You write comprehensive unit tests using Vitest.',
        model: 'claude-3-5-sonnet-20241022'
      },
      {
        name: 'doc-generator',
        agentType: 'documentation-writer',
        whenToUse: 'When generating or updating documentation',
        tools: ['Read', 'Write', 'Edit'],
        systemPrompt: 'You write clear, comprehensive documentation.'
      }
    ]
  });

  try {
    await client.connect();

    // The agent will be selected based on the query
    await client.query('Review this code for issues and suggest improvements');

    for await (const message of client.receiveMessages()) {
      if (message.type === 'result') {
        break;
      }
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Example 3: Using Hooks
// ============================================================================

export async function example3_hooks() {
  console.log('=== Example 3: Event Hooks ===\n');

  // Hook callbacks
  const hooks = new Map();

  hooks.set('log-tool-use', async (context: any) => {
    console.log(`\n[HOOK] Tool used: ${context.toolName}`);
    console.log(`  Input: ${JSON.stringify(context.input)}`);
  });

  hooks.set('log-tool-result', async (context: any) => {
    console.log(`\n[HOOK] Tool result for: ${context.toolName}`);
    const output = String(context.output ?? '').substring(0, 100);
    console.log(`  Output: ${output}...`);
  });

  hooks.set('log-file-read', async (context: any) => {
    if (context.toolName === 'Read') {
      console.log(`\n[HOOK] File read: ${(context.input as any)?.filePath}`);
    }
  });

  hooks.set('log-error', async (context: any) => {
    if (context.error) {
      console.error(`\n[HOOK] Error occurred: ${context.error.message}`);
    }
  });

  hooks.set('track-tokens', async (_context: any) => {
    // Track token usage for billing
    // This would be called at the end of each turn
    console.log('[HOOK] Turn completed');
  });

  const client = new RipperdocClient({
    hooks: [
      {
        event: 'PreToolUse',
        callback: 'log-tool-use'
      },
      {
        event: 'PostToolUse',
        callback: 'log-tool-result'
      },
      {
        event: 'PreRead',
        callback: 'log-file-read'
      },
      {
        event: 'OnError',
        callback: 'log-error'
      },
      {
        event: 'OnTurnEnd',
        callback: 'track-tokens'
      }
    ]
  });

  try {
    await client.connect();
    await client.query('Analyze the main file structure');

    for await (const message of client.receiveMessages()) {
      if (message.type === 'result') {
        break;
      }
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Example 4: Pattern-Matched Hooks
// ============================================================================

export async function example4_patternHooks() {
  console.log('=== Example 4: Pattern-Matched Hooks ===\n');

  const client = new RipperdocClient({
    hooks: [
      {
        event: 'PreToolUse',
        callback: 'confirm-dangerous',
        pattern: {
          toolName: 'Bash'
        }
      },
      {
        event: 'PreWrite',
        callback: 'backup-file'
      },
      {
        event: 'PostToolUse',
        callback: 'log-success',
        pattern: {
          toolName: 'Bash',
          toolInput: {
            command: 'npm install'
          }
        }
      }
    ]
  });

  try {
    await client.connect();
    await client.query('Install dependencies and update package.json');

    for await (const message of client.receiveMessages()) {
      if (message.type === 'result') {
        break;
      }
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Example 5: Custom Permission Checker
// ============================================================================

export async function example5_customPermissions() {
  console.log('=== Example 5: Custom Permission Checker ===\n');

  // Custom permission logic
  const allowlistedPaths = new Set([
    '/tmp',
    '/home/user/safe-directory'
  ]);

  function customPermissionChecker(request: any): boolean {
    const { toolName, input } = request;

    // Always allow read-only tools
    if (['Read', 'Glob', 'Grep', 'LS', 'LSP'].includes(toolName)) {
      return true;
    }

    // Check file operations against allowlist
    if (toolName === 'Write' || toolName === 'Edit') {
      const filePath = input?.filePath;
      if (filePath) {
        const isAllowed = Array.from(allowlistedPaths).some(path =>
          filePath.startsWith(path)
        );
        return isAllowed;
      }
    }

    // Deny dangerous bash commands
    if (toolName === 'Bash') {
      const command = input?.command ?? '';
      if (command.includes('rm -rf') || command.includes('sudo')) {
        return false;
      }
    }

    // Default to prompt
    return false;
  }

  const client = new RipperdocClient({
    permissionMode: 'default',
    // Custom permission checker would be passed here
    // Note: This is a conceptual example - actual implementation depends on SDK design
  });

  try {
    await client.connect();
    await client.query('Create a new file in /tmp');

    for await (const message of client.receiveMessages()) {
      if (message.type === 'result') {
        break;
      }
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Example 6: Context Injection
// ============================================================================

export async function example6_contextInjection() {
  console.log('=== Example 6: Context Injection ===\n');

  const client = new RipperdocClient({
    context: {
      project: 'ripperdoc-agent-sdk',
      version: '0.1.0',
      author: 'Quantmew',
      repository: 'github.com/quantmew/ripperdoc-agent-sdk-typescript',
      coding_standards: `
        - Use TypeScript strict mode
        - Follow functional programming patterns where appropriate
        - All public APIs must have JSDoc comments
        - Use async/await instead of Promises directly
      `
    }
  });

  try {
    await client.connect();
    await client.query('What is the best way to structure this SDK based on the context?');

    for await (const message of client.receiveMessages()) {
      if (message.type === 'result') {
        break;
      }
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Main
// ============================================================================

export async function main() {
  const args = process.argv.slice(2);
  const example = args[0] ?? '1';

  const examples: Record<string, () => Promise<void>> = {
    '1': example1_mcpServers,
    '2': example2_programmaticAgents,
    '3': example3_hooks,
    '4': example4_patternHooks,
    '5': example5_customPermissions,
    '6': example6_contextInjection
  };

  const exampleFn = examples[example];
  if (exampleFn) {
    try {
      await exampleFn();
    } catch (error) {
      console.error('Example failed:', error);
      process.exit(1);
    }
  } else {
    console.error(`Unknown example: ${example}`);
    console.error('Available examples: 1-6');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
