/**
 * Core type definitions for the Ripperdoc SDK
 */

// ============================================================================
// Permission Modes
// ============================================================================

export type PermissionMode = 'default' | 'acceptEdits' | 'bypassPermissions' | 'plan';

// ============================================================================
// Content Block Types
// ============================================================================

export interface TextBlock {
  type: 'text';
  text: string;
}

export interface ThinkingBlock {
  type: 'thinking';
  thinking: string;
}

export interface ToolUseBlock {
  type: 'tool_use';
  id: string;
  name: string;
  input: Record<string, unknown>;
}

export interface ToolResultBlock {
  type: 'tool_result';
  toolUseId: string;
  content: string | ContentBlock[];
  isError?: boolean;
}

export interface ImageBlock {
  type: 'image';
  source: ImageSource;
}

export interface ImageSource {
  type: 'url';
  url: string;
}

export type ContentBlock = TextBlock | ThinkingBlock | ToolUseBlock | ToolResultBlock | ImageBlock;

// ============================================================================
// Message Types
// ============================================================================

export interface BaseMessage {
  role: 'user' | 'assistant' | 'system';
}

export interface UserMessage extends BaseMessage {
  type: 'user';
  content: ContentBlock[];
  role: 'user';
}

export interface AssistantMessage extends BaseMessage {
  type: 'assistant';
  content: ContentBlock[];
  role: 'assistant';
}

export interface SystemMessage extends BaseMessage {
  type: 'system';
  content: string;
  role: 'system';
}

export interface ResultMessage {
  type: 'result';
  result: ResultData;
}

export interface ResultData {
  status: 'success' | 'error';
  usage?: UsageInfo;
  error?: string;
}

export interface UsageInfo {
  inputTokens: number;
  outputTokens: number;
  cacheCreationTokens?: number;
  cacheReadTokens?: number;
  costUsd?: number;
  durationMs?: number;
}

export interface StreamEvent {
  type: 'stream_event';
  eventType: string;
  data: unknown;
}

export type Message = UserMessage | AssistantMessage | SystemMessage | ResultMessage | StreamEvent;

// ============================================================================
// SDK Query Types
// ============================================================================

export interface RipperdocOptions {
  // Model configuration
  model?: string;

  // Permission mode
  permissionMode?: PermissionMode;

  // Tool configuration
  allowedTools?: string[];
  disallowedTools?: string[];

  // Behavior settings
  verbose?: boolean;
  maxTurns?: number;
  maxThinkingTokens?: number;

  // Context
  cwd?: string;
  systemPrompt?: string;
  additionalInstructions?: string | string[];
  context?: Record<string, string>;

  // Extensions
  mcpServers?: McpServerConfig[];
  agents?: AgentConfig[];
  hooks?: HookConfig[];

  // Transport
  ripperdocPath?: string;
}

export interface McpServerConfig {
  name: string;
  command: string;
  args?: string[];
  env?: Record<string, string>;
}

export interface AgentConfig {
  name: string;
  agentType: string;
  whenToUse?: string;
  tools?: string[];
  systemPrompt?: string;
  model?: string;
}

export interface HookConfig {
  event: HookEvent;
  callback: string; // Reference to registered callback
  pattern?: HookPattern;
}

export type HookEvent =
  | 'PreToolUse'
  | 'PostToolUse'
  | 'PreRead'
  | 'PostRead'
  | 'PreEdit'
  | 'PostEdit'
  | 'PreWrite'
  | 'PostWrite'
  | 'PreBash'
  | 'PostBash'
  | 'OnError'
  | 'OnTurnStart'
  | 'OnTurnEnd'
  | 'OnQueryStart'
  | 'OnQueryEnd';

export interface HookPattern {
  toolName?: string;
  toolInput?: Record<string, unknown>;
}

// ============================================================================
// Permission Types
// ============================================================================

export interface PermissionRequest {
  toolName: string;
  input: Record<string, unknown>;
  reason?: string;
}

export interface PermissionResult {
  allowed: boolean;
  reason?: string;
}

export type PermissionChecker = (request: PermissionRequest) => boolean | Promise<PermissionResult>;

// ============================================================================
// Hook Types
// ============================================================================

export interface HookContext {
  toolName?: string;
  input?: Record<string, unknown>;
  output?: unknown;
  error?: Error;
}

export type HookCallback = (context: HookContext) => void | Promise<void>;

// ============================================================================
// Server Info Types
// ============================================================================

export interface ServerInfo {
  version: string;
  features: string[];
  availableTools: string[];
  availableModels: string[];
}

// ============================================================================
// Stream Types
// ============================================================================

export interface StreamMessage {
  type: 'assistant' | 'user' | 'result';
  content?: ContentBlock[];
  result?: ResultData;
}

export type StreamCallback = (message: StreamMessage) => void | Promise<void>;
