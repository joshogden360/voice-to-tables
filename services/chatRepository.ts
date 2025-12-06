import { GoogleGenAI, FunctionDeclaration, Type, Tool } from "@google/genai";
import { ChatMessage, Role, AgentAction, InventoryItem, Attachment } from '../types';

// Mock Data for the simulation
const MOCK_INVENTORY: InventoryItem[] = [
  { id: '1', name: 'Industrial Drill 5000', sku: 'DR-5000', quantity: 12, location: 'A-12', status: 'In Stock' },
  { id: '2', name: 'Safety Gloves (L)', sku: 'SG-L', quantity: 450, location: 'B-04', status: 'In Stock' },
  { id: '3', name: 'Hydraulic Pump', sku: 'HP-200', quantity: 2, location: 'C-01', status: 'Low Stock' },
  { id: '4', name: 'Circuit Board v2', sku: 'CB-V2', quantity: 0, location: 'D-99', status: 'Out of Stock' },
];

// 1. Define Tools (Actions)
const listInventoryTool: FunctionDeclaration = {
  name: 'listInventoryItems',
  description: 'List inventory items based on a search query or status.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      query: { type: Type.STRING, description: 'Search term for item name or SKU' },
      status: { type: Type.STRING, description: 'Filter by status (e.g. "Low Stock")' }
    },
  },
};

const openCameraTool: FunctionDeclaration = {
  name: 'openScanner',
  description: 'Open the camera to scan a barcode or QR code.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      mode: { type: Type.STRING, description: 'Scan mode: "qr" or "barcode"' }
    },
  },
};

const tools: Tool[] = [{ functionDeclarations: [listInventoryTool, openCameraTool] }];

// 2. Repository Class
class ChatRepository {
  private ai: GoogleGenAI;
  
  // Model Constants
  private MODEL_FAST = 'gemini-flash-lite-latest'; // Fast AI responses
  private MODEL_TRANSCRIPTION = 'gemini-2.5-flash'; // Audio Transcription
  private MODEL_MULTIMODAL = 'gemini-3-pro-preview'; // Video/Image Analysis
  private MODEL_IMAGE_EDIT = 'gemini-2.5-flash-image'; // Image Editing
  
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  // Helper to simulate DB load
  async loadHistory(): Promise<ChatMessage[]> {
    const stored = localStorage.getItem('chat_history');
    if (stored) {
      return JSON.parse(stored);
    }
    return [{
      id: 'init-1',
      role: Role.ASSISTANT,
      content: "Hello! I'm your Inventory Assistant. I can help you find items, check stock, analyze visual data, or transcribe notes. How can I help?",
      timestamp: Date.now()
    }];
  }

  async saveHistory(messages: ChatMessage[]) {
    localStorage.setItem('chat_history', JSON.stringify(messages));
  }

  async clearHistory() {
    localStorage.removeItem('chat_history');
  }

  // Audio Transcription
  async transcribeAudio(audioBase64: string): Promise<string> {
    try {
      const response = await this.ai.models.generateContent({
        model: this.MODEL_TRANSCRIPTION,
        contents: {
          parts: [
            { inlineData: { mimeType: 'audio/wav', data: audioBase64 } },
            { text: "Transcribe this audio exactly as spoken. Return only the text." }
          ]
        }
      });
      return response.text || "";
    } catch (error) {
      console.error("Transcription failed", error);
      throw new Error("Failed to transcribe audio.");
    }
  }

