/**
 * Basic usage examples for the Ripperdoc SDK
 */

import {
  RipperdocClient,
  query,
  type Message,
  type AssistantMessage,
  type ResultMessage,
  type ContentBlock
} from '../src/index.js';

// ============================================================================
// Example 1: Simple One-Shot Query
// ============================================================================

export async function example1_simpleQuery() {
  console.log('=== Example 1: Simple Query ===\n');

  for await (const message of query('What is 2 + 2?')) {
    handleMessage(message);
  }
}

// ============================================================================
// Example 2: Query with Options
// ============================================================================

export async function example2_queryWithOptions() {
  console.log('=== Example 2: Query with Options ===\n');

  const options = {
    model: 'claude-3-5-sonnet-20241022',
    permissionMode: 'bypassPermissions' as const,
    verbose: true,
    allowedTools: ['Read', 'Glob', 'Grep']
  };

  for await (const message of query('List all TypeScript files in the project', options)) {
    handleMessage(message);
  }
}

// ============================================================================
// Example 3: Persistent Client with Multiple Queries
// ============================================================================

export async function example3_persistentClient() {
  console.log('=== Example 3: Persistent Client ===\n');

  const client = new RipperdocClient({
    model: 'claude-3-5-sonnet-20241022',
    permissionMode: 'default'
  });

  try {
    await client.connect();

    // First query
    console.log('Query 1: What files are in this directory?');
    await client.query('What files are in this directory?');
    await printResponses(client);

    // Second query
    console.log('\nQuery 2: What is the main function doing?');
    await client.query('What is the main function doing?');
    await printResponses(client);

  } finally {
    await client.close();
  }
}

// ============================================================================
// Example 4: Processing Different Message Types
// ============================================================================

export async function example4_messageTypes() {
  console.log('=== Example 4: Message Types ===\n');

  const client = new RipperdocClient();

  try {
    await client.connect();
    await client.query('Analyze this code and run tests');

    for await (const message of client.receiveMessages()) {
      switch (message.type) {
        case 'assistant':
          console.log('\n--- Assistant Response ---');
          for (const block of (message as AssistantMessage).content) {
            processContentBlock(block);
          }
          break;

        case 'user':
          console.log('\n--- User Message (Tool Result) ---');
          for (const block of (message as any).content) {
            if (block.type === 'tool_result') {
              console.log(`Tool result: ${block.content}`);
            }
          }
          break;

        case 'result':
          const result = (message as ResultMessage).result;
          console.log('\n--- Query Complete ---');
          console.log(`Status: ${result.status}`);
          if (result.usage) {
            console.log(`Tokens: ${result.usage.inputTokens} in, ${result.usage.outputTokens} out`);
            if (result.usage.costUsd) {
              console.log(`Cost: $${result.usage.costUsd.toFixed(4)}`);
            }
          }
          break;
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
// Example 5: Configuration Changes
// ============================================================================

export async function example5_configurationChanges() {
  console.log('=== Example 5: Configuration Changes ===\n');

  const client = new RipperdocClient({
    permissionMode: 'default'
  });

  try {
    await client.connect();

    // Get server info
    const serverInfo = await client.getServerInfo();
    console.log('Server Info:');
    console.log(`  Version: ${serverInfo.version}`);
    console.log(`  Features: ${serverInfo.features.join(', ')}`);
    console.log(`  Available Tools: ${serverInfo.availableTools.join(', ')}`);
    console.log(`  Available Models: ${serverInfo.availableModels.join(', ')}`);
    console.log();

    // Change permission mode
    console.log('Changing permission mode to bypassPermissions...');
    await client.setPermissionMode('bypassPermissions');

    // Change model
    console.log('Changing model to gpt-4o...');
    await client.setModel('gpt-4o');

    console.log('\nConfiguration updated successfully!');

  } finally {
    await client.close();
  }
}

// ============================================================================
// Example 6: Error Handling
// ============================================================================

export async function example6_errorHandling() {
  console.log('=== Example 6: Error Handling ===\n');

  const client = new RipperdocClient({
    model: 'invalid-model-name' // This might cause an error
  });

  try {
    await client.connect();
    await client.query('Hello');

    for await (const message of client.receiveMessages()) {
      if (message.type === 'result') {
        const result = (message as ResultMessage).result;
        if (result.status === 'error') {
          console.error(`Query failed: ${result.error}`);
        } else {
          console.log('Query succeeded!');
        }
        break;
      }
    }
  } catch (error) {
    console.error('Caught error:', error);
    if (error instanceof Error) {
      console.error(`Error name: ${error.name}`);
      console.error(`Error message: ${error.message}`);
    }
  } finally {
    try {
      await client.close();
    } catch {
      // Ignore close errors
    }
  }
}

// ============================================================================
// Example 7: Working with Tools
// ============================================================================

export async function example7_toolInteractions() {
  console.log('=== Example 7: Tool Interactions ===\n');

  const client = new RipperdocClient({
    allowedTools: ['Read', 'Edit', 'Write', 'Glob', 'Grep', 'Bash'],
    permissionMode: 'acceptEdits'
  });

  try {
    await client.connect();
    await client.query('Read package.json and update the version');

    for await (const message of client.receiveMessages()) {
      if (message.type === 'assistant') {
        for (const block of (message as AssistantMessage).content) {
          if (block.type === 'tool_use') {
            console.log(`\nTool: ${block.name}`);
            console.log(`Input: ${JSON.stringify(block.input, null, 2)}`);
          } else if (block.type === 'text') {
            console.log(`\nText: ${block.text}`);
          }
        }
      } else if (message.type === 'result') {
        console.log('\n--- Done ---');
        break;
      }
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Helper Functions
// ============================================================================

function handleMessage(message: Message): void {
  switch (message.type) {
    case 'assistant':
      const assistantMsg = message as AssistantMessage;
      for (const block of assistantMsg.content) {
        processContentBlock(block);
      }
      break;

    case 'result':
      const result = (message as ResultMessage).result;
      console.log(`\nStatus: ${result.status}`);
      if (result.usage) {
        console.log(`Tokens: ${result.usage.inputTokens} in, ${result.usage.outputTokens} out`);
      }
      break;

    default:
      console.log(`\n${message.type} message`);
  }
}

function processContentBlock(block: ContentBlock): void {
  switch (block.type) {
    case 'text':
      console.log(block.text);
      break;

    case 'thinking':
      console.log(`[Thinking: ${block.thinking}]`);
      break;

    case 'tool_use':
      console.log(`[Tool: ${block.name}]`);
      console.log(`  Input: ${JSON.stringify(block.input)}`);
      break;

    case 'tool_result':
      console.log(`[Tool Result]`);
      if (typeof block.content === 'string') {
        console.log(`  ${block.content.substring(0, 100)}...`);
      }
      break;

    case 'image':
      console.log(`[Image: ${block.source.url}]`);
      break;
  }
}

async function printResponses(client: RipperdocClient): Promise<void> {
  for await (const message of client.receiveMessages()) {
    handleMessage(message);
    if (message.type === 'result') {
      break;
    }
  }
}

// ============================================================================
// Main
// ============================================================================

export async function main() {
  const args = process.argv.slice(2);
  const example = args[0] ?? '1';

  const examples: Record<string, () => Promise<void>> = {
    '1': example1_simpleQuery,
    '2': example2_queryWithOptions,
    '3': example3_persistentClient,
    '4': example4_messageTypes,
    '5': example5_configurationChanges,
    '6': example6_errorHandling,
    '7': example7_toolInteractions
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
    console.error('Available examples: 1-7');
    process.exit(1);
  }
}

// Run if executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}
