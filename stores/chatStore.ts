// stores/chatStore.ts - FIXED VERSION - Mock mode until backend is ready
import { create } from 'zustand';
import { devtools } from 'zustand/middleware';

// API Configuration
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'https://adventureone-production.up.railway.app';

// 🔧 TOGGLE: Set to true when you implement real backend endpoints
const USE_REAL_API = true;

interface User {
  $id: string;
  email: string;
  name: string;
}

export interface Message {
  id: string;
  content: string;
  role: 'user' | 'assistant';
  timestamp: Date;
  status: 'sending' | 'sent' | 'error';
  files?: UploadedFile[];
  metadata?: {
    model?: string;
    tokens?: number;
    processingTime?: number;
  };
}

interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url?: string;
  preview?: string;
  analysisResult?: any;
}

interface Subscription {
  plan: 'free' | 'pro' | 'pro_plus';
  usage: {
    messagesThisMonth: number;
    filesUploadedThisMonth: number;
    maxMessages: number;
    maxFiles: number;
  };
}

interface ChatState {
  // Core state
  user: User | null;
  messages: Message[];
  isLoading: boolean;
  connectionStatus: 'disconnected' | 'connecting' | 'connected' | 'error';
  error: string | null;
  
  // File upload state
  uploadingFiles: boolean;
  uploadProgress: Record<string, number>;
  
  // Subscription state
  subscription: Subscription | null;
  
  // Chat features
  conversationId: string | null;
  lastMessageTime: Date | null;
  
  // Actions
  setUser: (user: User | null) => void;
  initializeChat: () => Promise<void>;
  sendMessage: (content: string, files?: File[]) => Promise<void>;
  uploadFiles: (files: File[]) => Promise<UploadedFile[]>;
  clearMessages: () => void;
  retryMessage: (messageId: string) => Promise<void>;
  deleteMessage: (messageId: string) => void;
  exportConversation: () => void;
  searchMessages: (query: string) => Message[];
  loadChatHistory: () => Promise<void>;
  updateSubscriptionInfo: () => Promise<void>;
}

// Mock AI response function
const getMockAIResponse = (userMessage: string, files: UploadedFile[] = []): string => {
  const responses = [
    `Thanks for your message: "${userMessage}". I'm a mock AI assistant helping you test the AdventureOne chat interface!`,
    "I can see you're testing the chat functionality. Everything looks great! When you implement the real AI endpoint, I'll be replaced with actual AI responses.",
    "This is a mock response to help you test the chat interface. The file upload, subscription features, and UI are all working perfectly!",
    "Hello! I'm responding with mock data while you develop the backend. Your message was received and processed successfully.",
    "Great job on implementing Phase 2! The chat interface looks professional and all the features are working as expected."
  ];
  
  if (files.length > 0) {
    return `I can see you've uploaded ${files.length} file(s): ${files.map(f => f.name).join(', ')}. In a real implementation, I would analyze these files and provide insights. For now, this is a mock response showing that the file upload system is working correctly!`;
  }
  
  return responses[Math.floor(Math.random() * responses.length)];
};

