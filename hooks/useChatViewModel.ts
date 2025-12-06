import { useState, useEffect, useCallback } from 'react';
import { ChatMessage, Role, Attachment } from '../types';
import { chatRepository } from '../services/chatRepository';

// Mirrors ChatViewModel.kt
export function useChatViewModel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    const load = async () => {
      try {
        const history = await chatRepository.loadHistory();
        setMessages(history);
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    load();
  }, []);

  // Persist history when messages change
  useEffect(() => {
    if (messages.length > 0) {
      chatRepository.saveHistory(messages);
    }
  }, [messages]);

  const clearConversation = useCallback(async () => {
    await chatRepository.clearHistory();
    const history = await chatRepository.loadHistory(); // Reset to welcome
    setMessages(history);
  }, []);

  const transcribeAudio = useCallback(async (audioBlob: Blob): Promise<string> => {
    try {
      const reader = new FileReader();
      return new Promise((resolve, reject) => {
        reader.onloadend = async () => {
          const base64data = (reader.result as string).split(',')[1];
          try {
            const text = await chatRepository.transcribeAudio(base64data);
            resolve(text);
          } catch (e) {
            reject(e);
          }
        };
        reader.onerror = reject;
        reader.readAsDataURL(audioBlob);
      });
    } catch (e) {
      setError("Failed to transcribe audio.");
      return "";
    }
  }, []);

  const sendMessage = useCallback(async (text: string, attachments: Attachment[] = [], isEditMode: boolean = false) => {
    if (!text.trim() && attachments.length === 0) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: Role.USER,
      content: text,
      timestamp: Date.now(),
      attachments: attachments
    };

    // Optimistic update
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);
    setError(null);

    try {
      const response = await chatRepository.sendMessage(text, messages, attachments, isEditMode);

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: Role.ASSISTANT,
        content: response.reply,
        timestamp: Date.now(),
        action: response.action,
        actionData: response.actionData,
        attachments: response.generatedAttachments
      };

      setMessages(prev => [...prev, aiMsg]);
    } catch (err: any) {
      setError(err.message || "Something went wrong");
    } finally {
      setIsLoading(false);
    }
  }, [messages]);

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    transcribeAudio,
    clearConversation
  };
}