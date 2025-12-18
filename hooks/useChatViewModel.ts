import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ChatMessage, Role, Attachment, LiveConnectionState, AgentAction, TableData, Template, JournalEntry } from '../types';
import { chatRepository } from '../services/chatRepository';
import { useAuth } from './useAuth';
import { authService } from '../services/authService';

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
  },
  {
    id: 'field-inspection',
    name: 'Safety Site Inspection',
    category: 'Safety',
    version: 'v1.2.0',
    syncDestination: 'Procore / ERP',
    requiredFields: [
      { label: 'Location / Zone', completed: false },
      { label: 'Hazard Type', completed: false },
      { label: 'Severity Level', completed: false },
      { label: 'Corrective Action', completed: false },
    ]
  },
  {
    id: 'patient-intake',
    name: 'Medical Intake Form',
    category: 'Medicine',
    version: 'v5.1.0',
    syncDestination: 'Epic / FHIR',
    requiredFields: [
      { label: 'Patient Name', completed: false },
      { label: 'Primary Symptom', completed: false },
      { label: 'Medications', completed: false },
      { label: 'Allergies', completed: false },
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
        case 'field-inspection': 
            return "Safety Site Inspection\nDocument the location and hazards\nIdentify severity levels\nRecord corrective action items";
        case 'patient-intake': 
            return "Medical Intake Assistant\nGather patient name and symptoms\nCheck current medications\nVerify any known allergies";
        case 'meeting-master': 
            return "Executive Meeting Recorder\nCapture agenda topics\nRecord key decisions\nTrack action items and owners";
        case 'food-log': 
            return "Daily Nutrition Log\nLog your meals for the day\nList food items simply\nNo calorie counting needed";
        default: 
            return "Voice to Data Assistant\nStart a live conversation\nSpeak naturally to gather data\nGenerate structured tables";
    }
};

