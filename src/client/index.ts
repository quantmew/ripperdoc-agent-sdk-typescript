/**
 * Main Ripperdoc SDK Client
 */

import { randomUUID } from 'crypto';
import StdioTransport from '../transport/stdio.js';
import type { StdioTransportOptions } from '../transport/stdio.js';
import type {
  RipperdocOptions,
  Message,
  UserMessage,
  AssistantMessage,
  ResultMessage,
  PermissionMode
} from '../types/index.js';
import type {
  ControlRequest,
  ControlResponse,
  ControlResponseData,
  ServerInfoResponse,
  StreamProtocolMessage
} from '../protocol/index.js';
import { ControlRequestBuilder, isControlResponse } from '../protocol/index.js';
import {
  ClientNotConnectedError,
  ClientAlreadyConnectedError,
  QueryInProgressError,
  NoActiveQueryError,
  InitializationError,
  QueryFailedError,
  CLINotFoundError
} from '../errors/index.js';
import { DEFAULT_CONFIG, getRipperdocPath, isValidPermissionMode } from '../config/index.js';

// ============================================================================
// Client Options
// ============================================================================

export interface ClientOptions extends RipperdocOptions {
  /** Auto-connect on instantiation */
  autoConnect?: boolean;
  /** Transport options */
  transport?: StdioTransportOptions;
}

// ============================================================================
// Client State
// ============================================================================

enum ClientState {
  Disconnected = 'disconnected',
  Connecting = 'connecting',
  Connected = 'connected',
  Querying = 'querying'
}

// ============================================================================
// Message Queue for Streaming
// ============================================================================

class MessageQueue {
  private messages: Message[] = [];
  private resolve: ((value: IteratorResult<Message>) => void) | null = null;
  private closed = false;

  push(message: Message): void {
    this.messages.push(message);
    this.resolve?.({ value: message, done: false });
    this.resolve = null;
  }

  async next(): Promise<IteratorResult<Message>> {
    if (this.messages.length > 0) {
      const message = this.messages.shift()!;
      return { value: message, done: false };
    }

    if (this.closed) {
      return { value: undefined as never, done: true };
    }

    return new Promise((resolve) => {
      this.resolve = resolve;
    });
  }

  close(): void {
    this.closed = true;
    this.resolve?.({ value: undefined as never, done: true });
    this.resolve = null;
  }

  clear(): void {
    this.messages = [];
  }

  get isEmpty(): boolean {
    return this.messages.length === 0;
  }
}

// ============================================================================
// Response Waiter
// ============================================================================

interface ResponseWaiter {
  requestId: string;
  resolve: (response: ControlResponse) => void;
  reject: (error: Error) => void;
  timeout: NodeJS.Timeout;
}

// ============================================================================
// Main Client Class
// ============================================================================

export class RipperdocClient {
  private readonly options: ClientOptions;
  private readonly sessionId: string;
  private readonly transport: StdioTransport;
  private state = ClientState.Disconnected;
  private messageQueue: MessageQueue | null = null;
  private responseWaiters: Map<string, ResponseWaiter> = new Map();
  private currentQueryId: string | null = null;

  constructor(options: ClientOptions = {}) {
    this.options = this.normalizeOptions(options);
    this.sessionId = randomUUID();

    const transportOptions: StdioTransportOptions = {
      ripperdocPath: options.ripperdocPath ?? getRipperdocPath(),
      cwd: options.cwd,
      env: options.transport?.env,
      args: options.transport?.args
    };

    this.transport = new StdioTransport(transportOptions);
    this.setupTransportHandlers();
  }

  // ========================================================================
  // Connection Management
  // ========================================================================

  /**
   * Connect to the Ripperdoc CLI
   */
  async connect(): Promise<void> {
    if (this.state === ClientState.Connected || this.state === ClientState.Querying) {
      throw new ClientAlreadyConnectedError();
    }

    this.state = ClientState.Connecting;

    try {
      await this.transport.connect();

      // Initialize session
      const initRequest = ControlRequestBuilder.initialize({
        session_id: this.sessionId,
        cwd: this.options.cwd,
        model: this.options.model,
        permission_mode: this.options.permissionMode,
        allowed_tools: this.options.allowedTools,
        disallowed_tools: this.options.disallowedTools,
        verbose: this.options.verbose ?? false,
        max_turns: this.options.maxTurns,
        system_prompt: this.options.systemPrompt,
        additional_instructions: this.options.additionalInstructions,
        context: this.options.context
      });

      const response = await this.sendControlRequest<ControlResponse>(initRequest);

      // Response structure: response.response.response contains the actual data
      const responseData = response.response as ControlResponseData;
      if (responseData.subtype === 'error') {
        throw new InitializationError(responseData.error ?? 'Initialization failed');
      }

      this.state = ClientState.Connected;
    } catch (error) {
      this.state = ClientState.Disconnected;
      if (error instanceof CLINotFoundError) {
        throw error;
      }
      if (error instanceof RipperdocSDKError) {
        throw error;
      }
      throw new InitializationError(`Failed to connect: ${getError(error)}`);
    }
  }

