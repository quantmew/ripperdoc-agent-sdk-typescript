/**
 * Protocol definitions for JSON Control Protocol over stdio
 *
 * Based on ripperdoc's actual protocol
 */

import type { ContentBlock, UsageInfo } from '../types/index.js';

// ============================================================================
// Control Protocol Types
// ============================================================================

export interface ControlRequest {
  type: 'control_request';
  request_id: string;
  request: ControlRequestData;
}

export interface ControlRequestData {
  subtype: ControlSubtype;
  [key: string]: unknown;
}

export type ControlSubtype =
  | 'initialize'
  | 'query'
  | 'set_permission_mode'
  | 'set_model'
  | 'can_use_tool'
  | 'get_server_info'
  | 'close';

// ============================================================================
// Initialize Request
// ============================================================================

export interface InitializeRequestData extends ControlRequestData {
  subtype: 'initialize';
  options: InitializeOptions;
}

export interface InitializeOptions {
  session_id?: string;
  cwd?: string;
  model?: string;
  permission_mode?: string;
  allowed_tools?: string[];
  disallowed_tools?: string[];
  verbose?: boolean;
  max_turns?: number;
  system_prompt?: string;
  additional_instructions?: string | string[];
  context?: Record<string, string>;
}

// ============================================================================
// Query Request
// ============================================================================

export interface QueryRequestData extends ControlRequestData {
  subtype: 'query';
  prompt: string;
  options?: Partial<InitializeOptions>;
}

// ============================================================================
// Set Permission Mode Request
// ============================================================================

export interface SetPermissionModeRequestData extends ControlRequestData {
  subtype: 'set_permission_mode';
  mode: string;
}

// ============================================================================
// Set Model Request
// ============================================================================

export interface SetModelRequestData extends ControlRequestData {
  subtype: 'set_model';
  model: string;
}

// ============================================================================
// Can Use Tool Request
// ============================================================================

export interface CanUseToolRequestData extends ControlRequestData {
  subtype: 'can_use_tool';
  tool_name: string;
  input?: Record<string, unknown>;
}

// ============================================================================
// Get Server Info Request
// ============================================================================

export interface GetServerInfoRequestData extends ControlRequestData {
  subtype: 'get_server_info';
}

// ============================================================================
// Close Request
// ============================================================================

export interface CloseRequestData extends ControlRequestData {
  subtype: 'close';
}

// ============================================================================
// Control Response (from ripperdoc CLI)
// ============================================================================

export interface ControlResponse {
  type: 'control_response';
  response: ControlResponseData;
}

export interface ControlResponseData {
  subtype: 'success' | 'error';
  request_id: string;
  error?: string;
  response?: unknown;
}

// ============================================================================
// Success Response Data
// ============================================================================

export interface InitializeSuccessResponse {
  session_id: string;
}

export interface QueryStartedResponse {
  query_id?: string;
}

export interface ServerInfoResponse {
  version: string;
  features: string[];
  available_tools: string[];
  available_models: string[];
}

// ============================================================================
// Stream Message Types (from CLI)
// ============================================================================

export interface StreamProtocolMessage {
  type: 'assistant' | 'user' | 'result' | 'error';
  content?: ContentBlock[];
  result?: ResultMessageData;
  error?: string;
}

export interface ResultMessageData {
  status: 'success' | 'error';
  usage?: UsageInfo;
  error?: string;
}

// ============================================================================
// Message Guards
// ============================================================================

export function isControlRequest(data: unknown): data is ControlRequest {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ControlRequest).type === 'control_request' &&
    typeof (data as ControlRequest).request_id === 'string' &&
    typeof (data as ControlRequest).request === 'object'
  );
}

export function isControlResponse(data: unknown): data is ControlResponse {
  return (
    typeof data === 'object' &&
    data !== null &&
    (data as ControlResponse).type === 'control_response' &&
    typeof (data as ControlResponse).response === 'object'
  );
}

export function isStreamMessage(data: unknown): data is StreamProtocolMessage {
  return (
    typeof data === 'object' &&
    data !== null &&
    ['assistant', 'user', 'result', 'error'].includes((data as StreamProtocolMessage).type)
  );
}

// ============================================================================
// Message Builder Helpers
// ============================================================================

export class ControlRequestBuilder {
  private static requestId = 0;

  static generateRequestId(): string {
    return `req-${Date.now()}-${++this.requestId}`;
  }

  static initialize(options: InitializeOptions): ControlRequest {
    return {
      type: 'control_request',
      request_id: this.generateRequestId(),
      request: {
        subtype: 'initialize',
        options
      } as InitializeRequestData
    };
  }

  static query(prompt: string, options?: Partial<InitializeOptions>): ControlRequest {
    return {
      type: 'control_request',
      request_id: this.generateRequestId(),
      request: {
        subtype: 'query',
        prompt,
        options
      } as QueryRequestData
    };
  }

  static setPermissionMode(mode: string): ControlRequest {
    return {
      type: 'control_request',
      request_id: this.generateRequestId(),
      request: {
        subtype: 'set_permission_mode',
        mode
      } as SetPermissionModeRequestData
    };
  }

  static setModel(model: string): ControlRequest {
    return {
      type: 'control_request',
      request_id: this.generateRequestId(),
      request: {
        subtype: 'set_model',
        model
      } as SetModelRequestData
    };
  }

  static canUseTool(toolName: string, input?: Record<string, unknown>): ControlRequest {
    return {
      type: 'control_request',
      request_id: this.generateRequestId(),
      request: {
        subtype: 'can_use_tool',
        tool_name: toolName,
        input
      } as CanUseToolRequestData
    };
  }

  static getServerInfo(): ControlRequest {
    return {
      type: 'control_request',
      request_id: this.generateRequestId(),
      request: {
        subtype: 'get_server_info'
      } as GetServerInfoRequestData
    };
  }

  static close(): ControlRequest {
    return {
      type: 'control_request',
      request_id: this.generateRequestId(),
      request: {
        subtype: 'close'
      } as CloseRequestData
    };
  }
}
