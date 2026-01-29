/**
 * Ripperdoc Agent SDK - TypeScript
 *
 * Main entry point for the SDK
 */

// ========================================================================
// Main Client
// ========================================================================

export {
  RipperdocClient,
  query
} from './client/index.js';

export type {
  ClientOptions
} from './client/index.js';

// ========================================================================
// Types
// ========================================================================

export type {
  // Permission Modes
  PermissionMode,

  // Content Blocks
  ContentBlock,
  TextBlock,
  ThinkingBlock,
  ToolUseBlock,
  ToolResultBlock,
  ImageBlock,
  ImageSource,

  // Messages
  Message,
  UserMessage,
  AssistantMessage,
  SystemMessage,
  ResultMessage,
  StreamEvent,

  // Message Sub-types
  BaseMessage,
  ResultData,
  UsageInfo,

  // Options
  RipperdocOptions,

  // Extension Types
  McpServerConfig,
  AgentConfig,
  HookConfig,
  HookEvent,
  HookPattern,

  // Permission Types
  PermissionRequest,
  PermissionResult,
  PermissionChecker,

  // Hook Types
  HookContext,
  HookCallback,

  // Server Types
  ServerInfo,

  // Stream Types
  StreamMessage,
  StreamCallback
} from './types/index.js';

// ========================================================================
// Protocol
// ========================================================================

export {
  ControlRequestBuilder,
  isControlRequest,
  isControlResponse,
  isStreamMessage
} from './protocol/index.js';

export type {
  // Control Request Types
  ControlRequest,
  ControlRequestData,
  ControlSubtype,
  InitializeRequestData,
  InitializeOptions,
  QueryRequestData,
  SetPermissionModeRequestData,
  SetModelRequestData,
  CanUseToolRequestData,
  GetServerInfoRequestData,
  CloseRequestData,

  // Control Response Types
  ControlResponse,
  ControlResponseData,

  // Success Response Data Types
  InitializeSuccessResponse,
  QueryStartedResponse,
  ServerInfoResponse,

  // Stream Message Types
  StreamProtocolMessage,
  ResultMessageData
} from './protocol/index.js';

// ========================================================================
// Errors
// ========================================================================

export {
  // Base Error
  RipperdocSDKError,

  // Connection Errors
  CLIConnectionError,
  CLINotFoundError,

  // Process Errors
  ProcessError,

  // Protocol Errors
  MessageParseError,
  InvalidMessageError,

  // Transport Errors
  TransportError,
  WriteError,
  ReadError,

  // Stream Errors
  StreamError,
  StreamClosedError,

  // Client Errors
  ClientError,
  ClientNotConnectedError,
  ClientAlreadyConnectedError,
  QueryInProgressError,
  NoActiveQueryError,

  // Response Errors
  ResponseError,
  QueryFailedError,
  InitializationError,

  // Timeout Errors
  TimeoutError,

  // Error Guards
  isRipperdocSDKError,
  isConnectionError,
  isProcessError,
  isTransportError,
  isClientError,
  getErrorMessage
} from './errors/index.js';

// ========================================================================
// Transport
// ========================================================================

export {
  StdioTransport
} from './transport/stdio.js';

export type {
  StdioTransportOptions,
  StdioTransportEvents
} from './transport/stdio.js';

// ========================================================================
// Config
// ========================================================================

export {
  DEFAULT_CONFIG,
  ANTHROPIC_MODELS,
  OPENAI_MODELS,
  DEEPSEEK_MODELS,
  ALL_MODELS,
  BUILTIN_TOOLS,
  READ_ONLY_TOOLS,
  DANGEROUS_TOOLS,
  PERMISSION_MODES,
  PERMISSION_MODE_DESCRIPTIONS,
  SERVER_FEATURES,
  ENV_VARS,
  getEnv,
  getEnvBool,
  getEnvNumber,
  getRipperdocPath,
  isReadOnlyTool,
  isDangerousTool,
  isValidModel,
  isValidPermissionMode,
  normalizeToolName,
  filterTools,
  cloneOptions,
  mergeOptions
} from './config/index.js';