export function useChatViewModel() {
  // Get authenticated user info
  const { user, sessionId: userSessionId, isSignedIn, isLoaded } = useAuth();
  
  // Don't run queries until user is loaded and signed in
  const shouldFetchData = isLoaded && isSignedIn && user && userSessionId;
  
  // Convex Real-time State - only fetch when authenticated
  // Backend now uses ctx.auth.getUserIdentity() for userId
  const convexMessages = useQuery(
    api.messages.list, 
    shouldFetchData ? { sessionId: userSessionId! } : "skip"
  ) || [];
  
  const activeTable = useQuery(
    api.tables.getBySession, 
    shouldFetchData ? { sessionId: userSessionId! } : "skip"
  );
  
  const sendMessageMutation = useMutation(api.messages.send);
  const clearMutation = useMutation(api.messages.clear);
  const upsertTableMutation = useMutation(api.tables.upsert);
  const createSessionMutation = useMutation(api.sessions.createSession);

  const [liveState, setLiveState] = useState<LiveConnectionState>(LiveConnectionState.DISCONNECTED);
  const [error, setError] = useState<string | null>(null);
  
  // UI/Enterprise State
  const [activeTemplate, setActiveTemplate] = useState<Template>(TEMPLATES[0]);
  const [history] = useState<JournalEntry[]>(MOCK_HISTORY);
  const [requirements, setRequirements] = useState(TEMPLATES[0].requiredFields);
  
  // Track the most recent table message ID for the workspace view
  const [activeTableId, setActiveTableId] = useState<string | null>(null);

  // Sync activeTableId when messages change
  useEffect(() => {
    if (convexMessages.length > 0) {
      const lastTableMsg = [...convexMessages].reverse().find(m => m.actionData);
      if (lastTableMsg) setActiveTableId(lastTableMsg._id);
    }
  }, [convexMessages]);

  // Simulate requirements checking
  useEffect(() => {
     if (convexMessages.length > 0) {
        const fullText = convexMessages.map(m => m.content).join(' ').toLowerCase();
        setRequirements(prev => prev.map(req => {
            const keywords = req.label.toLowerCase().split(' ');
            const isMet = keywords.some(k => fullText.includes(k)) || (activeTable?.rows.length ?? 0) > 0;
            return { ...req, completed: isMet };
        }));
     }
  }, [convexMessages, activeTable, activeTemplate]);

  // Create/update session when user signs in or template changes
  useEffect(() => {
    if (shouldFetchData && userSessionId) {
      createSessionMutation({
        sessionId: userSessionId,
        platform: authService.getPlatform(),
        templateId: activeTemplate.id,
      }).catch(err => console.error('[useChatViewModel] Failed to create session:', err));
    }
  }, [shouldFetchData, userSessionId, activeTemplate.id, createSessionMutation]);

  const changeTemplate = useCallback(async (templateId: string) => {
      const t = TEMPLATES.find(t => t.id === templateId);
      if (t) {
          if (liveState === LiveConnectionState.CONNECTED || liveState === LiveConnectionState.CONNECTING) {
              await chatRepository.stopLiveSession();
              setLiveState(LiveConnectionState.DISCONNECTED);
          }
          setActiveTemplate(t);
          setRequirements(t.requiredFields);
          
          // Update session with new template
          if (shouldFetchData && userSessionId) {
            await createSessionMutation({
              sessionId: userSessionId,
              platform: authService.getPlatform(),
              templateId: t.id,
            });
          }
      }
  }, [liveState, shouldFetchData, userSessionId, createSessionMutation]);

  const clearConversation = useCallback(async () => {
    if (!shouldFetchData || !userSessionId) return;
    
    await chatRepository.stopLiveSession();
    await clearMutation({ sessionId: userSessionId });
    
    // Initial Greeting
    await sendMessageMutation({
        sessionId: userSessionId,
        role: Role.ASSISTANT,
        content: getGreeting(activeTemplate.id)
    });
    
    setLiveState(LiveConnectionState.DISCONNECTED);
    setRequirements(activeTemplate.requiredFields.map(r => ({ ...r, completed: false })));
    setActiveTableId(null);
  }, [activeTemplate, userSessionId, shouldFetchData, clearMutation, sendMessageMutation]);

  const updateMessageData = useCallback(async (id: string, newData: TableData) => {
    if (!shouldFetchData || !userSessionId) return;
    
    // Update the table mutation which syncs the session's active table
    await upsertTableMutation({
        sessionId: userSessionId,
        ...newData
    });
  }, [userSessionId, shouldFetchData, upsertTableMutation]);

  const toggleLiveSession = useCallback(async () => {
    if (!shouldFetchData || !userSessionId) {
      setError('Please sign in to use live voice features');
      return;
    }
    
    if (liveState === LiveConnectionState.CONNECTED || liveState === LiveConnectionState.CONNECTING) {
      await chatRepository.stopLiveSession();
      setLiveState(LiveConnectionState.DISCONNECTED);
      return;
    }

    setError(null);
    try {
      await chatRepository.startLiveSession(
        activeTemplate,
        (state) => setLiveState(state),
        async (text, action, actionData) => {
          // Push to Convex - This will trigger real-time UI update for all clients
          await sendMessageMutation({
            sessionId: userSessionId,
            role: Role.ASSISTANT,
            content: text || (action ? "Updating table..." : "Listening..."),
            action: action ? { type: action.type, args: action.args } : undefined,
            actionData: actionData
          });
        },
        (err) => setError(err)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [liveState, activeTemplate, userSessionId, shouldFetchData, sendMessageMutation]);

  const sendMessage = useCallback(async (text: string) => {
      if (!shouldFetchData || !userSessionId) return;
      
      await sendMessageMutation({
          sessionId: userSessionId,
          role: Role.USER,
          content: text
      });
  }, [userSessionId, shouldFetchData, sendMessageMutation]);

  const transcribeAudio = useCallback(async (blob: Blob) => "", []);

  // Map Convex messages to ChatMessage type
  const mappedMessages: ChatMessage[] = convexMessages.map(msg => ({
    id: msg._id,
    role: msg.role as Role,
    content: msg.content,
    timestamp: msg.timestamp,
    attachments: [] as Attachment[],
    action: msg.action as AgentAction | undefined,
    actionData: msg.actionData,
  }));

  return {
    messages: mappedMessages,
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
    activeTableData: activeTable,
    activeTableId,
    setActiveTableId,
    getAudioDebugInfo: () => ({
      sent: chatRepository.debugAudioChunksSent,
      received: chatRepository.debugAudioChunksReceived
    })
  };
}