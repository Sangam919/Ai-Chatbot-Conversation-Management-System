const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';

class ApiClient {
  private getToken(): string | null {
    return localStorage.getItem('token');
  }

  private async request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    const token = this.getToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...(options.headers as Record<string, string> || {}),
    };

    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }

    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });

    if (!response.ok) {
      let errorDetail = 'API request failed';
      try {
        const errJson = await response.json();
        errorDetail = errJson.detail || errorDetail;
      } catch {
        // fallback
      }
      throw new Error(errorDetail);
    }

    return response.json();
  }

  // Auth
  async login(payload: { email: string; password: string }) {
    return this.request<{ access_token: string; user: any }>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async register(payload: { name: string; email: string; password: string; role?: string }) {
    return this.request<{ access_token: string; user: any }>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  async getMe() {
    return this.request<any>('/auth/me');
  }

  async updateProfile(payload: { name?: string; preferences?: any }) {
    return this.request<any>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(payload),
    });
  }

  // Conversations
  async getConversations(status: string = 'active', search?: string) {
    let url = `/conversations?status=${status}`;
    if (search) url += `&search=${encodeURIComponent(search)}`;
    return this.request<any[]>(url);
  }

  async createConversation(title?: string, tags: string[] = []) {
    return this.request<any>('/conversations', {
      method: 'POST',
      body: JSON.stringify({ title, tags }),
    });
  }

  async updateConversation(id: string, updates: { title?: string; status?: string; tags?: string[] }) {
    return this.request<any>(`/conversations/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteConversation(id: string, permanent: boolean = false) {
    return this.request<{ message: string }>(`/conversations/${id}?permanent=${permanent}`, {
      method: 'DELETE',
    });
  }

  // Messages
  async getMessages(conversationId: string) {
    return this.request<any[]>(`/conversations/${conversationId}/messages`);
  }

  async sendMessage(conversationId: string, content: string) {
    return this.request<any>(`/conversations/${conversationId}/messages`, {
      method: 'POST',
      body: JSON.stringify({ content }),
    });
  }

  async searchMessages(query: string) {
    return this.request<any[]>(`/conversations/search/text?query=${encodeURIComponent(query)}`);
  }

  // Feedback
  async submitFeedback(payload: { message_id: string; conversation_id: string; rating: string; comment?: string }) {
    return this.request<any>('/feedback', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  }

  // Analytics
  async getDashboardAnalytics() {
    return this.request<any>('/analytics/dashboard');
  }

  // DB Explorer
  async getDatabaseOverview() {
    return this.request<any>('/db-explorer/overview');
  }

  async getPredefinedQueries() {
    return this.request<any[]>('/db-explorer/predefined-queries');
  }

  async getExplainPlan() {
    return this.request<any>('/db-explorer/explain-plan');
  }
}

export const api = new ApiClient();
