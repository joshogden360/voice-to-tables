import { useState, useEffect, useCallback, useRef } from 'react';
import { ChatMessage, Role, Attachment, LiveConnectionState, AgentAction, TableData, Template, JournalEntry } from '../types';
import { chatRepository } from '../services/chatRepository';

// Mock Templates
const TEMPLATES: Template[] = [
  {
    id: 'holiday-prep',
    name: 'Holiday Feast Planner',
    category: 'Events',
    version: 'v2024.12',
    syncDestination: 'Notion Family Hub',
    requiredFields: [
      { label: 'Dish Name', completed: false },
      { label: 'Ingredients Status', completed: false },
      { label: 'Assigned Chef', completed: false },
      { label: 'Dietary Notes', completed: false },
    ]
  },
  {
    id: 'meeting-master',
    name: 'Executive Meeting Record',
    category: 'Work',
    version: 'v4.0.0',
    syncDestination: 'Jira / Slack',
    requiredFields: [
      { label: 'Agenda Topic', completed: false },
      { label: 'Key Decisions', completed: false },
      { label: 'Action Items', completed: false },
      { label: 'Owner & Due Date', completed: false },
    ]
  },
  {
    id: 'food-log',
    name: 'Daily Nutrition Tracker',
    category: 'Health',
    version: 'v2.5.0',
    syncDestination: 'MyFitnessPal API',
    requiredFields: [
      { label: 'Meal', completed: false },
      { label: 'Food Items', completed: false },
      { label: 'Portion / Notes', completed: false },
    ]
  }
];

// Mock History - Restored for Visual Context
const MOCK_HISTORY: JournalEntry[] = [
  { id: 'h1', date: 'Today', title: 'Holiday Feast Planner', status: 'Pending', preview: 'Turkey & Stuffing: Needs Shopping' },
  { id: 'h2', date: 'Yesterday', title: 'Executive Meeting Record', status: 'Synced', preview: 'Q4 Strategy: 3 Actions' },
  { id: 'h3', date: 'Oct 24', title: 'Daily Nutrition Tracker', status: 'Synced', preview: 'Breakfast, Lunch & Dinner' },
  { id: 'h4', date: 'Oct 23', title: 'Executive Meeting Record', status: 'Synced', preview: 'Weekly Standup: Complete' },
];

const getGreeting = (templateId: string) => {
    switch(templateId) {
        case 'holiday-prep': 
            return "Holiday Feast Planner\nIdentify dishes you want to serve\nCheck ingredient availability\nAssign chefs and dietary notes";
        case 'meeting-master': 
            return "Executive Meeting Recorder\nCapture agenda topics\nRecord key decisions\nTrack action items and owners";
        case 'food-log': 
            return "Daily Nutrition Log\nLog your meals for the day\nList food items simply\nNo calorie counting needed";
        default: 
            return "Voice to Data Assistant\nStart a live conversation\nSpeak naturally to gather data\nGenerate structured tables";
    }
};

