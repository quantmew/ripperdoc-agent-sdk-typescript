# Ripperdoc Agent SDK - TypeScript

A TypeScript SDK for interacting with [Ripperdoc](https://github.com/quantmew/ripperdoc), an AI-powered coding agent.

## Installation

```bash
npm install ripperdoc-agent-sdk
```

## Quick Start

### Simple Query

```typescript
import { query } from 'ripperdoc-agent-sdk';

// One-shot query
for await (const message of query('Hello, Ripperdoc!')) {
  if (message.type === 'assistant') {
    console.log(message.content);
  }
}
```

### Persistent Client

```typescript
import { RipperdocClient, RipperdocOptions } from 'ripperdoc-agent-sdk';

const options: RipperdocOptions = {
  model: 'claude-3-5-sonnet-20241022',
  permissionMode: 'default',
  allowedTools: ['Bash', 'Read', 'Edit', 'Write']
};

const client = new RipperdocClient(options);

try {
  // Start a query
  await client.query('Help me understand this codebase');

  // Receive streaming responses
  for await (const message of client.receiveMessages()) {
    switch (message.type) {
      case 'assistant':
        for (const block of message.content) {
          if (block.type === 'text') {
            console.log(block.text);
          } else if (block.type === 'tool_use') {
            console.log(`Using tool: ${block.name}`);
          }
        }
        break;
      case 'result':
        console.log(`Usage: ${message.usage.inputTokens} tokens in, ${message.usage.outputTokens} tokens out`);
        break;
    }
  }
} finally {
  await client.close();
}
```

## Features

- **Type-safe**: Full TypeScript support with comprehensive type definitions
- **Streaming**: Real-time streaming of responses
- **Tool Support**: Integration with Ripperdoc's tool system
- **Permission Management**: Configurable permission modes
- **Error Handling**: Comprehensive error types
- **Async/Await**: Modern async patterns throughout

## API Reference

### `query(prompt, options?)`

Simple one-shot query function.

### `RipperdocClient`

Main client class for persistent sessions.

#### Constructor Options

```typescript
interface RipperdocOptions {
  // Model selection
  model?: string;

  // Permission mode: 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan'
  permissionMode?: PermissionMode;

  // Tools
  allowedTools?: string[];
  disallowedTools?: string[];

  // Behavior
  verbose?: boolean;
  maxTurns?: number;

  // Context
  cwd?: string;
  systemPrompt?: string;
  context?: Record<string, string>;

  // Extensions
  mcpServers?: McpServerConfig[];
  agents?: AgentConfig[];
  hooks?: HookConfig[];
}
```

### Message Types

```typescript
type Message = UserMessage | AssistantMessage | ResultMessage;

interface UserMessage {
  type: 'user';
  content: ContentBlock[];
  role: 'user';
}

interface AssistantMessage {
  type: 'assistant';
  content: ContentBlock[];
  role: 'assistant';
}

interface ResultMessage {
  type: 'result';
  usage: UsageInfo;
  status: 'success' | 'error';
}
```

### Content Blocks

```typescript
type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock | ImageBlock;

interface TextBlock {
  type: 'text';
  text: string;
}

interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

interface ToolResultBlock {
  type: 'tool_result';
  toolUseId: string;
  content: string;
  isError?: boolean;
}
```

## Development

```bash
# Install dependencies
npm install

# Build
npm run build

# Run tests
npm test

# Type checking
npm run typecheck

# Linting
npm run lint
```

## License

MIT
