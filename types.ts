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
  type: 'GENERATE_ITEM_LIST' | 'OPEN_CAMERA' | 'SHOW_DETAILS' | 'NONE';
  args?: Record<string, any>;
}

export interface Attachment {
  type: 'image' | 'video' | 'audio';
  content: string; // Base64 string
  mimeType: string;
  url?: string; // For local preview
}

export interface ChatMessage {
  id: string;
  role: Role;
  content: string;
  timestamp: number;
  isLoading?: boolean;
  action?: AgentAction; // The "Server Action" trigger
  actionData?: any; // Result data for the action (e.g., the list of items)
  attachments?: Attachment[]; // Multimedia attachments
}

export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: string | null;
}

// Mock Inventory Item Data
export interface InventoryItem {
  id: string;
  name: string;
  sku: string;
  quantity: number;
  location: string;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
}