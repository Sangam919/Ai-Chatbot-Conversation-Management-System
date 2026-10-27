export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'user' | 'admin';
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    notifications_enabled: boolean;
  };
  created_at: string;
  updated_at: string;
}

export interface Conversation {
  _id: string;
  user_id: string;
  title: string;
  status: 'active' | 'archived';
  tags: string[];
  message_count: number;
  created_at: string;
  updated_at: string;
  last_message_at?: string;
}

export interface Message {
  _id: string;
  conversation_id: string;
  user_id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  response_time_ms?: number;
  token_usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
  model_name?: string;
  metadata?: Record<string, any>;
}

export interface Feedback {
  _id: string;
  message_id: string;
  conversation_id: string;
  user_id: string;
  rating: 'positive' | 'negative';
  comment?: string;
  created_at: string;
}

export interface AnalyticsData {
  summary: {
    total_conversations: number;
    active_conversations: number;
    total_messages: number;
    avg_response_time_ms: number;
    positive_feedback_percentage: number;
    total_feedback_count: number;
    total_registered_users?: number;
    is_admin: boolean;
  };
  charts: {
    daily_conversations: { date: string; conversations: number }[];
    daily_messages: { date: string; messages: number }[];
    feedback_distribution: { name: string; value: number }[];
  };
  top_conversations: {
    id: string;
    title: string;
    message_count: number;
    status: string;
    updated_at: string;
  }[];
  recent_activity: {
    id: string;
    snippet: string;
    response_time_ms: number;
    timestamp: string;
    rating: string;
  }[];
}

export interface DatabaseOverview {
  database_name: string;
  collections: {
    name: string;
    document_count: number;
    indexes: { name: string; key: [string, number][]; unique: boolean }[];
    sample_document: any;
  }[];
  architecture_notes: {
    model_type: string;
    embedding_vs_referencing: string;
    acid_compliance: string;
  };
}
