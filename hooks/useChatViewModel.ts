import { useState, useEffect, useCallback } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ChatMessage, Role, Attachment, LiveConnectionState, AgentAction, TableData, Template, JournalEntry } from '../types';
import { chatRepository } from '../services/chatRepository';
import { useAuth } from './useAuth';
import { authService } from '../services/authService';

// Premium Templates for the Voice Survey Track
const TEMPLATES: Template[] = [
  {
    id: 'voice-demo',
    name: 'Voice Interaction Demo',
    category: 'Onboarding',
    version: 'v1.0.0',
    syncDestination: 'Global Master Index',
    requiredFields: [
      { label: 'Prior Experience', completed: false },
      { label: 'Country of Origin', completed: false },
      { label: 'Languages Spoken', completed: false },
    ]
  },
  {
    id: 'strategy-brief',
    name: 'Executive Strategy Brief',
    category: 'Leadership',
    version: 'v2.1',
    syncDestination: 'Board Portal',
    requiredFields: [
      { label: 'Strategic Pillar', completed: false },
      { label: 'Risk Assessment', completed: false },
      { label: 'Resource Allocation', completed: false },
      { label: 'Impact Timeline', completed: false },
    ]
  },
  {
    id: 'logistics-audit',
    name: 'Global Logistics Audit',
    category: 'Operations',
    version: 'v4.2.0',
    syncDestination: 'ERP Systems',
    requiredFields: [
      { label: 'Supply Chain Node', completed: false },
      { label: 'Inventory Throughput', completed: false },
      { label: 'Latency Bottlenecks', completed: false },
    ]
  },
  {
    id: 'safety-report',
    name: 'Operational Safety Report',
    category: 'Compliance',
    version: 'v1.2.0',
    syncDestination: 'Compliance Vault',
    requiredFields: [
      { label: 'Incident Protocol', completed: false },
      { label: 'Mitigation Status', completed: false },
      { label: 'Safety Index Score', completed: false },
    ]
  },
  {
    id: 'clinical-intake',
    name: 'Clinical Intake Summary',
    category: 'Medical',
    version: 'v5.1.0',
    syncDestination: 'Health Nexus',
    requiredFields: [
      { label: 'Vitals Triage', completed: false },
      { label: 'Symptom Topology', completed: false },
      { label: 'Medical Heritage', completed: false },
      { label: 'Prescription Sync', completed: false },
    ]
  }
];

// Population Indexing Logic
const calculatePopulation = () => {
    // Baseline: Dec 1, 2025 estimate ~8.245 Billion
    const p0 = 8245000000;
    const startOfDec = new Date('2025-12-01T00:00:00Z').getTime();
    const now = Date.now();
    
    // Approx growth: 2.31 people per second
    const elapsedSeconds = (now - startOfDec) / 1000;
    const currentPop = Math.floor(p0 + (elapsedSeconds * 2.31));
    
    return currentPop.toLocaleString();
};

// Mock History - Refined for Executive Archive Vision
const MOCK_HISTORY: JournalEntry[] = [
  { id: 'h1', date: 'Today', title: 'Global Logistics Audit', status: 'Pending', preview: 'High-Latency Node: Singapore Port. Throughput: 42k TEU.' },
  { id: 'h2', date: 'Today', title: 'Executive Strategy Brief', status: 'Synced', preview: 'Stellar Risk Mitigation. Resource allocation confirmed for Q1.' },
  { id: 'h3', date: 'Yesterday', title: 'Clinical Intake Summary', status: 'Synced', preview: 'Patient: Anonymous. Vitals stable. Symptom Topology mapped.' },
  { id: 'h4', date: 'Yesterday', title: 'Operational Safety Report', status: 'Synced', preview: 'Site B Inspection Complete. Safety Index: 0.94.' },
  { id: 'h5', date: 'Yesterday', title: 'Global Logistics Audit', status: 'Synced', preview: 'Supply Chain Sync: 4 Nodes verified.' },
];

const getGreeting = (templateId: string) => {
    switch(templateId) {
        case 'voice-demo': 
            return "Voice Interaction Demo\nLet's verify your conversational profile\nPlease share your prior experience with voice AI\nSpecify your country of origin and languages spoken";
        case 'strategy-brief': 
            return "Executive Strategy Brief\nDefine primary strategic pillars\nAssess operational risks\nOutline resource allocation and impact timelines";
        case 'logistics-audit': 
            return "Global Logistics Audit\nIdentify critical supply chain nodes\nAudit inventory throughput\nPinpoint latency bottlenecks";
        case 'safety-report': 
            return "Operational Safety Report\nReview active incident protocols\nStatus of mitigation efforts\nCalculate Safety Index scores";
        case 'clinical-intake': 
            return "Clinical Intake Summary\nTriage primary vitals\nMap symptom topology\nRecord inherited medical heritage";
        default: 
            return "Executive Intelligence Assistant\nStart a secure live conversation\nSpeak naturally to gather intelligence\nGenerate structured data repositories";
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
  
  const masterCount = useQuery(api.tables.getMasterCount) || 0;
  
  const sendMessageMutation = useMutation(api.messages.send);
  const clearMutation = useMutation(api.messages.clear);
  const upsertTableMutation = useMutation(api.tables.upsert);
  const createSessionMutation = useMutation(api.sessions.createSession);
  const addToMasterMutation = useMutation(api.tables.addToMaster);

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
        (err) => setError(err),
        { masterCount }
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

  const submitToMaster = useCallback(async (data: { priorExperience: string, country: string, languages: string }) => {
    const population = calculatePopulation();
    const index = `${masterCount + 1} of ${population}`;
    
    await addToMasterMutation({
        ...data,
        populationIndex: index
    });
  }, [masterCount, addToMasterMutation]);

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
    submitToMaster,
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