import { GoogleGenAI, FunctionDeclaration, Type, Tool, LiveServerMessage, Modality } from "@google/genai";
import { ChatMessage, Role, AgentAction, TableData, Attachment, LiveConnectionState, Template } from '../types';

// --- HELPER FUNCTIONS FOR AUDIO ENCODING/DECODING ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function decode(base64: string) {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  return bytes;
}

async function decodeAudioData(
  data: Uint8Array,
  ctx: AudioContext,
  sampleRate: number,
  numChannels: number,
): Promise<AudioBuffer> {
  const dataInt16 = new Int16Array(data.buffer);
  const frameCount = dataInt16.length / numChannels;
  const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);

  for (let channel = 0; channel < numChannels; channel++) {
    const channelData = buffer.getChannelData(channel);
    for (let i = 0; i < frameCount; i++) {
      channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
    }
  }
  return buffer;
}

function createBlob(data: Float32Array): { data: string; mimeType: string } {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    int16[i] = data[i] * 32768;
  }
  return {
    data: encode(new Uint8Array(int16.buffer)),
    mimeType: 'audio/pcm;rate=16000',
  };
}

// --- TOOLS DEFINITION ---
const generateTableTool: FunctionDeclaration = {
  name: 'generateTable',
  description: 'Generates or updates a structured table from the collected survey data.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING, description: 'A descriptive title for the data set' },
      columns: { 
        type: Type.ARRAY, 
        items: { type: Type.STRING },
        description: 'List of column headers' 
      },
      rows: {
        type: Type.ARRAY,
        items: { type: Type.OBJECT },
        description: 'List of objects representing the entries'
      },
      summary: { type: Type.STRING, description: 'Brief summary or insight' }
    },
    required: ['title', 'columns', 'rows']
  },
};

const tools: Tool[] = [{ functionDeclarations: [generateTableTool] }];

// --- REPOSITORY CLASS ---
class ChatRepository {
  private ai: GoogleGenAI;
  private inputAudioContext: AudioContext | null = null;
  private outputAudioContext: AudioContext | null = null;
  private nextStartTime: number = 0;
  private sources: Set<AudioBufferSourceNode> = new Set();
  private sessionPromise: Promise<any> | null = null;
  private activeScriptProcessor: ScriptProcessorNode | null = null;
  private activeMediaStream: MediaStream | null = null;

