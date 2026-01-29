/**
 * Stdio Transport - communicates with Ripperdoc CLI via stdin/stdout
 */

import { EventEmitter } from 'eventemitter3';
import { spawn, ChildProcess } from 'child_process';
import { Readable } from 'stream';
import type {
  ControlRequest,
  ControlResponse,
  StreamProtocolMessage
} from '../protocol/index.js';
import {
  RipperdocSDKError,
  CLIConnectionError,
  CLINotFoundError,
  ProcessError,
  MessageParseError,
  ReadError,
  WriteError,
  StreamClosedError
} from '../errors/index.js';
import { isControlResponse, isStreamMessage } from '../protocol/index.js';

// ============================================================================
// Transport Events
// ============================================================================

export interface StdioTransportEvents {
  message: (message: ControlResponse | StreamProtocolMessage) => void;
  error: (error: Error) => void;
  close: (code: number | null, signal: NodeJS.Signals | null) => void;
}

// ============================================================================
// Transport Options
// ============================================================================

export interface StdioTransportOptions {
  /** Path to the Ripperdoc CLI executable */
  ripperdocPath?: string;
  /** Arguments to pass to the CLI */
  args?: string[];
  /** Environment variables */
  env?: Record<string, string>;
  /** Current working directory */
  cwd?: string;
  /** Timeout for startup (ms) */
  startupTimeout?: number;
}

// ============================================================================
// Stdio Transport Implementation
// ============================================================================

export class StdioTransport extends EventEmitter {
  private process: ChildProcess | null = null;
  private isClosed = true;
  private readonly ripperdocPath: string;
  private readonly args: string[];
  private readonly env: Record<string, string>;
  private readonly cwd: string | undefined;
  private readonly startupTimeout: number;
  private buffer = '';

  constructor(options: StdioTransportOptions = {}) {
    super();
    this.ripperdocPath = options.ripperdocPath ?? 'ripperdoc';
    this.args = options.args ?? ['stdio'];
    // Filter out undefined values from process.env
    const cleanEnv: Record<string, string> = {};
    for (const [key, value] of Object.entries(process.env)) {
      if (value !== undefined) {
        cleanEnv[key] = value;
      }
    }
    this.env = { ...cleanEnv, ...options.env };
    this.cwd = options.cwd;
    this.startupTimeout = options.startupTimeout ?? 10000;
  }

  /**
   * Connect to the Ripperdoc CLI
   */
  async connect(): Promise<void> {
    if (!this.isClosed) {
      throw new CLIConnectionError('Transport is already connected');
    }

    try {
      await this.spawnProcess();
      this.isClosed = false;
    } catch (error) {
      this.isClosed = true;
      if (error instanceof RipperdocSDKError) {
        throw error;
      }
      throw new CLIConnectionError(`Failed to connect: ${getErrorMessage(error)}`);
    }
  }

  /**
   * Send a control request to the CLI
   */
  async send(request: ControlRequest): Promise<void> {
    if (this.isClosed) {
      throw new StreamClosedError();
    }

    if (!this.process?.stdin) {
      throw new WriteError('Stdin is not available');
    }

    const message = JSON.stringify(request) + '\n';

    try {
      // Create a promise for the write operation
      await new Promise<void>((resolve, reject) => {
        const callback = (error: Error | null | undefined) => {
          if (error) {
            reject(new WriteError('Failed to write to stdin', error as Error));
          } else {
            resolve();
          }
        };

        const result = this.process!.stdin!.write(message, 'utf8', callback);

        // If write returns false, we need to wait for drain
        if (!result) {
          this.process!.stdin!.once('drain', () => resolve());
        }
      });
    } catch (error) {
      throw new WriteError('Failed to send message', error as Error);
    }
  }

