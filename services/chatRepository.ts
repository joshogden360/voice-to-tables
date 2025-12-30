import { Template, LiveConnectionState, AgentAction, TableData } from '../types';
import { IVoiceProvider, VoiceProviderCallbacks } from './IVoiceProvider';
import { GeminiLiveProvider } from './GeminiLiveProvider';
// import { ElevenLabsProvider } from './ElevenLabsProvider'; // Future

export class ChatRepository {
  private activeProvider: IVoiceProvider;
  private geminiProvider: GeminiLiveProvider;
  // private elevenLabsProvider: ElevenLabsProvider | null = null;
  
  constructor() {
    this.geminiProvider = new GeminiLiveProvider();
    this.activeProvider = this.geminiProvider;
  }

  setProvider(providerName: 'gemini' | 'elevenlabs') {
    console.log(`[ChatRepository] Switching provider to ${providerName}`);
    if (providerName === 'gemini') {
      this.activeProvider = this.geminiProvider;
    } else {
        // Init ElevenLabs if needed
        // this.activeProvider = ...
    }
  }

  get debugAudioChunksSent(): number {
    return this.activeProvider.getDebugStats().sent;
  }

  get debugAudioChunksReceived(): number {
    return this.activeProvider.getDebugStats().received;
  }

  async startLiveSession(
    template: Template,
    onStateChange: (state: LiveConnectionState) => void,
    onMessage: (text: string | null, action?: AgentAction, actionData?: any) => void,
    onError: (error: string) => void,
    metadata?: { masterCount?: number }
  ) {
    const callbacks: VoiceProviderCallbacks = {
        onStateChange,
        onMessage,
        onError
    };
    return this.activeProvider.startSession(template, callbacks, metadata);
  }

  async stopLiveSession() {
    return this.activeProvider.stopSession();
  }
}

export const chatRepository = new ChatRepository();