  // Model Constants
  private MODEL_LIVE = 'gemini-2.5-flash-native-audio-preview-09-2025';
  
  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });
  }

  async loadHistory(): Promise<ChatMessage[]> {
    // Use sessionStorage so data is cleared when the tab/browser is closed
    const stored = sessionStorage.getItem('chat_history');
    if (stored) {
      return JSON.parse(stored);
    }
    return [];
  }

  async saveHistory(messages: ChatMessage[]) {
    sessionStorage.setItem('chat_history', JSON.stringify(messages));
  }

  async clearHistory() {
    sessionStorage.removeItem('chat_history');
  }

  // --- LIVE API IMPLEMENTATION ---

  async startLiveSession(
    template: Template,
    onStateChange: (state: LiveConnectionState) => void,
    onMessage: (text: string | null, action?: AgentAction, actionData?: any) => void,
    onError: (error: string) => void
  ) {
    onStateChange(LiveConnectionState.CONNECTING);

    try {
      // 1. Initialize Audio Contexts
      this.inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      this.outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });
      this.nextStartTime = 0;

      // 2. Get Microphone Stream
      this.activeMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // 3. Connect to Gemini Live
      const columns = template.requiredFields.map(f => f.label).join(', ');
      
      this.sessionPromise = this.ai.live.connect({
        model: this.MODEL_LIVE,
        config: {
          responseModalities: [Modality.AUDIO],
          tools: tools,
          systemInstruction: `
            You are an expert Voice Interviewer helping the user fill out a ${template.name}.
            
            OBJECTIVE:
            Gather data to generate a table with the following COLUMNS: ${columns}.

            RULES:
            1. Ask ONE concise question at a time.
            2. When you have enough info for a row (or multiple rows), call 'generateTable'.
            3. Ensure the 'columns' argument in 'generateTable' matches: [${columns}].
            4. IMPORTANT: When calling 'generateTable', you MUST return the FULL table containing ALL rows collected in this session so far, plus the new ones. Do not just return the new row. Merge them.
            5. Be conversational but efficient.
          `,
        },
        callbacks: {
          onopen: () => {
            onStateChange(LiveConnectionState.CONNECTED);
            this.setupAudioInput();
          },
          onmessage: async (message: LiveServerMessage) => {
             // Handle Text Transcription (if enabled/available, though model usually sends audio)
             // We can infer text from tool calls or implement transcription if the model config supports it.
             // For this demo, we focus on Audio Output and Tool Calls.

             // 1. Handle Tool Calls (The Table Generation)
             if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                   if (fc.name === 'generateTable') {
                      const args = fc.args as any;
                      const tableData: TableData = {
                        title: args.title || 'Data',
                        columns: args.columns || [],
                        rows: args.rows || [],
                        summary: args.summary
                      };
                      
                      // Notify UI
                      onMessage(args.summary, { type: 'GENERATE_TABLE' }, tableData);

                      // Send response back to model
                      this.sessionPromise?.then(session => {
                        session.sendToolResponse({
                          functionResponses: {
                            id: fc.id,
                            name: fc.name,
                            response: { result: "Table displayed to user." }
                          }
                        });
                      });
                   }
                }
             }

             // 2. Handle Audio Output
             const base64Audio = message.serverContent?.modelTurn?.parts[0]?.inlineData?.data;
             if (base64Audio) {
                this.playAudioChunk(base64Audio);
             }
             
             // 3. Handle Turn Completion (optional text updates could go here)
             if (message.serverContent?.turnComplete) {
                // Could trigger a UI update to show "Listening" state
             }
          },
          onclose: () => {
            onStateChange(LiveConnectionState.DISCONNECTED);
          },
          onerror: (e) => {
            console.error(e);
            onStateChange(LiveConnectionState.ERROR);
            onError("Connection error");
          }
        }
      });

    } catch (e: any) {
      console.error("Failed to start live session", e);
      onError(e.message);
      onStateChange(LiveConnectionState.ERROR);
    }
  }

  private setupAudioInput() {
    if (!this.inputAudioContext || !this.activeMediaStream || !this.sessionPromise) return;

    const source = this.inputAudioContext.createMediaStreamSource(this.activeMediaStream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    this.activeScriptProcessor = scriptProcessor;

    scriptProcessor.onaudioprocess = (e) => {
      if (!this.sessionPromise) return;
      
      const inputData = e.inputBuffer.getChannelData(0);
      const pcmBlob = createBlob(inputData);
      
      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
  }

  private async playAudioChunk(base64Audio: string) {
    if (!this.outputAudioContext) return;

    try {
      const audioBuffer = await decodeAudioData(
        decode(base64Audio),
        this.outputAudioContext,
        24000,
        1
      );

      this.nextStartTime = Math.max(this.outputAudioContext.currentTime, this.nextStartTime);
      
      const source = this.outputAudioContext.createBufferSource();
      source.buffer = audioBuffer;
      source.connect(this.outputAudioContext.destination);
      source.start(this.nextStartTime);
      
      this.nextStartTime += audioBuffer.duration;
      this.sources.add(source);

      source.onended = () => {
        this.sources.delete(source);
      };
    } catch (e) {
      console.error("Error decoding audio", e);
    }
  }

  async stopLiveSession() {
    // 1. Close Session
    if (this.sessionPromise) {
       // Note: The SDK doesn't explicitly expose close() on the promise result type easily in all versions,
       // but typically we stop sending audio.
       // Ideally we would call session.close() if available.
       this.sessionPromise = null;
    }

    // 2. Stop Microphone
    if (this.activeMediaStream) {
      this.activeMediaStream.getTracks().forEach(t => t.stop());
      this.activeMediaStream = null;
    }

    // 3. Stop Audio Processing
    if (this.activeScriptProcessor) {
      this.activeScriptProcessor.disconnect();
      this.activeScriptProcessor = null;
    }

    // 4. Close Contexts
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    if (this.outputAudioContext) {
      this.outputAudioContext.close(); // Stop playing audio
      this.outputAudioContext = null;
    }
    
    // 5. Clear Buffer
    this.sources.forEach(s => s.stop());
    this.sources.clear();
  }
}

export const chatRepository = new ChatRepository();