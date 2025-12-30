import { GoogleGenAI, FunctionDeclaration, Type, Tool, LiveServerMessage, Modality } from "@google/genai";
import { AgentAction, TableData, LiveConnectionState, Template } from '../types';
import { AudioStreamPlayer } from './AudioStreamPlayer';
import { IVoiceProvider, VoiceProviderCallbacks } from './IVoiceProvider';
import { createPcmBlob, downsampleBuffer } from './audioUtils';

// --- TOOLS DEFINITION ---
const generateTableTool: FunctionDeclaration = {
  name: 'generateTable',
  description: 'Generates or updates a structured table. Use this for general data that doesn\'t fit specific tools.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      title: { type: Type.STRING },
      columns: { type: Type.ARRAY, items: { type: Type.STRING } },
      rows: { type: Type.ARRAY, items: { type: Type.OBJECT } },
      summary: { type: Type.STRING }
    },
    required: ['title', 'columns', 'rows']
  },
};

const updateInventoryTool: FunctionDeclaration = {
  name: 'updateInventory',
  description: 'Updates the Workshop Inventory. Use when the user mentions stock counts, materials, or suppliers.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      item: { type: Type.STRING, description: 'Name of the item (e.g., Wooden Wheels)' },
      quantity: { type: Type.NUMBER, description: 'Current stock count' },
      cost: { type: Type.NUMBER, description: 'Material cost per unit' },
      supplier: { type: Type.STRING, description: 'Supplier name' }
    },
    required: ['item', 'quantity']
  },
};

const addContactTool: FunctionDeclaration = {
  name: 'addContact',
  description: 'Adds or updates a person in the Naughty & Nice List.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      name: { type: Type.STRING },
      status: { type: Type.STRING, enum: ['Nice', 'Naughty'], description: 'Behavior status' },
      address: { type: Type.STRING },
      giftIdea: { type: Type.STRING }
    },
    required: ['name', 'status']
  },
};

const updateBudgetTool: FunctionDeclaration = {
  name: 'updateBudget',
  description: 'Updates the Toy Budget allocation.',
  parameters: {
    type: Type.OBJECT,
    properties: {
      category: { type: Type.STRING },
      amount: { type: Type.NUMBER, description: 'Allocated amount' },
      spent: { type: Type.NUMBER, description: 'Amount spent so far' }
    },
    required: ['category', 'amount']
  },
};

const tools: Tool[] = [{ functionDeclarations: [generateTableTool, updateInventoryTool, addContactTool, updateBudgetTool] }];

// --- REPOSITORY CLASS ---
export class GeminiLiveProvider implements IVoiceProvider {
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

  getDebugStats() {
    return {
      sent: this.debugAudioChunksSent,
      received: this.debugAudioChunksReceived
    };
  }

  // --- LIVE API IMPLEMENTATION ---

