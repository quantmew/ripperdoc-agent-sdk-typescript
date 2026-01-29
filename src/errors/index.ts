/**
 * Custom error types for the Ripperdoc SDK
 */

// ============================================================================
// Base Error
// ============================================================================

export class RipperdocSDKError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'RipperdocSDKError';
    Object.setPrototypeOf(this, RipperdocSDKError.prototype);
  }
}

// ============================================================================
// Connection Errors
// ============================================================================

export class CLIConnectionError extends RipperdocSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'CLIConnectionError';
    Object.setPrototypeOf(this, CLIConnectionError.prototype);
  }
}

export class CLINotFoundError extends CLIConnectionError {
  constructor(cliPath?: string) {
    const path = cliPath ?? 'ripperdoc';
    super(`Ripperdoc CLI not found at '${path}'. Please ensure Ripperdoc is installed and in your PATH.`);
    this.name = 'CLINotFoundError';
    Object.setPrototypeOf(this, CLINotFoundError.prototype);
  }
}

// ============================================================================
// Process Errors
// ============================================================================

export class ProcessError extends RipperdocSDKError {
  public readonly exitCode: number | null;
  public readonly signal: NodeJS.Signals | null;

  constructor(message: string, exitCode?: number | null, signal?: NodeJS.Signals | null) {
    super(message);
    this.name = 'ProcessError';
    this.exitCode = exitCode ?? null;
    this.signal = signal ?? null;
    Object.setPrototypeOf(this, ProcessError.prototype);
  }

  toString(): string {
    let msg = this.message;
    if (this.exitCode !== null) {
      msg += ` (exit code: ${this.exitCode})`;
    }
    if (this.signal !== null) {
      msg += ` (signal: ${this.signal})`;
    }
    return msg;
  }
}

// ============================================================================
// Protocol Errors
// ============================================================================

export class MessageParseError extends RipperdocSDKError {
  constructor(message: string, public readonly raw?: string) {
    super(message);
    this.name = 'MessageParseError';
    Object.setPrototypeOf(this, MessageParseError.prototype);
  }
}

export class InvalidMessageError extends MessageParseError {
  constructor(message: string, raw?: string) {
    super(message, raw);
    this.name = 'InvalidMessageError';
    Object.setPrototypeOf(this, InvalidMessageError.prototype);
  }
}

// ============================================================================
// Transport Errors
// ============================================================================

export class TransportError extends RipperdocSDKError {
  constructor(message: string, public readonly cause?: Error) {
    super(message);
    this.name = 'TransportError';
    Object.setPrototypeOf(this, TransportError.prototype);
  }
}

export class WriteError extends TransportError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'WriteError';
    Object.setPrototypeOf(this, WriteError.prototype);
  }
}

export class ReadError extends TransportError {
  constructor(message: string, cause?: Error) {
    super(message, cause);
    this.name = 'ReadError';
    Object.setPrototypeOf(this, ReadError.prototype);
  }
}

// ============================================================================
// Stream Errors
// ============================================================================

export class StreamError extends RipperdocSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'StreamError';
    Object.setPrototypeOf(this, StreamError.prototype);
  }
}

export class StreamClosedError extends StreamError {
  constructor() {
    super('Stream has been closed');
    this.name = 'StreamClosedError';
    Object.setPrototypeOf(this, StreamClosedError.prototype);
  }
}

// ============================================================================
// Client Errors
// ============================================================================

export class ClientError extends RipperdocSDKError {
  constructor(message: string) {
    super(message);
    this.name = 'ClientError';
    Object.setPrototypeOf(this, ClientError.prototype);
  }
}

export class ClientNotConnectedError extends ClientError {
  constructor() {
    super('Client is not connected. Call connect() first.');
    this.name = 'ClientNotConnectedError';
    Object.setPrototypeOf(this, ClientNotConnectedError.prototype);
  }
}

export class ClientAlreadyConnectedError extends ClientError {
  constructor() {
    super('Client is already connected.');
    this.name = 'ClientAlreadyConnectedError';
    Object.setPrototypeOf(this, ClientAlreadyConnectedError.prototype);
  }
}

export class QueryInProgressError extends ClientError {
  constructor() {
    super('A query is already in progress. Wait for it to complete before starting a new one.');
    this.name = 'QueryInProgressError';
    Object.setPrototypeOf(this, QueryInProgressError.prototype);
  }
}

export class NoActiveQueryError extends ClientError {
  constructor() {
    super('No active query. Call query() first.');
    this.name = 'NoActiveQueryError';
    Object.setPrototypeOf(this, NoActiveQueryError.prototype);
  }
}

// ============================================================================
// Response Errors
// ============================================================================

export class ResponseError extends RipperdocSDKError {
  constructor(message: string, public readonly code?: string) {
    super(message);
    this.name = 'ResponseError';
    Object.setPrototypeOf(this, ResponseError.prototype);
  }
}

export class QueryFailedError extends ResponseError {
  constructor(message: string) {
    super(message);
    this.name = 'QueryFailedError';
    Object.setPrototypeOf(this, QueryFailedError.prototype);
  }
}

export class InitializationError extends ResponseError {
  constructor(message: string) {
    super(message);
    this.name = 'InitializationError';
    Object.setPrototypeOf(this, InitializationError.prototype);
  }
}

// ============================================================================
// Timeout Errors
// ============================================================================

export class TimeoutError extends RipperdocSDKError {
  constructor(message: string, public readonly timeout: number) {
    super(message);
    this.name = 'TimeoutError';
    Object.setPrototypeOf(this, TimeoutError.prototype);
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

export function isRipperdocSDKError(error: unknown): error is RipperdocSDKError {
  return error instanceof RipperdocSDKError;
}

export function isConnectionError(error: unknown): error is CLIConnectionError {
  return error instanceof CLIConnectionError;
}

export function isProcessError(error: unknown): error is ProcessError {
  return error instanceof ProcessError;
}

export function isTransportError(error: unknown): error is TransportError {
  return error instanceof TransportError;
}

export function isClientError(error: unknown): error is ClientError {
  return error instanceof ClientError;
}

export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}
