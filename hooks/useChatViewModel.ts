import { useState, useEffect, useCallback, useMemo } from 'react';
import { useQuery, useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import { ChatMessage, Role, Attachment, LiveConnectionState, AgentAction, TableData, Template, JournalEntry } from '../types';
import { chatRepository } from '../services/chatRepository';
import { useAuth } from './useAuth';
import { authService } from '../services/authService';

// Santa Factory Templates
const TEMPLATES: Template[] = [
  {
    id: 'contact-book',
    name: 'Naughty & Nice List',
    category: 'Contacts',
    version: '2025.12',
    syncDestination: 'The Big Book',
    requiredFields: [
      { label: 'Name', completed: false },
      { label: 'Address', completed: false },
      { label: 'Behavior Status', completed: false },
      { label: 'Gift Idea', completed: false },
    ]
  },
  {
    id: 'inventory-manager',
    name: 'Workshop Inventory',
    category: 'Logistics',
    version: 'v4.0',
    syncDestination: 'Warehouse A',
    requiredFields: [
      { label: 'Item Name', completed: false },
      { label: 'Stock Count', completed: false },
      { label: 'Material Cost', completed: false },
      { label: 'Supplier', completed: false },
    ]
  },
  {
    id: 'budget-planner',
    name: 'Toy Budget',
    category: 'Finance',
    version: 'FY25',
    syncDestination: 'Treasury Vault',
    requiredFields: [
      { label: 'Category', completed: false },
      { label: 'Allocated Amount', completed: false },
      { label: 'Current Spend', completed: false },
      { label: 'Variance', completed: false },
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

// Mock History - Santa Factory Archive
const MOCK_HISTORY: JournalEntry[] = [
  { id: 'h1', date: 'Today', title: 'Workshop Inventory', status: 'Pending', preview: 'Low stock alert: Wooden Wheels. Current: 50. Required: 500.' },
  { id: 'h2', date: 'Today', title: 'Naughty & Nice List', status: 'Synced', preview: 'Added: Little Timmy. Status: Nice. Gift: Bicycle.' },
  { id: 'h3', date: 'Yesterday', title: 'Toy Budget', status: 'Synced', preview: 'Raw Materials overspend. Reallocating from R&D.' },
  { id: 'h4', date: 'Yesterday', title: 'Naughty & Nice List', status: 'Synced', preview: 'Updated: Sarah Jones. Moved to Nice list.' },
];

const getGreeting = (templateId: string) => {
    switch(templateId) {
        case 'contact-book': 
            return "Ho ho ho! Who should we add to the list today? Tell me their name and how they've been behaving.";
        case 'inventory-manager': 
            return "Greetings, Foreman. Let's do a stock check. What items are we counting in the workshop?";
        case 'budget-planner': 
            return "Ah, the numbers. Let's review our gold reserves. What expenses do we need to track?";
        default:
            return "Merry Christmas! I'm ready to help run the factory. What are we working on?";
    }
}; 

export function useChatViewModel() {
  // Get authenticated user info
  const { user, sessionId: userSessionId, isSignedIn, isLoaded } = useAuth();
  
  // Don't run queries until user is loaded and signed in
  const shouldFetchData = isLoaded && isSignedIn && user && userSessionId;
  
  // Convex Real-time State - only fetch when authenticated
  const convexMessages = useQuery(
    api.messages.list, 
    shouldFetchData ? { sessionId: userSessionId! } : "skip"
  ) || [];
  
  // Santa Factory Data Sync
  const inventoryData = useQuery(api.factory.getInventory) || [];
  const contactsData = useQuery(api.factory.getContacts) || [];
  const budgetData = useQuery(api.factory.getBudget) || [];
  
  // Session Table (Fallback)
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
  
  // Santa Factory Mutations
  const updateInventoryMutation = useMutation(api.factory.updateInventory);
  const addContactMutation = useMutation(api.factory.addContact);

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
  
  // Transform Persistent Data to Generic Table Format for UI
  const persistentTableData: TableData | undefined = useMemo(() => {
      if (activeTemplate.id === 'inventory-manager') {
          return {
              title: 'Workshop Inventory',
              columns: ['Item', 'Quantity', 'Cost', 'Supplier'],
              rows: inventoryData.map(i => ({
                  id: i._id,
                  'Item': i.item,
                  'Quantity': i.qtyOnHand ?? 0,
                  'Cost': `$${i.unitCost ?? 0}`,
                  'Supplier': i.supplier ?? 'Unknown'
              }))
          };
      } else if (activeTemplate.id === 'contact-book') {
          return {
              title: 'Naughty & Nice List',
              columns: ['Name', 'Address', 'Status', 'Notes'],
              rows: contactsData.map(c => ({
                  id: c._id,
                  'Name': c.householdName || 'Unknown',
                  'Address': c.addressLine1 || 'Unknown',
                  'Status': c.relationshipTier || 'Pending', // Mapped to status
                  'Notes': c.notes || ''
              }))
          };
      } else if (activeTemplate.id === 'budget-planner') {
           return {
               title: 'Toy Budget',
               columns: ['Category', 'Allocated', 'Spent'],
               rows: budgetData.map(b => ({
                   id: b._id,
                   'Category': b.item,
                   'Allocated': `$${b.value}`,
                   'Spent': '$0' // Placeholder
               }))
           };
      }
      return undefined;
  }, [activeTemplate.id, inventoryData, contactsData, budgetData]);

  // Use persistent data if available, otherwise session data
  const finalActiveTableData = persistentTableData || activeTable;

  // Simulate requirements checking
  useEffect(() => {
     if (convexMessages.length > 0) {
        const fullText = convexMessages.map(m => m.content).join(' ').toLowerCase();
        setRequirements(prev => prev.map(req => {
            const keywords = req.label.toLowerCase().split(' ');
            const isMet = keywords.some(k => fullText.includes(k)) || (finalActiveTableData?.rows.length ?? 0) > 0;
            return { ...req, completed: isMet };
        }));
     }
  }, [convexMessages, finalActiveTableData, activeTemplate]);

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
          
          // 1. Send Message to Chat History (Convex)
          await sendMessageMutation({
            sessionId: userSessionId,
            role: Role.ASSISTANT,
            content: text || (action ? "Processing..." : "Listening..."),
            action: action ? { type: action.type, args: action.args } : undefined,
            actionData: actionData
          });

          // 2. Execute Action (Santa Factory Logic)
          if (action) {
             console.log('[useChatViewModel] Executing Action:', action.type, action.args);
             try {
                 if (action.type === 'UPDATE_INVENTORY' && action.args) {
                     await updateInventoryMutation({
                         item: action.args.item,
                         quantity: Number(action.args.quantity),
                         cost: action.args.cost ? Number(action.args.cost) : undefined,
                         supplier: action.args.supplier
                     });
                 } else if (action.type === 'ADD_CONTACT' && action.args) {
                     await addContactMutation({
                         name: action.args.name,
                         status: action.args.status,
                         address: action.args.address,
                         giftIdea: action.args.giftIdea
                     });
                 }
                 // Add Budget logic here
             } catch (actionErr) {
                 console.error('[useChatViewModel] Action Execution Failed:', actionErr);
             }
          }
        },
        (err) => setError(err),
        { masterCount }
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    }
  }, [liveState, activeTemplate, userSessionId, shouldFetchData, sendMessageMutation, updateInventoryMutation, addContactMutation, masterCount]);

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
    activeTableData: finalActiveTableData,
    activeTableId,
    setActiveTableId,
    getAudioDebugInfo: () => ({
      sent: chatRepository.debugAudioChunksSent,
      received: chatRepository.debugAudioChunksReceived
    })
  };
}