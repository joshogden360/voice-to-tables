/**
 * AudioStreamPlayer - iOS-compatible streaming audio player
 * 
 * The key insight: iOS cannot play individual WebSocket chunks as separate AudioSources.
 * Instead, we use a continuous ScriptProcessor that reads from a buffer queue.
 * This keeps the iOS Audio Hardware "awake" and prevents stuttering/silence.
 */
export class AudioStreamPlayer {
  private audioContext: AudioContext | null = null;
  private scriptNode: ScriptProcessorNode | null = null;
  private audioQueue: Float32Array[] = [];
  private isPlaying: boolean = false;
  private readonly sourceRate: number = 24000; // Gemini sends 24kHz

  constructor() {
    // Context will be created on start() to ensure it happens on user gesture
  }

  async start(): Promise<void> {
    // 1. Create Context (Native Rate) - must happen on user gesture for iOS
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    this.audioContext = new AudioContextClass();
    
    console.log('[AudioStreamPlayer] Created AudioContext, state:', this.audioContext.state, 'sampleRate:', this.audioContext.sampleRate);

    // 2. Resume if suspended (iOS requirement)
    if (this.audioContext.state === 'suspended') {
      console.log('[AudioStreamPlayer] Resuming suspended AudioContext...');
      await this.audioContext.resume();
    }

    // 3. Create a ScriptProcessor (Buffer size 4096 = ~85ms latency, good balance)
    // Using 4096 gives us enough buffer to handle network jitter
    this.scriptNode = this.audioContext.createScriptProcessor(4096, 1, 1);
    
    this.scriptNode.onaudioprocess = (e) => {
      const output = e.outputBuffer.getChannelData(0);
      
      // If we have nothing to play, fill with silence to keep connection open
      if (this.audioQueue.length === 0) {
        output.fill(0);
        return;
      }

      // Simple FIFO Queue Processing
      let offset = 0;
      while (offset < output.length && this.audioQueue.length > 0) {
        const nextBuffer = this.audioQueue[0];
        
        // Take as much as we can from the next buffer
        const chunkLength = Math.min(nextBuffer.length, output.length - offset);
        
        // Copy data to output
        output.set(nextBuffer.subarray(0, chunkLength), offset);
        
        offset += chunkLength;

        // Manage the queue
        if (chunkLength === nextBuffer.length) {
          this.audioQueue.shift(); // Finished this chunk
        } else {
          // We only used part of the chunk, save the rest
          this.audioQueue[0] = nextBuffer.subarray(chunkLength);
        }
      }

      // If we ran out of data mid-buffer, fill the rest with silence
      if (offset < output.length) {
        output.fill(0, offset);
      }
    };

    this.scriptNode.connect(this.audioContext.destination);
    this.isPlaying = true;
    
    console.log('[AudioStreamPlayer] Started streaming audio player, context state:', this.audioContext.state);
  }

  /**
   * Add PCM16 audio data from Gemini to the playback queue
   */
  addPCM16(base64Data: string): void {
    if (!this.audioContext) {
      console.error('[AudioStreamPlayer] AudioContext not initialized - call start() first');
      return;
    }

    // 1. Decode Base64
    const binaryString = atob(base64Data);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    
    // 2. Convert to Int16
    const int16 = new Int16Array(bytes.buffer);
    
    // 3. Convert to Float32 (-1.0 to 1.0)
    const float32 = new Float32Array(int16.length);
    for (let i = 0; i < int16.length; i++) {
      float32[i] = int16[i] / 32768.0;
    }

    // 4. RESAMPLING (Crucial for iOS)
    // Gemini sends 24k, iOS hardware runs at 44.1k or 48k. 
    // If we don't resample, it sounds like slow-motion or chipmunk.
    const resampled = this.resampleToNative(float32);
    
    // 5. Push to queue
    this.audioQueue.push(resampled);
    
    console.log('[AudioStreamPlayer] Added chunk to queue, queue size:', this.audioQueue.length, 'samples:', resampled.length);
  }

  /**
   * Resample from source rate (24kHz) to the AudioContext's native rate (44.1k/48k)
   */
  private resampleToNative(inputChunk: Float32Array): Float32Array {
    if (!this.audioContext) return inputChunk;
    
    const targetRate = this.audioContext.sampleRate; // e.g. 48000
    
    if (targetRate === this.sourceRate) return inputChunk;

    const ratio = this.sourceRate / targetRate;
    const newLength = Math.round(inputChunk.length / ratio);
    const result = new Float32Array(newLength);

    for (let i = 0; i < newLength; i++) {
      const originalIndex = i * ratio;
      const index1 = Math.floor(originalIndex);
      const index2 = Math.min(index1 + 1, inputChunk.length - 1);
      const weight = originalIndex - index1;
      // Linear Interpolation
      result[i] = inputChunk[index1] * (1 - weight) + inputChunk[index2] * weight;
    }
    
    return result;
  }

  /**
   * Stop the audio player and clean up resources
   */
  stop(): void {
    if (this.scriptNode) {
      this.scriptNode.disconnect();
      this.scriptNode = null;
    }
    
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
    
    this.audioQueue = [];
    this.isPlaying = false;
    
    console.log('[AudioStreamPlayer] Stopped and cleaned up');
  }

  /**
   * Check if the player is currently active
   */
  getIsPlaying(): boolean {
    return this.isPlaying;
  }

  /**
   * Get the current AudioContext state (for debugging)
   */
  getState(): string {
    return this.audioContext?.state || 'not initialized';
  }
}


