import { Template, LiveConnectionState, AgentAction } from '../types';

export interface VoiceProviderCallbacks {
  onStateChange: (state: LiveConnectionState) => void;
  onMessage: (text: string | null, action?: AgentAction, actionData?: any) => void;
  onError: (error: string) => void;
}

export interface IVoiceProvider {
  startSession(
    template: Template,
    callbacks: VoiceProviderCallbacks,
    metadata?: { masterCount?: number }
  ): Promise<void>;

  stopSession(): Promise<void>;
  
  // Debug
  getDebugStats(): { sent: number; received: number };
}