export const useChatStore = create<ChatState>()(
  devtools(
    (set, get) => ({
      // Initial state
      user: null,
      messages: [],
      isLoading: false,
      connectionStatus: 'disconnected',
      error: null,
      uploadingFiles: false,
      uploadProgress: {},
      subscription: null,
      conversationId: null,
      lastMessageTime: null,

      // Set user
      setUser: (user) => {
        console.log('💤 Setting user in chat store:', user?.email);
        set({ user }, false, 'setUser');
      },

      // Initialize chat connection
      initializeChat: async () => {
        const { user } = get();
        if (!user) {
          console.warn('⚠️ Cannot initialize chat without user');
          return;
        }

        console.log('🔄 Initializing chat for user:', user.email);
        set({ connectionStatus: 'connecting', error: null }, false, 'initializeChat');

        try {
          // Test backend health check only
          const response = await fetch(`${API_BASE_URL}/health`, {
            method: 'GET'
          });

          if (!response.ok) {
            throw new Error(`Backend health check failed: ${response.status}`);
          }

          const healthData = await response.json();
          console.log('✅ Backend health check passed:', healthData);

          // Initialize mock subscription
          set({
            subscription: {
              plan: 'free',
              usage: {
                messagesThisMonth: 3,
                filesUploadedThisMonth: 1,
                maxMessages: 50,
                maxFiles: 5
              }
            }
          }, false, 'initializeChat_subscription');

          // Add welcome message
          const welcomeMessage: Message = {
            id: 'welcome-msg',
            content: '👋 Welcome to AdventureOne AI Assistant! I\'m currently running in demo mode while you develop the backend. Try uploading files, sending messages, and testing the subscription features!',
            role: 'assistant',
            timestamp: new Date(),
            status: 'sent',
            metadata: {
              model: 'mock-ai-v1',
              tokens: 50,
              processingTime: 100
            }
          };

          set({ 
            connectionStatus: 'connected',
            error: null,
            messages: [welcomeMessage],
            conversationId: `demo-conv-${Date.now()}`
          }, false, 'initializeChat_success');

          console.log('✅ Chat initialized successfully (Mock Mode)');

        } catch (error: any) {
          console.error('❌ Chat initialization failed:', error);
          set({ 
            connectionStatus: 'error',
            error: 'Backend connection failed. Using demo mode.'
          }, false, 'initializeChat_error');
          
          // Still allow demo mode even if backend fails
          set({
            subscription: {
              plan: 'free',
              usage: {
                messagesThisMonth: 0,
                filesUploadedThisMonth: 0,
                maxMessages: 50,
                maxFiles: 5
              }
            },
            connectionStatus: 'connected'
          }, false, 'initializeChat_demo_fallback');
        }
      },

      // Send message with optional file attachments
      sendMessage: async (content: string, files?: File[]) => {
        const { user, subscription, messages } = get();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Check subscription limits
        if (subscription) {
          const { usage } = subscription;
          if (usage.messagesThisMonth >= usage.maxMessages) {
            throw new Error('Monthly message limit reached. Please upgrade your plan.');
          }
        }

        // Create user message
        const userMessage: Message = {
          id: `user-${Date.now()}`,
          content,
          role: 'user',
          timestamp: new Date(),
          status: 'sending',
          files: undefined
        };

        // Add user message immediately
        set({ 
          messages: [...messages, userMessage],
          isLoading: true,
          error: null
        }, false, 'sendMessage_start');

        try {
          let uploadedFiles: UploadedFile[] = [];
          
          // Upload files if provided
          if (files && files.length > 0) {
            console.log('📁 Processing files:', files.map(f => f.name));
            uploadedFiles = await get().uploadFiles(files);
            
            // Update user message with uploaded files
            set(state => ({
              messages: state.messages.map(msg => 
                msg.id === userMessage.id 
                  ? { ...msg, files: uploadedFiles }
                  : msg
              )
            }), false, 'sendMessage_files_uploaded');
          }

          // Mark user message as sent
          set(state => ({
            messages: state.messages.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, status: 'sent' }
                : msg
            )
          }), false, 'sendMessage_user_sent');

          // Generate AI response
          if (USE_REAL_API) {
            // 🚀 REAL API CALL (when you're ready)
            console.log('🚀 Using real AI endpoint...');
            
            const requestPayload = {
              message: content,
              userId: user.$id,
              conversationId: get().conversationId,
              files: uploadedFiles.map(f => ({
                id: f.id,
                name: f.name,
                type: f.type,
                url: f.url
              })),
              metadata: {
                timestamp: new Date().toISOString(),
                userPlan: subscription?.plan || 'free'
              }
            };

            const response = await fetch(`${API_BASE_URL}/chat`, {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${user.$id}`
              },
              body: JSON.stringify(requestPayload)
            });

            if (!response.ok) {
              throw new Error(`AI request failed: ${response.status}`);
            }

            const aiResponse = await response.json();
            
            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              content: aiResponse.response || aiResponse.message || 'Sorry, I couldn\'t generate a response.',
              role: 'assistant',
              timestamp: new Date(),
              status: 'sent',
              metadata: {
                model: aiResponse.model,
                tokens: aiResponse.tokens,
                processingTime: aiResponse.processingTime
              }
            };

            set(state => ({
              messages: [...state.messages, aiMessage],
              isLoading: false,
              conversationId: aiResponse.conversationId || state.conversationId,
              lastMessageTime: new Date()
            }), false, 'sendMessage_ai_response');

          } else {
            // 🎭 MOCK AI RESPONSE (current mode)
            console.log('🎭 Using mock AI response...');
            
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 800 + Math.random() * 1500));
            
            const aiResponse = getMockAIResponse(content, uploadedFiles);

            const aiMessage: Message = {
              id: `ai-${Date.now()}`,
              content: aiResponse,
              role: 'assistant',
              timestamp: new Date(),
              status: 'sent',
              metadata: {
                model: 'mock-ai-v1',
                tokens: Math.floor(Math.random() * 150) + 50,
                processingTime: Math.floor(Math.random() * 1500) + 500
              }
            };

            set(state => ({
              messages: [...state.messages, aiMessage],
              isLoading: false,
              lastMessageTime: new Date()
            }), false, 'sendMessage_ai_response');
          }

          // Update usage tracking
          if (subscription) {
            set(state => ({
              subscription: state.subscription ? {
                ...state.subscription,
                usage: {
                  ...state.subscription.usage,
                  messagesThisMonth: state.subscription.usage.messagesThisMonth + 1
                }
              } : null
            }), false, 'sendMessage_usage_tracked');
          }

          console.log('✅ Message sent successfully');

        } catch (error: any) {
          console.error('❌ Failed to send message:', error);

          // Mark user message as error
          set(state => ({
            messages: state.messages.map(msg => 
              msg.id === userMessage.id 
                ? { ...msg, status: 'error' }
                : msg
            ),
            isLoading: false,
            error: `Failed to send message: ${error.message}`
          }), false, 'sendMessage_error');

          throw error;
        }
      },

      // Upload files (mock implementation)
      uploadFiles: async (files: File[]): Promise<UploadedFile[]> => {
        const { user, subscription } = get();
        
        if (!user) {
          throw new Error('User not authenticated');
        }

        // Check file limits
        if (subscription) {
          const { usage } = subscription;
          if (usage.filesUploadedThisMonth + files.length > usage.maxFiles) {
            throw new Error('Monthly file upload limit reached. Please upgrade your plan.');
          }
        }

        set({ uploadingFiles: true, uploadProgress: {} }, false, 'uploadFiles_start');

        try {
          const uploadedFiles: UploadedFile[] = [];

          for (let i = 0; i < files.length; i++) {
            const file = files[i];
            
            console.log(`📤 Processing file ${i + 1}/${files.length}:`, file.name);

            // Simulate upload progress
            for (let progress = 0; progress <= 100; progress += 20) {
              await new Promise(resolve => setTimeout(resolve, 150));
              set(state => ({
                uploadProgress: {
                  ...state.uploadProgress,
                  [file.name]: progress
                }
              }), false, 'uploadFiles_progress');
            }

            // Create file preview for images
            let preview: string | undefined;
            if (file.type.startsWith('image/')) {
              preview = URL.createObjectURL(file);
            }

            uploadedFiles.push({
              id: `file-${Date.now()}-${i}`,
              name: file.name,
              size: file.size,
              type: file.type,
              url: preview || `#mock-url-${file.name}`,
              preview,
              analysisResult: {
                summary: `Mock analysis: This ${file.type} file appears to contain ${file.name}. In a real implementation, this would be processed by the AI for insights.`
              }
            });

            console.log(`✅ File processed:`, file.name);
          }

          // Update file usage
          if (subscription) {
            set(state => ({
              subscription: state.subscription ? {
                ...state.subscription,
                usage: {
                  ...state.subscription.usage,
                  filesUploadedThisMonth: state.subscription.usage.filesUploadedThisMonth + files.length
                }
              } : null
            }), false, 'uploadFiles_usage_tracked');
          }

          set({ 
            uploadingFiles: false, 
            uploadProgress: {} 
          }, false, 'uploadFiles_complete');

          return uploadedFiles;

        } catch (error: any) {
          console.error('❌ File upload failed:', error);
          set({ 
            uploadingFiles: false, 
            uploadProgress: {},
            error: error.message || 'Failed to upload files'
          }, false, 'uploadFiles_error');
          throw error;
        }
      },

      // Clear all messages
      clearMessages: () => {
        console.log('🗑️ Clearing all messages');
        set({ 
          messages: [],
          conversationId: null,
          lastMessageTime: null,
          error: null
        }, false, 'clearMessages');
      },

      // Retry failed message
      retryMessage: async (messageId: string) => {
        const { messages } = get();
        const message = messages.find(m => m.id === messageId);
        
        if (!message || message.role !== 'user') {
          throw new Error('Invalid message to retry');
        }

        console.log('🔄 Retrying message:', messageId);
        
        // Remove the failed message and its AI response if any
        set(state => ({
          messages: state.messages.filter(m => 
            m.id !== messageId && 
            !(m.role === 'assistant' && m.timestamp > message.timestamp)
          )
        }), false, 'retryMessage_cleanup');

        // Resend the message
        await get().sendMessage(message.content, undefined);
      },

      // Delete message
      deleteMessage: (messageId: string) => {
        console.log('🗑️ Deleting message:', messageId);
        set(state => ({
          messages: state.messages.filter(m => m.id !== messageId)
        }), false, 'deleteMessage');
      },

      // Export conversation
      exportConversation: () => {
        const { messages, user } = get();
        
        const exportData = {
          user: user?.email,
          exportedAt: new Date().toISOString(),
          messageCount: messages.length,
          messages: messages.map(m => ({
            role: m.role,
            content: m.content,
            timestamp: m.timestamp.toISOString(),
            files: m.files?.map(f => ({ name: f.name, type: f.type }))
          }))
        };

        const dataStr = JSON.stringify(exportData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `adventureone-chat-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
        console.log('📤 Conversation exported');
      },

      // Search messages
      searchMessages: (query: string): Message[] => {
        const { messages } = get();
        
        if (!query.trim()) return [];
        
        const searchTerm = query.toLowerCase();
        return messages.filter(message => 
          message.content.toLowerCase().includes(searchTerm) ||
          message.files?.some(file => 
            file.name.toLowerCase().includes(searchTerm)
          )
        );
      },

      // Load chat history (mock)
      loadChatHistory: async () => {
        console.log('📚 Loading chat history (mock mode)...');
        // History is handled by initializeChat in mock mode
      },

      // Update subscription information (mock)
      updateSubscriptionInfo: async () => {
        console.log('💳 Updating subscription info (mock mode)...');
        // Subscription is handled by initializeChat in mock mode
      }
    }),
    {
      name: 'chat-store',
      enabled: process.env.NODE_ENV === 'development'
    }
  )
);