  async startSession(
    template: Template,
    callbacks: VoiceProviderCallbacks,
    metadata?: { masterCount?: number }
  ) {
    const { onStateChange, onMessage, onError } = callbacks;
    
    onStateChange(LiveConnectionState.CONNECTING);
    try { // Outer try to catch all initialization errors
      const masterCount = metadata?.masterCount ?? 0;
      // 1. Get Microphone Stream FIRST (Prevents Audio Session interruption later)
      console.log('[GeminiLiveProvider] Requesting microphone access...');
      try {
        this.activeMediaStream = await navigator.mediaDevices.getUserMedia({ 
          audio: true,
          video: false
        });
        console.log('[GeminiLiveProvider] Microphone access granted');
      } catch (micError: any) {
        console.error('[GeminiLiveProvider] Microphone access failed:', micError.name, micError.message);
        throw new Error(`Microphone access denied: ${micError.message}`);
      }

      // 2. Initialize Audio Input Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass();
      
      // 3. Initialize Streaming Audio Player (iOS-compatible)
      // This MUST happen during user gesture for iOS to unlock audio
      this.audioStreamPlayer = new AudioStreamPlayer();
      await this.audioStreamPlayer.start();
      console.log('[GeminiLiveProvider] AudioStreamPlayer started, state:', this.audioStreamPlayer.getState());
      
      // 4. Resume input context if needed
      if (this.inputAudioContext.state === 'suspended') {
        await this.inputAudioContext.resume();
      }
      
      console.log('[GeminiLiveProvider] Input AudioContext state:', this.inputAudioContext.state);
 
      // 4. Connect to Gemini Live
      const columns = template.requiredFields.map(f => f.label).join(', ');
      console.log('[GeminiLiveProvider] Connecting to Gemini Live API with model:', this.MODEL_LIVE);
      
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
            You are "Voice", a premium AI Interviewer. 
            ${template.id === 'voice-demo' ? `
            SESSION TYPE: Global Voice Interaction Demo.
            
             YOUR TASKS:
            1. Authenticate the user's conversational profile by asking exactly THREE questions:
               - "Have you talked to a voice agent before?"
               - "What country are you from?"
               - "What languages do you speak?"
            2. For each question, be brief and professional.
            3. Once all three are answered, calculate their unique Global Index. 
            4. Their specific record index is ${masterCount + 1}.
            5. The current estimated world population is approximately ${template.version === 'v1.0.0' ? '8.25 Billion' : '8.2 Billion'}.
            6. Call 'generateTable' with their record. The title MUST include their index (e.g., "PROFILE: ${masterCount + 1} OF [Total Population]").
            7. In the summary, explain that their record has been indexed in the Global Master Archive.
            ` : `
            SESSION TYPE: Structured Data Collection (${template.name}).
            OBJECTIVE: Populate columns: ${columns}.
            RULES: Ask ONE concise question at a time. Be warm, professional, and efficient.
            `}
            
            GLOBAL RULES:
            - ASK ONE CONCISE QUESTION AT A TIME.
            - When calling 'generateTable', return the FULL table with ALL collected rows.
            - If the user is unclear, politely ask for clarification.
          `,
        },
        callbacks: {
          onopen: () => {
            console.log('[GeminiLiveProvider] WebSocket connected! Session established. Setting up audio input...');
            onStateChange(LiveConnectionState.CONNECTED);
            // Small delay to ensure connection is stable before sending audio
            setTimeout(() => {
              this.setupAudioInput();
            }, 500);
          },
          onmessage: async (message: LiveServerMessage) => {
             const msgStr = JSON.stringify(message);
             console.log('[GeminiLiveProvider] Received message from Gemini:', msgStr.substring(0, 800));
             console.log('[GeminiLiveProvider] Message keys:', Object.keys(message));
             
             // Handle setup complete - now safe to send audio
             if (message.setupComplete) {
               console.log('[GeminiLiveProvider] Setup complete received, ready for audio');
               this.setupComplete = true;
             }
             
             // Handle Text Transcription (if enabled/available, though model usually sends audio)
             // We can infer text from tool calls or implement transcription if the model config supports it.
             // For this demo, we focus on Audio Output and Tool Calls.

             // 1. Handle Tool Calls
             if (message.toolCall) {
                for (const fc of message.toolCall.functionCalls) {
                   // Generic Table
                   if (fc.name === 'generateTable') {
                      const args = fc.args as any;
                      const tableData: TableData = {
                        title: args.title || 'Data',
                        columns: args.columns || [],
                        rows: args.rows || [],
                        summary: args.summary
                      };
                      onMessage(args.summary, { type: 'GENERATE_TABLE' }, tableData);
                   } 
                   // Inventory
                   else if (fc.name === 'updateInventory') {
                      const args = fc.args as any;
                      onMessage(`Updating inventory for ${args.item}...`, { type: 'UPDATE_INVENTORY', args });
                   }
                   // Contacts
                   else if (fc.name === 'addContact') {
                      const args = fc.args as any;
                      onMessage(`Adding ${args.name} to the list...`, { type: 'ADD_CONTACT', args });
                   }
                   // Budget
                   else if (fc.name === 'updateBudget') {
                      const args = fc.args as any;
                      onMessage(`Updating budget for ${args.category}...`, { type: 'UPDATE_BUDGET', args });
                   }

                   // Send response back to model for ALL tools
                   this.sessionPromise?.then(session => {
                     session.sendToolResponse({
                       functionResponses: {
                         id: fc.id,
                         name: fc.name,
                         response: { result: "Action executed successfully." }
                       }
                     });
                   });
                }
             }

             // 2. Handle Audio Output
             const serverContent = message.serverContent;
             if (serverContent?.modelTurn?.parts) {
               for (const part of serverContent.modelTurn.parts) {
                 if (part.inlineData?.data) {
                   const chunkSize = part.inlineData.data.length;
                   console.log('[GeminiLiveProvider] Received audio chunk, base64 length:', chunkSize);
                   
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
                     console.error('[GeminiLiveProvider] AudioStreamPlayer not initialized!');
                   }
                 }
                 if (part.text) {
                   console.log('[GeminiLiveProvider] Received text:', part.text);
                 }
               }
             }
             
             // 3. Handle Turn Completion (optional text updates could go here)
             if (message.serverContent?.turnComplete) {
                // Could trigger a UI update to show "Listening" state
             }
          },
          onclose: (event: any) => {
            console.log('[GeminiLiveProvider] WebSocket closed. Code:', event?.code, 'Reason:', event?.reason, 'Event:', JSON.stringify(event));
            onStateChange(LiveConnectionState.DISCONNECTED);
            // If we closed unexpectedly, report it
            if (event?.code && event.code !== 1000) {
              onError(`Connection closed: ${event?.reason || 'Unknown reason'} (code: ${event?.code})`);
            }
          },
          onerror: (e: any) => {
            console.error('[GeminiLiveProvider] WebSocket error:', e, JSON.stringify(e));
            onStateChange(LiveConnectionState.ERROR);
            onError("Connection error: " + (e?.message || e?.error || String(e)));
          }
        }
      });

    } catch (e: any) {
      const errorMessage = e?.message || e?.name || (typeof e === 'string' ? e : JSON.stringify(e));
      console.error("[GeminiLiveProvider] Failed to start live session:", errorMessage, e);
      onError(errorMessage || "Unknown error starting session");
      onStateChange(LiveConnectionState.ERROR);
      this.stopSession();
    }
  }
  
  async stopSession() {
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
      this.inputAudioContext.close().catch(() => {});
      this.inputAudioContext = null;
    }
    
    // 5. Stop Streaming Audio Player
    if (this.audioStreamPlayer) {
      this.audioStreamPlayer.stop();
      this.audioStreamPlayer = null;
    }
    
    this.audioReceivedLogged = false;
    this.setupComplete = false;
  }


  private setupAudioInput() {
    if (!this.inputAudioContext || !this.activeMediaStream || !this.sessionPromise) {
      console.error('[GeminiLiveProvider] setupAudioInput failed - missing dependencies:', {
        hasInputContext: !!this.inputAudioContext,
        hasMediaStream: !!this.activeMediaStream,
        hasSession: !!this.sessionPromise
      });
      return;
    }

    console.log('[GeminiLiveProvider] Setting up audio input pipeline...');
    console.log('[GeminiLiveProvider] Input sample rate:', this.inputAudioContext.sampleRate);
    
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
          finalData = downsampleBuffer(inputData, currentRate, 16000);
      } else {
          finalData = new Float32Array(inputData);
      }

      const pcmBlob = createPcmBlob(finalData);
      
      this.sessionPromise.then((session) => {
        session.sendRealtimeInput({ media: pcmBlob });
        chunkCount++;
        this.debugAudioChunksSent = chunkCount;
        if (chunkCount === 1) {
          // Log first chunk details for debugging
          console.log('[GeminiLiveProvider] First audio chunk - base64 length:', pcmBlob.data.length, 'mimeType:', pcmBlob.mimeType);
        }
        if (chunkCount % 50 === 0) {
          console.log('[GeminiLiveProvider] Sent', chunkCount, 'audio chunks to Gemini');
        }
      }).catch((err) => {
        console.error('[GeminiLiveProvider] Error sending audio chunk:', err);
      });
    };

    source.connect(scriptProcessor);
    scriptProcessor.connect(this.inputAudioContext.destination);
    console.log('[GeminiLiveProvider] Audio input pipeline connected!');
  }
}