  // The main interaction logic
  async sendMessage(
    userMessage: string, 
    history: ChatMessage[],
    attachments: Attachment[] = [],
    isImageEditMode: boolean = false
  ): Promise<{ 
    reply: string, 
    action?: AgentAction,
    actionData?: any,
    generatedAttachments?: Attachment[]
  }> {
    
    // 1. Select Model based on Context
    let selectedModel = this.MODEL_FAST; // Default to Fast AI
    const hasImage = attachments.some(a => a.type === 'image');
    const hasVideo = attachments.some(a => a.type === 'video');

    if (isImageEditMode && hasImage) {
      selectedModel = this.MODEL_IMAGE_EDIT;
    } else if (hasImage || hasVideo) {
      selectedModel = this.MODEL_MULTIMODAL;
    }

    // 2. Construct Content Parts
    const currentParts: any[] = [];
    
    // Add attachments to the current turn
    attachments.forEach(att => {
      // Clean base64 string if it contains metadata header
      const base64Data = att.content.split(',')[1] || att.content;
      currentParts.push({
        inlineData: {
          mimeType: att.mimeType,
          data: base64Data
        }
      });
    });

    // Add text prompt
    currentParts.push({ text: userMessage });

    // 3. Construct History (for context)
    // Note: Older models or specific edit models might not support multi-turn history with mixed media well,
    // but we will try to pass text history for context.
    const historyContents = history
      .filter(m => m.role !== Role.SYSTEM)
      .map(m => ({
        role: m.role === Role.USER ? 'user' : 'model',
        parts: [{ text: m.content }]
      }));

    // Add current message
    historyContents.push({
      role: 'user',
      parts: currentParts
    });

    try {
      // Configuration for the request
      const requestConfig: any = {};
      
      // Only add tools if we are NOT in image edit mode (Flash Image doesn't support these tools usually)
      if (!isImageEditMode) {
        requestConfig.tools = tools;
        requestConfig.systemInstruction = "You are an intelligent inventory assistant. Use tools for list/scan actions. For video/image analysis, provide detailed insights.";
      }

      const result = await this.ai.models.generateContent({
        model: selectedModel,
        contents: historyContents,
        config: requestConfig
      });

      const candidate = result.candidates?.[0];
      const part = candidate?.content?.parts?.[0];

      // Handle Generated Images (from Edit Mode)
      const generatedAttachments: Attachment[] = [];
      if (isImageEditMode && candidate?.content?.parts) {
         for (const p of candidate.content.parts) {
            if (p.inlineData) {
               generatedAttachments.push({
                 type: 'image',
                 mimeType: p.inlineData.mimeType || 'image/png',
                 content: p.inlineData.data,
                 url: `data:${p.inlineData.mimeType};base64,${p.inlineData.data}`
               });
            }
         }
      }

      // Handle Function Calls (The "Action System")
      if (part?.functionCall) {
        const fc = part.functionCall;
        const fnName = fc.name;
        const fnArgs = fc.args as any;

        if (fnName === 'listInventoryItems') {
           const query = fnArgs.query?.toLowerCase() || '';
           const status = fnArgs.status?.toLowerCase();
           
           let items = MOCK_INVENTORY;
           if (query) {
             items = items.filter(i => i.name.toLowerCase().includes(query) || i.sku.toLowerCase().includes(query));
           }
           if (status) {
             items = items.filter(i => i.status.toLowerCase() === status);
           }

           return {
             reply: `I found ${items.length} items matching your request.`,
             action: { type: 'GENERATE_ITEM_LIST', args: fnArgs },
             actionData: items
           };
        }

        if (fnName === 'openScanner') {
          return {
            reply: "Opening the scanner now...",
            action: { type: 'OPEN_CAMERA', args: fnArgs }
          };
        }
      }

      // Default text response
      let replyText = candidate?.content?.parts?.filter(p => p.text).map(p => p.text).join('') || "";
      
      if (generatedAttachments.length > 0 && !replyText) {
        replyText = "Here is the edited image.";
      } else if (!replyText) {
        replyText = "I didn't understand that.";
      }

      return {
        reply: replyText,
        generatedAttachments
      };

    } catch (error) {
      console.error("Gemini API Error:", error);
      throw new Error(`Failed to process request with ${selectedModel}.`);
    }
  }
}

export const chatRepository = new ChatRepository();