  /**
   * Close the transport connection
   */
  async close(): Promise<void> {
    if (this.isClosed) {
      return;
    }

    this.isClosed = true;
    this.removeAllListeners();

    if (this.process) {
      // Send close request
      try {
        await this.send({
          type: 'control_request',
          request_id: `close-${Date.now()}`,
          request: { subtype: 'close' }
        });
      } catch {
        // Ignore errors when closing
      }

      // Give process time to exit gracefully
      await new Promise<void>((resolve) => setTimeout(resolve, 100));

      if (this.process.kill()) {
        await new Promise<void>((resolve) => {
          const timeout = setTimeout(() => resolve(), 1000);
          this.process!.once('exit', () => {
            clearTimeout(timeout);
            resolve();
          });
        });
      }

      this.process = null;
    }
  }

  /**
   * Check if transport is connected
   */
  get connected(): boolean {
    return !this.isClosed && this.process !== null;
  }

  // ========================================================================
  // Private Methods
  // ========================================================================

  private async spawnProcess(): Promise<void> {
    return new Promise<void>((resolve, reject) => {
      try {
        this.process = spawn(this.ripperdocPath, this.args, {
          env: this.env,
          cwd: this.cwd,
          stdio: ['pipe', 'pipe', 'inherit'], // stderr goes to parent
          shell: false
        });

        // Set up stdout handling
        if (this.process.stdout) {
          this.setupStdoutHandlers(this.process.stdout);
        } else {
          throw new CLIConnectionError('Failed to create stdout pipe');
        }

        // Set up error handling
        this.process.on('error', (error) => {
          this.cleanup();
          if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
            reject(new CLINotFoundError(this.ripperdocPath));
          } else {
            reject(new CLIConnectionError(`Failed to spawn process: ${error.message}`));
          }
        });

        // Set up exit handling
        this.process.on('exit', (code, signal) => {
          this.emit('close', code, signal);
          if (!this.isClosed) {
            this.cleanup();
          }
        });

        // Wait for process to be ready
        const timeout = setTimeout(() => {
          reject(new Error('Process startup timeout'));
        }, this.startupTimeout);

        // Give process a moment to start
        setTimeout(() => {
          clearTimeout(timeout);
          if (this.process && !this.process.killed) {
            resolve();
          } else {
            reject(new CLIConnectionError('Process failed to start'));
          }
        }, 100);

      } catch (error) {
        this.cleanup();
        if (error instanceof RipperdocSDKError) {
          reject(error);
        } else {
          reject(new CLIConnectionError(`Failed to spawn process: ${getErrorMessage(error)}`));
        }
      }
    });
  }

  private setupStdoutHandlers(stdout: Readable): void {
    stdout.setEncoding('utf8');

    stdout.on('data', (chunk: string) => {
      this.buffer += chunk;
      this.processBuffer();
    });

    stdout.on('error', (error) => {
      this.emit('error', new ReadError('Stdout error', error));
    });

    stdout.on('close', () => {
      if (this.buffer.length > 0) {
        this.processBuffer();
      }
      this.cleanup();
    });
  }

  private processBuffer(): void {
    let newlineIndex: number;
    while ((newlineIndex = this.buffer.indexOf('\n')) !== -1) {
      const line = this.buffer.slice(0, newlineIndex);
      this.buffer = this.buffer.slice(newlineIndex + 1);

      if (line.length > 0) {
        this.handleMessage(line);
      }
    }
  }

  private handleMessage(line: string): void {
    try {
      const data = JSON.parse(line);

      if (isControlResponse(data)) {
        this.emit('message', data);
      } else if (isStreamMessage(data)) {
        this.emit('message', data);
      } else {
        throw new MessageParseError(`Unknown message type: ${(data as { type: string }).type}`);
      }
    } catch (error) {
      if (error instanceof MessageParseError) {
        this.emit('error', error);
      } else {
        this.emit('error', new MessageParseError(`Failed to parse message: ${getErrorMessage(error)}`, line));
      }
    }
  }

  private cleanup(): void {
    this.isClosed = true;
    this.buffer = '';
    this.process = null;
  }
}

// ============================================================================
// Utility Functions
// ============================================================================

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  return String(error);
}

// ============================================================================
// Default Export
// ============================================================================

export default StdioTransport;
