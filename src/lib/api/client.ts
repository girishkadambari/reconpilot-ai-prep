import { ApiResponse, ApiError } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000";

class ApiClient {
  private getHeaders(contentType?: string): Headers {
    const headers = new Headers();
    if (contentType) {
      headers.append("Content-Type", contentType);
    }
    
    const token = localStorage.getItem("rp_auth_token");
    if (token) {
      headers.append("Authorization", `Bearer ${token}`);
    }
    
    return headers;
  }

  private async handleResponse<T>(response: Response): Promise<T> {
    const json = await response.json().catch(() => ({}));
    
    if (!response.ok) {
      const error: ApiError & { status?: number } = {
        error: json.error || { code: "UNKNOWN_ERROR", message: "An unexpected error occurred", details: {} },
        request_id: json.request_id || response.headers.get("X-Request-ID") || "unknown",
        status: response.status,
      };
      throw error;
    }

    // Backend standardized envelope unwrapping
    const result = json as ApiResponse<T>;
    return result.data;
  }

  async get<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "GET",
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }

  async post<T>(path: string, data?: any): Promise<T> {
    const isFormData = data instanceof FormData;
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "POST",
      headers: this.getHeaders(isFormData ? undefined : "application/json"),
      body: isFormData ? data : JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async patch<T>(path: string, data?: any): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "PATCH",
      headers: this.getHeaders("application/json"),
      body: JSON.stringify(data),
    });
    return this.handleResponse<T>(response);
  }

  async delete<T>(path: string): Promise<T> {
    const response = await fetch(`${BASE_URL}${path}`, {
      method: "DELETE",
      headers: this.getHeaders(),
    });
    return this.handleResponse<T>(response);
  }
}

export const apiClient = new ApiClient();
