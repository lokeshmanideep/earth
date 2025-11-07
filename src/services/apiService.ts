import type {
  ApiConfig,
  ApiError,
  ApiResponse,
  ChatMessage,
  ChatResponse,
  DocumentCompletionResponse,
  DocumentId,
  DocumentListParams,
  DocumentProcessingResponse,
  DocumentResponse,
  DocumentSummary,
  DocumentUploadResponse,
  HealthCheckResponse,
  PlaceholderListParams,
  PlaceholderResponse,
  UploadProgress,
} from "../types/api";

/**
 * Legal Document Processing API Service
 * Implementation of all endpoints from OpenAPI specification v1.0.0
 */
class ApiService {
  private config: ApiConfig;
  private abortController: AbortController | null = null;

  constructor() {
    this.config = {
      baseUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
      apiKey: import.meta.env.VITE_API_KEY,
      timeout: 30000,
      retries: 3,
    };
  }

  /**
   * Update API configuration
   */
  configure(config: Partial<ApiConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): ApiConfig {
    return { ...this.config };
  }

  /**
   * Cancel all pending requests
   */
  cancelRequests(): void {
    if (this.abortController) {
      this.abortController.abort();
      this.abortController = null;
    }
  }

  /**
   * Get headers for API requests
   */
  private getHeaders(isMultipart = false): HeadersInit {
    const headers: HeadersInit = {};

    if (!isMultipart) {
      headers["Content-Type"] = "application/json";
    }

    if (this.config.apiKey) {
      headers["Authorization"] = `Bearer ${this.config.apiKey}`;
    }

    return headers;
  }