  /**
   * Close the connection to the Ripperdoc CLI
   */
  async close(): Promise<void> {
    if (this.state === ClientState.Disconnected) {
      return;
    }

    // Clear any pending waiters
    for (const waiter of this.responseWaiters.values()) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Client closing'));
    }
    this.responseWaiters.clear();

    // Close message queue
    this.messageQueue?.close();
    this.messageQueue = null;

    // Close transport
    await this.transport.close();

    this.state = ClientState.Disconnected;
    this.currentQueryId = null;
  }

  // ========================================================================
  // Query Methods
  // ========================================================================

  /**
   * Start a query with the given prompt
   */
  async query(prompt: string): Promise<void> {
    this.ensureConnected();
    this.ensureNoQueryInProgress();

    this.state = ClientState.Querying;
    this.messageQueue = new MessageQueue();

    try {
      const queryRequest = ControlRequestBuilder.query(prompt, {
        cwd: this.options.cwd,
        model: this.options.model
        // Options use snake_case for ripperdoc protocol
      });

      const response = await this.sendControlRequest<ControlResponse>(queryRequest);

      const responseData = response.response as ControlResponseData;
      if (responseData.subtype === 'error') {
        throw new QueryFailedError(responseData.error ?? 'Query failed to start');
      }

      this.currentQueryId = (responseData.response as { query_id?: string } | undefined)?.query_id ?? null;
    } catch (error) {
      this.state = ClientState.Connected;
      this.messageQueue?.close();
      this.messageQueue = null;
      throw error;
    }
  }

  /**
   * Receive messages from the current query as an async iterator
   */
  async *receiveMessages(): AsyncGenerator<Message, void, unknown> {
    this.ensureConnected();
    this.ensureQueryInProgress();

    try {
      while (this.state === ClientState.Querying) {
        const result = await this.messageQueue!.next();
        if (result.done) {
          break;
        }

        const message = result.value;

        // Check if query ended
        if (message.type === 'result') {
          this.state = ClientState.Connected;
          this.currentQueryId = null;
        }

        yield message;
      }
    } finally {
      if (this.state === ClientState.Querying) {
        // If iteration was aborted, reset state
        this.state = ClientState.Connected;
        this.currentQueryId = null;
      }
    }
  }

  // ========================================================================
  // Configuration Methods
  // ========================================================================

  /**
   * Set the permission mode
   */
  async setPermissionMode(mode: PermissionMode): Promise<void> {
    this.ensureConnected();

    if (!isValidPermissionMode(mode)) {
      throw new Error(`Invalid permission mode: ${mode}`);
    }

    const request = ControlRequestBuilder.setPermissionMode(mode);
    const response = await this.sendControlRequest<ControlResponse>(request);

    const responseData = response.response as ControlResponseData;
    if (responseData.subtype === 'error') {
      throw new Error(responseData.error ?? 'Failed to set permission mode');
    }

    this.options.permissionMode = mode;
  }

  /**
   * Set the AI model
   */
  async setModel(model: string): Promise<void> {
    this.ensureConnected();

    const request = ControlRequestBuilder.setModel(model);
    const response = await this.sendControlRequest<ControlResponse>(request);

    const responseData = response.response as ControlResponseData;
    if (responseData.subtype === 'error') {
      throw new Error(responseData.error ?? 'Failed to set model');
    }

    this.options.model = model;
  }

  /**
   * Get server information
   */
  async getServerInfo(): Promise<ServerInfo> {
    this.ensureConnected();

    const request = ControlRequestBuilder.getServerInfo();
    const response = await this.sendControlRequest<ControlResponse>(request);

    const responseData = response.response as ControlResponseData;
    if (responseData.subtype === 'error') {
      throw new Error(responseData.error ?? 'Failed to get server info');
    }

    return responseData.response as ServerInfo;
  }

  // ========================================================================
  // Utility Methods
  // ========================================================================

  /**
   * Check if client is connected
   */
  get isConnected(): boolean {
    return this.state === ClientState.Connected || this.state === ClientState.Querying;
  }

  /**
   * Check if a query is in progress
   */
  get isQuerying(): boolean {
    return this.state === ClientState.Querying;
  }

  /**
   * Get the current session ID
   */
  get sessionIdValue(): string {
    return this.sessionId;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private setupTransportHandlers(): void {
    this.transport.on('message', (message) => this.handleMessage(message as ControlResponse | StreamProtocolMessage));
    this.transport.on('error', (error) => this.handleError(error));
    this.transport.on('close', () => this.handleClose());
  }

  private handleMessage(message: ControlResponse | StreamProtocolMessage): void {
    if (isControlResponse(message)) {
      this.handleControlResponse(message);
    } else {
      this.handleStreamMessage(message);
    }
  }

  private handleControlResponse(response: ControlResponse): void {
    // In the new protocol, request_id is inside response.response
    const requestId = response.response.request_id;
    const waiter = this.responseWaiters.get(requestId);

    if (waiter) {
      clearTimeout(waiter.timeout);
      this.responseWaiters.delete(requestId);

      // Check for error response
      if (response.response.subtype === 'error') {
        waiter.reject(new Error(response.response.error ?? 'Request failed'));
      } else {
        waiter.resolve(response);
      }
    }
  }

  private handleStreamMessage(message: StreamProtocolMessage): void {
    if (!this.messageQueue) {
      return;
    }

    switch (message.type) {
      case 'assistant':
        this.messageQueue.push({
          type: 'assistant',
          content: message.content ?? [],
          role: 'assistant'
        } as AssistantMessage);
        break;

      case 'user':
        this.messageQueue.push({
          type: 'user',
          content: message.content ?? [],
          role: 'user'
        } as UserMessage);
        break;

      case 'result':
        this.messageQueue.push({
          type: 'result',
          result: message.result ?? {
            status: 'success'
          }
        } as ResultMessage);
        break;

      case 'error':
        this.messageQueue.push({
          type: 'result',
          result: {
            status: 'error',
            error: message.error
          }
        } as ResultMessage);
        break;
    }
  }

  private handleError(error: Error): void {
    // Emit error or handle internally
    // For now, just log
    console.error('Transport error:', error);
  }

  private handleClose(): void {
    this.state = ClientState.Disconnected;
    this.messageQueue?.close();

    // Reject all pending waiters
    for (const waiter of this.responseWaiters.values()) {
      clearTimeout(waiter.timeout);
      waiter.reject(new Error('Connection closed'));
    }
    this.responseWaiters.clear();
  }

  private async sendControlRequest<T = ControlResponseData>(request: ControlRequest): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const timeout = setTimeout(() => {
        this.responseWaiters.delete(request.request_id);
        reject(new Error(`Control request timeout: ${(request.request as { subtype: string }).subtype}`));
      }, DEFAULT_CONFIG.CONTROL_REQUEST_TIMEOUT);

      this.responseWaiters.set(request.request_id, {
        requestId: request.request_id,
        resolve: (response: ControlResponse) => resolve(response.response as T),
        reject: reject,
        timeout
      });

      this.transport.send(request).catch((error) => {
        clearTimeout(timeout);
        this.responseWaiters.delete(request.request_id);
        reject(error);
      });
    });
  }

  private ensureConnected(): void {
    if (!this.isConnected) {
      throw new ClientNotConnectedError();
    }
  }

  private ensureNoQueryInProgress(): void {
    if (this.state === ClientState.Querying) {
      throw new QueryInProgressError();
    }
  }

  private ensureQueryInProgress(): void {
    if (this.state !== ClientState.Querying) {
      throw new NoActiveQueryError();
    }
  }

  private normalizeOptions(options: ClientOptions): ClientOptions {
    return {
      model: options.model ?? DEFAULT_CONFIG.DEFAULT_MODEL,
      permissionMode: options.permissionMode ?? DEFAULT_CONFIG.DEFAULT_PERMISSION_MODE,
      verbose: options.verbose ?? false,
      maxTurns: options.maxTurns ?? DEFAULT_CONFIG.DEFAULT_MAX_TURNS,
      maxThinkingTokens: options.maxThinkingTokens ?? DEFAULT_CONFIG.DEFAULT_MAX_THINKING_TOKENS,
      ...options
    };
  }
}

// ============================================================================
// Helper Types
// ============================================================================

// ServerInfo type is now imported from protocol
// Alias for convenience
type ServerInfo = ServerInfoResponse;

// ============================================================================
// Simple Query Function
// ============================================================================

/**
 * Simple one-shot query function
 */
export async function* query(
  prompt: string,
  options?: ClientOptions
): AsyncGenerator<Message, void, unknown> {
  const client = new RipperdocClient({ ...options, autoConnect: true });

  try {
    await client.connect();
    await client.query(prompt);

    for await (const message of client.receiveMessages()) {
      yield message;
    }
  } finally {
    await client.close();
  }
}

// ============================================================================
// Re-exports
// ============================================================================

export type { Message, UserMessage, AssistantMessage, ResultMessage, PermissionMode };

// ============================================================================
// Base Error Class
// ============================================================================

class RipperdocSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RipperdocSDKError';
    Object.setPrototypeOf(this, RipperdocSDKError.prototype);
  }
}

function getError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
