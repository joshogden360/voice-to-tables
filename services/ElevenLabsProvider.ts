import { Template, LiveConnectionState, AgentAction, TableData } from '../types';
import { IVoiceProvider, VoiceProviderCallbacks } from './IVoiceProvider';
import { AudioStreamPlayer } from './AudioStreamPlayer';
import { createPcmBlob, downsampleBuffer } from './audioUtils';

// ElevenLabs ConvAI WebSocket URL
const ELEVENLABS_WS_URL = 'wss://api.elevenlabs.io/v1/convai/conversation?agent_id=';

export class ElevenLabsProvider implements IVoiceProvider {
  private ws: WebSocket | null = null;
  private audioStreamPlayer: AudioStreamPlayer | null = null;
  private inputAudioContext: AudioContext | null = null;
  private activeMediaStream: MediaStream | null = null;
  private activeScriptProcessor: ScriptProcessorNode | null = null;
  
  // Stats
  public sentChunks = 0;
  public receivedChunks = 0;

  getDebugStats() {
    return {
      sent: this.sentChunks,
      received: this.receivedChunks
    };
  }

  async startSession(
    template: Template,
    callbacks: VoiceProviderCallbacks,
    metadata?: { masterCount?: number }
  ) {
    const { onStateChange, onMessage, onError } = callbacks;
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID || '';

    if (!agentId) {
      onError("Missing ElevenLabs Agent ID");
      return;
    }

    onStateChange(LiveConnectionState.CONNECTING);

    try {
      // 1. Mic
      this.activeMediaStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // 2. Audio Context
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.inputAudioContext = new AudioContextClass();

      // 3. Player
      this.audioStreamPlayer = new AudioStreamPlayer();
      this.audioStreamPlayer.sourceRate = 24000; // Adjust if ElevenLabs sends 44.1k or different
      await this.audioStreamPlayer.start();

      // 4. WebSocket
      this.ws = new WebSocket(ELEVENLABS_WS_URL + agentId);
      this.ws.binaryType = 'arraybuffer';

      this.ws.onopen = () => {
        console.log('[ElevenLabsProvider] Connected');
        onStateChange(LiveConnectionState.CONNECTED);
        this.setupAudioInput();
      };

      this.ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        if (data.type === 'audio') {
           // Decode Base64 and play
           // Assuming data.audio_event.audio_base_64
           if (data.audio_event?.audio_base_64) {
             this.receivedChunks++;
             this.audioStreamPlayer?.addPCM16(data.audio_event.audio_base_64);
           }
        } else if (data.type === 'agent_response') {
           // Text output
           console.log('[ElevenLabs] Agent response:', data);
        }
        // Handle other events (transcription, etc.)
      };

      this.ws.onerror = (e) => {
        console.error('[ElevenLabsProvider] Error:', e);
        onStateChange(LiveConnectionState.ERROR);
        onError("ElevenLabs connection error");
      };

      this.ws.onclose = () => {
        console.log('[ElevenLabsProvider] Closed');
        onStateChange(LiveConnectionState.DISCONNECTED);
      };

    } catch (e: any) {
      onError(e.message);
      onStateChange(LiveConnectionState.ERROR);
      this.stopSession();
    }
  }

  async stopSession() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
    if (this.activeMediaStream) {
      this.activeMediaStream.getTracks().forEach(t => t.stop());
      this.activeMediaStream = null;
    }
    if (this.audioStreamPlayer) {
      this.audioStreamPlayer.stop();
      this.audioStreamPlayer = null;
    }
    if (this.inputAudioContext) {
      this.inputAudioContext.close();
      this.inputAudioContext = null;
    }
  }

  /* ... (setupAudioInput is already partially defined, but let's rewrite it cleanly) */
  private setupAudioInput() {
     if (!this.inputAudioContext || !this.activeMediaStream || !this.ws) return;

     const source = this.inputAudioContext.createMediaStreamSource(this.activeMediaStream);
     const processor = this.inputAudioContext.createScriptProcessor(4096, 1, 1);
     this.activeScriptProcessor = processor;

     processor.onaudioprocess = (e) => {
        if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;
        
        const inputData = e.inputBuffer.getChannelData(0);
        const currentRate = this.inputAudioContext?.sampleRate || 16000;
        const finalData = downsampleBuffer(inputData, currentRate, 16000);
        
        const blob = createPcmBlob(finalData, 16000);
        
        const userAudioEvent = {
          type: "user_audio_chunk",
          user_audio_chunk_event: {
            user_input_audio_format: "pcm_16000",
            audio_base_64: blob.data
          }
        };
        
        this.ws.send(JSON.stringify(userAudioEvent));
        this.sentChunks++;
     };
     
     source.connect(processor);
     processor.connect(this.inputAudioContext.destination);
  }
}
