// API Types generated from OpenAPI specification
// Legal Document Processing API v1.0.0

// Enums as const objects (for better TypeScript compatibility)
export const DocumentStatus = {
  UPLOADED: "uploaded",
  PROCESSING: "processing",
  PROCESSED: "processed",
  COMPLETED: "completed",
  ERROR: "error",
} as const;

export const PlaceholderType = {
  TEXT: "text",
  DATE: "date",
  NUMBER: "number",
  EMAIL: "email",
  NAME: "name",
  ADDRESS: "address",
  PHONE: "phone",
  AMOUNT: "amount",
  PERCENTAGE: "percentage",
  BOOLEAN: "boolean",
} as const;

export type DocumentStatusType =
  (typeof DocumentStatus)[keyof typeof DocumentStatus];
export type PlaceholderTypeType =
  (typeof PlaceholderType)[keyof typeof PlaceholderType];

// Base API Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface HTTPValidationError {
  detail: ValidationError[];
}

export interface ValidationError {
  loc: (string | number)[];
  msg: string;
  type: string;
}

// Document Types
export interface DocumentResponse {
  id: number;
  original_filename: string;
  filename: string;
  file_path: string;
  template_path?: string | null;
  content_text?: string | null;
  template_text?: string | null;
  status: DocumentStatusType;
  created_at: string; // ISO datetime
  updated_at: string; // ISO datetime
  user_id?: number | null;
  placeholders: PlaceholderResponse[];
}

export interface DocumentSummary {
  id: number;
  original_filename: string;
  status: DocumentStatusType;
  created_at: string; // ISO datetime
  placeholder_count: number;
  filled_count: number;
}

export interface DocumentUploadResponse {
  document: DocumentResponse;
  message: string;
}

export interface DocumentProcessingResponse {
  document: DocumentResponse;
  placeholders_found: number;
  message: string;
}

export interface DocumentCompletionResponse {
  document: DocumentResponse;
  completed_content: string;
  download_url: string;
}

// Placeholder Types
export interface PlaceholderResponse {
  id: number;
  document_id: number;
  placeholder_text: string;
  jinja_name?: string | null;
  placeholder_type?: PlaceholderTypeType | null;
  description?: string | null;
  context?: string | null;
  filled_value?: string | null;
  is_filled: boolean;
  position_start?: number | null;
  position_end?: number | null;
  created_at: string; // ISO datetime
}

// Chat Types
export interface ChatMessage {
  message: string;
  conversation_id?: number | null;
  session_id?: string | null;
}

export interface ChatResponse {
  response: string;
  conversation_id: number;
  session_id: string;
  current_placeholder?: PlaceholderResponse | null;
  progress: Progress;
  is_complete: boolean;
}

// Request Types
export interface DocumentUploadRequest {
  file: File;
}

export interface DocumentListParams {
  skip?: number;
  limit?: number;
}

export interface PlaceholderListParams {
  unfilled_only?: boolean;
}
export interface Progress {
  total: number;
  filled: number;
  percentage: number;
}
// API Endpoint Response Types
export type UploadDocumentResponse = DocumentUploadResponse;
export type ProcessDocumentResponse = DocumentProcessingResponse;
export type ListDocumentsResponse = DocumentSummary[];
export type GetDocumentResponse = DocumentResponse;
export type GetPlaceholdersResponse = PlaceholderResponse[];
export type ChatWithDocumentResponse = ChatResponse;
export type CompleteDocumentResponse = DocumentCompletionResponse;

// Extended types for frontend use (combining with existing types)
export interface ExtendedPlaceholder extends PlaceholderResponse {
  // Additional frontend-specific properties
  label?: string;
  required?: boolean;
  validation_error?: string;
}

export interface DocumentProcessingState {
  document?: DocumentResponse;
  placeholders: ExtendedPlaceholder[];
  currentPlaceholderIndex: number;
  conversationId?: number;
  sessionId?: string;
  isComplete: boolean;
  progress: {
    totalPlaceholders: number;
    filledPlaceholders: number;
    requiredFilled: number;
    totalRequired: number;
  };
}

// API Configuration Types
export interface ApiConfig {
  baseUrl: string;
  apiKey?: string;
  timeout?: number;
  retries?: number;
}

// Error Types
export interface ApiError extends Error {
  status?: number;
  code?: string;
  details?: any;
}

// Utility Types
export type DocumentId = number;
export type ConversationId = number;
export type SessionId = string;

// Form Data Types for multipart requests
export interface DocumentFormData {
  file: File;
}

// Health Check Types
export interface HealthCheckResponse {
  status: string;
  version?: string;
  timestamp: string;
}

// Progress Tracking
export interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

// Pagination
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  skip: number;
  limit: number;
  has_more: boolean;
}

// WebSocket Types (for real-time updates)
export interface WebSocketMessage {
  type: "document_status" | "placeholder_update" | "chat_response" | "error";
  data: any;
  timestamp: string;
}