export function useChatViewModel() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [liveState, setLiveState] = useState<LiveConnectionState>(LiveConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  
  // Enterprise State
  const [activeTemplate, setActiveTemplate] = useState<Template>(TEMPLATES[0]);
  const [history] = useState<JournalEntry[]>(MOCK_HISTORY);
  const [requirements, setRequirements] = useState(TEMPLATES[0].requiredFields);
  
  // Track the most recent table for the right side panel
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // Load history on mount
  useEffect(() => {
    const load = async () => {
      try {
        const history = await chatRepository.loadHistory();
        if (history && history.length > 0) {
            setMessages(history);
            // Find last table in history
            const lastTableMsg = [...history].reverse().find(m => m.actionData);
            if (lastTableMsg) setActiveTableId(lastTableMsg.id);
        } else {
            // Initial Greeting if no history
            setMessages([{
                id: 'init-1',
                role: Role.ASSISTANT,
                content: getGreeting(TEMPLATES[0].id),
                timestamp: Date.now()
            }]);
        }
      } catch (e) {
        console.error("Failed to load history", e);
      }
    };
    load();
  }, []);

  // Persist history
  useEffect(() => {
    if (messages.length > 0) {
      chatRepository.saveHistory(messages);
    }
  }, [messages]);

  // Simulate requirements checking based on message content
  useEffect(() => {
     if (messages.length > 0) {
        const fullText = messages.map(m => m.content).join(' ').toLowerCase();
        
        setRequirements(prev => prev.map(req => {
            const keywords = req.label.toLowerCase().split(' ');
            const isMet = keywords.some(k => fullText.includes(k)) || messages.some(m => m.actionData?.rows.length);
            return { ...req, completed: isMet };
        }));
     }
  }, [messages, activeTemplate]);

  const changeTemplate = useCallback(async (templateId: string) => {
      const t = TEMPLATES.find(t => t.id === templateId);
      if (t) {
          // IMPORTANT: If we are live, we must disconnect to allow the next session
          // to pick up the new template context.
          if (liveState === LiveConnectionState.CONNECTED || liveState === LiveConnectionState.CONNECTING) {
              await chatRepository.stopLiveSession();
              setLiveState(LiveConnectionState.DISCONNECTED);
          }

          setActiveTemplate(t);
          setRequirements(t.requiredFields);
          
          // If the conversation is in its initial state (only 1 AI message and no actions), update the greeting
          setMessages(prev => {
              if (prev.length <= 1 && prev[0]?.role === Role.ASSISTANT && !prev[0].actionData) {
                   return [{
                      ...prev[0],
                      content: getGreeting(t.id),
                      timestamp: Date.now()
                   }];
              }
              return prev;
          });
      }
  }, [liveState]);

  const clearConversation = useCallback(async () => {
    await chatRepository.stopLiveSession();
    await chatRepository.clearHistory();
    // Reset to generic greeting based on active template
    setMessages([{
        id: Date.now().toString(),
        role: Role.ASSISTANT,
        content: getGreeting(activeTemplate.id),
        timestamp: Date.now()
    }]);
    setLiveState(LiveConnectionState.DISCONNECTED);
    setRequirements(activeTemplate.requiredFields.map(r => ({ ...r, completed: false })));
    setActiveTableId(null);
  }, [activeTemplate]);

  const updateMessageData = useCallback((id: string, newData: TableData) => {
    setMessages(prev => prev.map(msg => 
      msg.id === id ? { ...msg, actionData: newData } : msg
    ));
  }, []);

  const toggleLiveSession = useCallback(async () => {
    if (liveState === LiveConnectionState.CONNECTED || liveState === LiveConnectionState.CONNECTING) {
      await chatRepository.stopLiveSession();
      setLiveState(LiveConnectionState.DISCONNECTED);
      return;
    }

    setError(null);
    
    // Pass activeTemplate to startLiveSession
    await chatRepository.startLiveSession(
      activeTemplate,
      (state) => setLiveState(state),
      (text, action, actionData) => {
        setMessages(prev => {
          const newMsg: ChatMessage = {
            id: Date.now().toString(),
            role: Role.ASSISTANT,
            content: text || (action ? "Updating table..." : "Listening..."),
            timestamp: Date.now(),
            action: action,
            actionData: actionData
          };
          // If this message has a table, make it active
          if (actionData) {
              setActiveTableId(newMsg.id);
          }
          return [...prev, newMsg];
        });
      },
      (err) => setError(err)
    );
  }, [liveState, activeTemplate]);

  // Legacy text sending
  const sendMessage = useCallback(async (text: string, attachments: Attachment[] = [], isEditMode: boolean = false) => {
  }, []);

  const transcribeAudio = useCallback(async (blob: Blob) => "", []);

  // Derived state: Get active table data
  const activeTableData = activeTableId 
    ? messages.find(m => m.id === activeTableId)?.actionData 
    : null;

  return {
    messages,
    isLoading: liveState === LiveConnectionState.CONNECTING,
    liveState,
    error,
    sendMessage,
    transcribeAudio,
    clearConversation,
    toggleLiveSession,
    updateMessageData,
    activeTemplate,
    templates: TEMPLATES,
    changeTemplate,
    history,
    requirements,
    activeTableData,
    activeTableId,
    setActiveTableId
  };
}