import { GoogleGenAI, FunctionDeclaration, Type, Tool, LiveServerMessage, Modality } from "@google/genai";
import { ChatMessage, Role, AgentAction, TableData, Attachment, LiveConnectionState, Template } from '../types';
import { AudioStreamPlayer } from './AudioStreamPlayer';

// --- HELPER FUNCTIONS FOR AUDIO ENCODING ---
function encode(bytes: Uint8Array) {
  let binary = '';
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
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
  private audioStreamPlayer: AudioStreamPlayer | null = null;
  private sessionPromise: Promise<any> | null = null;
  private activeScriptProcessor: ScriptProcessorNode | null = null;
  private activeMediaStream: MediaStream | null = null;
  private audioReceivedLogged: boolean = false;
  private setupComplete: boolean = false;
  
  // Debug counters for UI display
  public debugAudioChunksReceived: number = 0;
  public debugAudioChunksSent: number = 0;

  // Model Constants - Gemini 2.0 Flash for Live API
  // Options: 'gemini-2.0-flash-exp', 'models/gemini-2.0-flash-exp'
  private MODEL_LIVE = 'gemini-2.0-flash-exp';
  
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
    console.log('[ChatRepository] Starting live session...');

    try { // Outer try to catch all initialization errors
      // 1. Get Microphone Stream FIRST (Prevents Audio Session interruption later)
      console.log('[ChatRepository] Requesting microphone access...');
      try {
        this.activeMediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: false
        });
        console.log('[ChatRepository] Microphone access granted');
      } catch (micError: any) {
        console.error('[ChatRepository] Microphone access failed:', micError.name, micError.message);
        throw new Error(`Microphone access denied: ${micError.message}`);
      }

      // 2. Initialize Audio Input Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass();
      
      // 3. Initialize Streaming Audio Player (iOS-compatible)
      // This MUST happen during user gesture for iOS to unlock audio
      this.audioStreamPlayer = new AudioStreamPlayer();
      await this.audioStreamPlayer.start();
      console.log('[ChatRepository] AudioStreamPlayer started, state:', this.audioStreamPlayer.getState());
      
      // 4. Resume input context if needed
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }
      
      console.log('[ChatRepository] Input AudioContext state:', this.inputAudioContext.state);
 
      // 4. Connect to Gemini Live
      const columns = template.requiredFields.map(f => f.label).join(', ');
      console.log('[ChatRepository] Connecting to Gemini Live API with model:', this.MODEL_LIVE);
      
      this.sessionPromise = this.ai.live.connect({
        model: this.MODEL_LIVE,
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: {
              prebuiltVoiceConfig: {
                voiceName: 'Aoede'  // One of Gemini's available voices
              }
            }
          },
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
            console.log('[ChatRepository] WebSocket connected! Session established. Setting up audio input...');
            onStateChange(LiveConnectionState.CONNECTED);
            // Small delay to ensure connection is stable before sending audio
            setTimeout(() => {
              this.setupAudioInput();
            }, 500);
          },
          onmessage: async (message: LiveServerMessage) => {
             const msgStr = JSON.stringify(message);
             console.log('[ChatRepository] Received message from Gemini:', msgStr.substring(0, 800));
             console.log('[ChatRepository] Message keys:', Object.keys(message));
             
             // Handle setup complete - now safe to send audio
             if (message.setupComplete) {
               console.log('[ChatRepository] Setup complete received, ready for audio');
               this.setupComplete = true;
             }
             
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
             const serverContent = message.serverContent;
             if (serverContent?.modelTurn?.parts) {
               for (const part of serverContent.modelTurn.parts) {
                 if (part.inlineData?.data) {
                   const chunkSize = part.inlineData.data.length;
                   console.log('[ChatRepository] Received audio chunk, base64 length:', chunkSize);
                   
                   // Visual debug: show we're receiving audio
                   if (!this.audioReceivedLogged) {
                     this.audioReceivedLogged = true;
                     console.warn('🎵 AUDIO DATA RECEIVED FROM GEMINI - pushing to streaming player...');
                   }
                   
                   // Push to streaming audio queue (iOS-compatible)
                   this.debugAudioChunksReceived++;
                   if (this.audioStreamPlayer) {
                     this.audioStreamPlayer.addPCM16(part.inlineData.data);
                   } else {
                     console.error('[ChatRepository] AudioStreamPlayer not initialized!');
                   }
                 }
                 if (part.text) {
                   console.log('[ChatRepository] Received text:', part.text);
                 }
               }
             }
             
             // 3. Handle Turn Completion (optional text updates could go here)
             if (message.serverContent?.turnComplete) {
                // Could trigger a UI update to show "Listening" state
             }
          },
          onclose: (event: any) => {
            console.log('[ChatRepository] WebSocket closed. Code:', event?.code, 'Reason:', event?.reason, 'Event:', JSON.stringify(event));
            onStateChange(LiveConnectionState.DISCONNECTED);
            // If we closed unexpectedly, report it
            if (event?.code && event.code !== 1000) {
              onError(`Connection closed: ${event?.reason || 'Unknown reason'} (code: ${event?.code})`);
            }
          },
          onerror: (e: any) => {
            console.error('[ChatRepository] WebSocket error:', e, JSON.stringify(e));
            onStateChange(LiveConnectionState.ERROR);
            onError("Connection error: " + (e?.message || e?.error || String(e)));
          }
        }
      });

    } catch (e: any) {
      const errorMessage = e?.message || e?.name || (typeof e === 'string' ? e : JSON.stringify(e));
      console.error("[ChatRepository] Failed to start live session:", errorMessage, e);
      onError(errorMessage || "Unknown error starting session");
      onStateChange(LiveConnectionState.ERROR);
      
      // Clean up any partial state
      this.cleanupSession();
    }
  }
  
  private cleanupSession() {
    if (this.activeMediaStream) {
      this.activeMediaStream.getTracks().forEach(t => t.stop());
      this.activeMediaStream = null;
    }
    if (this.activeScriptProcessor) {
      this.activeScriptProcessor.disconnect();
      this.activeScriptProcessor = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close().catch(() => {});
      this.inputAudioContext = null;
    }
    if (this.audioStreamPlayer) {
      this.audioStreamPlayer.stop();
      this.audioStreamPlayer = null;
    }
    this.sessionPromise = null;
    this.audioReceivedLogged = false;
    this.setupComplete = false;
  }


  private setupAudioInput() {
    if (!this.inputAudioContext || !this.activeMediaStream || !this.sessionPromise) {
      console.error('[ChatRepository] setupAudioInput failed - missing dependencies:', {
        hasInputContext: !!this.inputAudioContext,
        hasMediaStream: !!this.activeMediaStream,
        hasSession: !!this.sessionPromise
      });
      return;
    }

    console.log('[ChatRepository] Setting up audio input pipeline...');
    console.log('[ChatRepository] Input sample rate:', this.inputAudioContext.sampleRate);
    
    const source = this.inputAudioContext.createMediaStreamSource(this.activeMediaStream);
    const scriptProcessor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
    this.activeScriptProcessor = scriptProcessor;

    let chunkCount = 0;
    scriptProcessor.onaudioprocess = (e) => {
      if (!this.sessionPromise) return;
      if (!this.setupComplete) return; // Wait for setup to complete
      
      const inputData = e.inputBuffer.getChannelData(0);
      
      // Downsample to 16kHz if necessary
      const currentRate = this.inputAudioContext?.sampleRate || 16000;
      let finalData: Float32Array;

      if (currentRate !== 16000) {
          finalData = this.downsampleBuffer(inputData, currentRate, 16000);
      } else {
          // Clone the data since inputData buffer gets reused
          finalData = new Float32Array(inputData);
      }

      const pcmBlob = createBlob(finalData);
      
      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
        chunkCount++;
        this.debugAudioChunksSent = chunkCount;
        if (chunkCount === 1) {
          // Log first chunk details for debugging
          console.log('[ChatRepository] First audio chunk - base64 length:', pcmBlob.data.length, 'mimeType:', pcmBlob.mimeType);
        }
        if (chunkCount % 50 === 0) {
          console.log('[ChatRepository] Sent', chunkCount, 'audio chunks to Gemini');
        }
      }).catch((err) => {
        console.error('[ChatRepository] Error sending audio chunk:', err);
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
    console.log('[ChatRepository] Audio input pipeline connected!');
  }

  // Simple linear interpolation downsampler
  private downsampleBuffer(buffer: Float32Array, sampleRate: number, outSampleRate: number): Float32Array {
      if (outSampleRate === sampleRate) {
          return buffer;
      }
      if (outSampleRate > sampleRate) {
          // Upsampling not supported in this simple impl
          return buffer; 
      }
      const sampleRateRatio = sampleRate / outSampleRate;
      const newLength = Math.round(buffer.length / sampleRateRatio);
      const result = new Float32Array(newLength);
      
      let offsetResult = 0;
      let offsetBuffer = 0;
      
      while (offsetResult < result.length) {
          const nextOffsetBuffer = Math.round((offsetResult + 1) * sampleRateRatio);
          
          // Use average value of accumulated samples (simple decimation/averaging)
          // preventing aliasing better than just skipping
          let accum = 0, count = 0;
          for (let i = offsetBuffer; i < nextOffsetBuffer && i < buffer.length; i++) {
              accum += buffer[i];
              count++;
          }
          result[offsetResult] = count > 0 ? accum / count : 0;
          
          offsetResult++;
          offsetBuffer = nextOffsetBuffer;
      }
      return result;
  }


  async stopLiveSession() {
    // 1. Close Session
    if (this.sessionPromise) {
       this.sessionPromise = null;
    }

    // 2. Stop Microphone
    if (this.activeMediaStream) {
      this.activeMediaStream.getTracks().forEach(t => t.stop());
      this.activeMediaStream = null;
    }

    // 3. Stop Audio Input Processing
    if (this.activeScriptProcessor) {
      this.activeScriptProcessor.disconnect();
      this.activeScriptProcessor = null;
    }

    // 4. Close Input Context
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
    
    // 5. Stop Streaming Audio Player
    if (this.audioStreamPlayer) {
      this.audioStreamPlayer.stop();
      this.audioStreamPlayer = null;
    }
    
    this.audioReceivedLogged = false;
  }
}

export const chatRepository = new ChatRepository();