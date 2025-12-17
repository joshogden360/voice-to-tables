
// Mirrors ChatModels.kt from PDF

export enum Role {
  USER = 'user',
  ASSISTANT = 'assistant',
  SYSTEM = 'system'
}

export interface ChatTurn {
  role: Role;
  content: string;
}

export interface AgentAction {
  type: 'GENERATE_TABLE' | 'OPEN_SCANNER' | 'NONE';
  args?: Record<string, any>;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio';
  content: string; // Base64 string
  mimeType: string;
  url?: string; // For local preview
}

// Generic Table Data Structure
export interface TableData {
  title: string;
  columns: string[];
  rows: Record<string, string | number>[];
  summary?: string;
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isLoading?: boolean;
  action?: AgentAction; // The "Server Action" trigger
  actionData?: TableData; // Result data for the action (the generic table)
  attachments?: Attachment[]; // Multimedia attachments
}

export enum LiveConnectionState {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

export interface ChatState {
  messages: ChatMessage[];
  liveState: LiveConnectionState;
  error: string | null;
}

// --- Enterprise Features ---

export interface Template {
  id: string;
  name: string;
  category: string; // e.g., 'Health', 'Safety', 'Operations'
  requiredFields: { label: string; completed: boolean }[];
  syncDestination: string; // e.g., 'Notion', 'Salesforce'
  version: string;
}

export interface JournalEntry {
  id: string;
  date: string; // "Oct 12, 2024"
  title: string;
  status: 'Synced' | 'Pending';
  preview: string; // "2,400 kcal" or "3 Hazards Found"
}