  /**
   * Generic request method with error handling and retries
   */
  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    retryCount = 0
  ): Promise<ApiResponse<T>> {
    try {
      this.abortController = new AbortController();

      const url = `${this.config.baseUrl}${endpoint}`;
      const timeoutId = setTimeout(
        () => this.abortController?.abort(),
        this.config.timeout
      );

      const response = await fetch(url, {
        ...options,
        headers: {
          ...this.getHeaders(options.body instanceof FormData),
          ...options.headers,
        },
        signal: this.abortController.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        if (response.status >= 500 && retryCount < (this.config.retries || 0)) {
          // Retry on server errors
          await this.delay(Math.pow(2, retryCount) * 1000);
          return this.request<T>(endpoint, options, retryCount + 1);
        }

        const errorText = await response.text();
        let errorData;
        try {
          errorData = JSON.parse(errorText);
        } catch {
          errorData = { message: errorText };
        }

        const apiError: ApiError = new Error(
          errorData.detail?.[0]?.msg ||
            errorData.message ||
            `HTTP ${response.status}`
        );
        apiError.status = response.status;
        apiError.details = errorData;
        throw apiError;
      }

      const data = await response.json();
      return {
        success: true,
        data,
      };
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return {
          success: false,
          error: "Request cancelled",
        };
      }

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    } finally {
      this.abortController = null;
    }
  }

  /**
   * Utility method for delays
   */
  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  // =============================================================================
  // DOCUMENT ENDPOINTS
  // =============================================================================

  /**
   * Upload a legal document for processing
   * POST /api/v1/documents/upload
   */
  async uploadDocument(
    file: File,
    _onProgress?: (progress: UploadProgress) => void
  ): Promise<ApiResponse<DocumentUploadResponse>> {
    const formData = new FormData();
    formData.append("file", file);

    // Note: Progress tracking would require XMLHttpRequest implementation
    // For now, using fetch with FormData
    return this.request<DocumentUploadResponse>("/api/v1/documents/upload", {
      method: "POST",
      body: formData,
    });
  }

  /**
   * Process a document to extract placeholders
   * POST /api/v1/documents/{document_id}/process
   */
  async processDocument(
    documentId: DocumentId
  ): Promise<ApiResponse<DocumentProcessingResponse>> {
    return this.request<DocumentProcessingResponse>(
      `/api/v1/documents/${documentId}/process`,
      { method: "POST" }
    );
  }

  /**
   * List all documents with summary information
   * GET /api/v1/documents/
   */
  async listDocuments(
    params: DocumentListParams = {}
  ): Promise<ApiResponse<DocumentSummary[]>> {
    const searchParams = new URLSearchParams();
    if (params.skip !== undefined)
      searchParams.set("skip", params.skip.toString());
    if (params.limit !== undefined)
      searchParams.set("limit", params.limit.toString());

    const query = searchParams.toString();
    const endpoint = `/api/v1/documents/${query ? "?" + query : ""}`;

    return this.request<DocumentSummary[]>(endpoint, { method: "GET" });
  }

  /**
   * Get a specific document with all details
   * GET /api/v1/documents/{document_id}
   */
  async getDocument(
    documentId: DocumentId
  ): Promise<ApiResponse<DocumentResponse>> {
    return this.request<DocumentResponse>(`/api/v1/documents/${documentId}`, {
      method: "GET",
    });
  }

  /**
   * Delete a document and its associated file
   * DELETE /api/v1/documents/{document_id}
   */
  async deleteDocument(documentId: DocumentId): Promise<ApiResponse<void>> {
    return this.request<void>(`/api/v1/documents/${documentId}`, {
      method: "DELETE",
    });
  }

  // =============================================================================
  // PLACEHOLDER ENDPOINTS
  // =============================================================================

  /**
   * Get placeholders for a document
   * GET /api/v1/documents/{document_id}/placeholders
   */
  async getDocumentPlaceholders(
    documentId: DocumentId,
    params: PlaceholderListParams = {}
  ): Promise<ApiResponse<PlaceholderResponse[]>> {
    const searchParams = new URLSearchParams();
    if (params.unfilled_only !== undefined) {
      searchParams.set("unfilled_only", params.unfilled_only.toString());
    }

    const query = searchParams.toString();
    const endpoint = `/api/v1/documents/${documentId}/placeholders${
      query ? "?" + query : ""
    }`;

    return this.request<PlaceholderResponse[]>(endpoint, { method: "GET" });
  }

  // =============================================================================
  // CHAT ENDPOINTS
  // =============================================================================

  /**
   * Chat with the assistant to fill document placeholders
   * POST /api/v1/documents/{document_id}/chat
   */
  async chatWithDocument(
    documentId: DocumentId,
    message: ChatMessage
  ): Promise<ApiResponse<ChatResponse>> {
    return this.request<ChatResponse>(`/api/v1/documents/${documentId}/chat`, {
      method: "POST",
      body: JSON.stringify(message),
    });
  }

  // =============================================================================
  // COMPLETION ENDPOINTS
  // =============================================================================

  /**
   * Generate the completed document with all placeholders filled
   * POST /api/v1/documents/{document_id}/complete
   */
  async completeDocument(
    documentId: DocumentId
  ): Promise<ApiResponse<DocumentCompletionResponse>> {
    return this.request<DocumentCompletionResponse>(
      `/api/v1/documents/${documentId}/complete`,
      { method: "POST" }
    );
  }

  /**
   * Download the completed document
   * GET /api/v1/documents/{document_id}/download
   */
  async downloadCompletedDocument(
    documentId: DocumentId
  ): Promise<ApiResponse<Blob>> {
    try {
      const url = `${this.config.baseUrl}/api/v1/documents/${documentId}/download`;
      const response = await fetch(url, {
        method: "GET",
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      return {
        success: true,
        data: blob,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Download failed",
      };
    }
  }

  // =============================================================================
  // HEALTH AND UTILITY ENDPOINTS
  // =============================================================================

  /**
   * Health check endpoint
   * GET /health
   */
  async healthCheck(): Promise<ApiResponse<HealthCheckResponse>> {
    return this.request<HealthCheckResponse>("/health", { method: "GET" });
  }

  /**
   * Root endpoint
   * GET /
   */
  async getRoot(): Promise<ApiResponse<any>> {
    return this.request<any>("/", { method: "GET" });
  }

  // =============================================================================
  // UTILITY METHODS
  // =============================================================================

  /**
   * Check if the API is available
   */
  async isApiAvailable(): Promise<boolean> {
    try {
      const response = await this.healthCheck();
      return response.success;
    } catch {
      return false;
    }
  }

  /**
   * Get API status and information
   */
  async getApiInfo(): Promise<{
    isAvailable: boolean;
    config: ApiConfig;
    health?: HealthCheckResponse;
  }> {
    const isAvailable = await this.isApiAvailable();
    let health: HealthCheckResponse | undefined;

    if (isAvailable) {
      const healthResponse = await this.healthCheck();
      health = healthResponse.data;
    }

    return {
      isAvailable,
      config: this.getConfig(),
      health,
    };
  }

  /**
   * Validate document upload before sending
   */
  validateDocumentUpload(file: File): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = [
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
    ];

    if (!file) {
      errors.push("No file provided");
    } else {
      if (file.size > maxSize) {
        errors.push("File size exceeds 10MB limit");
      }

      if (!allowedTypes.includes(file.type)) {
        errors.push("Only .docx and .doc files are supported");
      }

      if (file.name.length > 255) {
        errors.push("Filename is too long");
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
    };
  }
}

// Export singleton instance
export default new ApiService();
