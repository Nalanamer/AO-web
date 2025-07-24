// components/chat/ChatInterface.tsx - SIMPLIFIED VERSION
import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { useChatStore } from '../../stores/chatStore';

// Simple message display component
const SimpleMessageList: React.FC = () => {
  const { messages, isLoading } = useChatStore();

  return (
    <div style={{ 
      flex: 1, 
      overflowY: 'auto', 
      padding: '20px', 
      backgroundColor: '#f9fafb' 
    }}>
      {messages.length === 0 && !isLoading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '40px', 
          color: '#6b7280' 
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>💬</div>
          <h3 style={{ margin: '0 0 8px 0', fontSize: '18px', color: '#374151' }}>
            Start a conversation
          </h3>
          <p style={{ margin: 0, fontSize: '14px' }}>
            Send a message or upload files to test the chat system.
          </p>
        </div>
      ) : (
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          {messages.map((message) => (
            <div 
              key={message.id} 
              style={{ 
                display: 'flex', 
                justifyContent: message.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '20px'
              }}
            >
              <div style={{
                maxWidth: '70%',
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: message.role === 'user' ? '#3b82f6' : '#ffffff',
                color: message.role === 'user' ? '#ffffff' : '#374151',
                border: message.role === 'assistant' ? '1px solid #e5e7eb' : 'none',
                fontSize: '14px',
                lineHeight: '1.5'
              }}>
                <div style={{ whiteSpace: 'pre-wrap' }}>{message.content}</div>
                
                {/* File attachments */}
                {message.files && message.files.length > 0 && (
                  <div style={{ marginTop: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.2)' }}>
                    {message.files.map((file, index) => (
                      <div key={index} style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        gap: '8px',
                        padding: '4px 0' 
                      }}>
                        <span style={{ fontSize: '16px' }}>📎</span>
                        <span style={{ fontSize: '12px', opacity: 0.9 }}>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                
                {/* Timestamp and status */}
                <div style={{ 
                  fontSize: '11px', 
                  opacity: 0.7, 
                  marginTop: '4px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}>
                  <span>{message.timestamp.toLocaleTimeString()}</span>
                  {message.status === 'sending' && <span>Sending...</span>}
                  {message.status === 'error' && <span style={{ color: '#ef4444' }}>Failed</span>}
                </div>
              </div>
            </div>
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div style={{ 
              display: 'flex', 
              justifyContent: 'flex-start',
              marginBottom: '20px'
            }}>
              <div style={{
                padding: '12px 16px',
                borderRadius: '12px',
                backgroundColor: '#ffffff',
                border: '1px solid #e5e7eb',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
              }}>
                <div style={{
                  width: '16px',
                  height: '16px',
                  border: '2px solid #e5e7eb',
                  borderTop: '2px solid #3b82f6',
                  borderRadius: '50%',
                  animation: 'spin 1s linear infinite'
                }}></div>
                <span style={{ fontSize: '14px', color: '#6b7280' }}>AI is thinking...</span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Simple message input component
const SimpleMessageInput: React.FC = () => {
  const [message, setMessage] = useState('');
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const { sendMessage, isLoading, connectionStatus } = useChatStore();
  const { user } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if ((!message.trim() && selectedFiles.length === 0) || isLoading || !user) {
      return;
    }
    
    const messageToSend = message.trim();
    const filesToSend = [...selectedFiles];
    
    setMessage('');
    setSelectedFiles([]);
    
    try {
      await sendMessage(messageToSend || '📎 Files attached', filesToSend);
    } catch (error) {
      console.error('Failed to send message:', error);
      if (!filesToSend.length) {
        setMessage(messageToSend);
      }
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setSelectedFiles(prev => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const isDisabled = isLoading || connectionStatus !== 'connected' || !user;

  return (
    <div style={{ 
      backgroundColor: '#ffffff', 
      borderTop: '1px solid #e5e7eb', 
      padding: '20px' 
    }}>
      {/* Selected Files */}
      {selectedFiles.length > 0 && (
        <div style={{ 
          marginBottom: '16px', 
          padding: '12px', 
          backgroundColor: '#f3f4f6', 
          borderRadius: '8px' 
        }}>
          <div style={{ 
            fontSize: '12px', 
            fontWeight: '500', 
            marginBottom: '8px', 
            color: '#374151' 
          }}>
            Selected Files ({selectedFiles.length})
          </div>
          {selectedFiles.map((file, index) => (
            <div key={index} style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '6px 8px',
              backgroundColor: '#ffffff',
              borderRadius: '4px',
              marginBottom: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>📎</span>
                <div>
                  <div style={{ fontSize: '12px', fontWeight: '500' }}>{file.name}</div>
                  <div style={{ fontSize: '10px', color: '#6b7280' }}>{formatFileSize(file.size)}</div>
                </div>
              </div>
              <button
                onClick={() => removeFile(index)}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#ef4444',
                  cursor: 'pointer',
                  padding: '4px',
                  fontSize: '12px'
                }}
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Input Form */}
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '12px', alignItems: 'end' }}>
        {/* File Upload Button */}
        <div style={{ position: 'relative' }}>
          <input
            type="file"
            multiple
            onChange={handleFileSelect}
            style={{
              position: 'absolute',
              opacity: 0,
              width: '100%',
              height: '100%',
              cursor: 'pointer'
            }}
            disabled={isDisabled}
          />
          <button
            type="button"
            disabled={isDisabled}
            style={{
              padding: '8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: '#ffffff',
              color: isDisabled ? '#9ca3af' : '#374151',
              cursor: isDisabled ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
            title="Attach files"
          >
            📎
          </button>
        </div>

        {/* Message Input */}
        <textarea
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder={
            !user ? "Please log in to send messages..." :
            connectionStatus !== 'connected' ? "Connecting..." :
            "Type your message..."
          }
          disabled={isDisabled}
          rows={1}
          style={{
            flex: 1,
            padding: '8px 12px',
            border: '1px solid #d1d5db',
            borderRadius: '6px',
            resize: 'none',
            fontSize: '14px',
            backgroundColor: isDisabled ? '#f3f4f6' : '#ffffff',
            color: isDisabled ? '#9ca3af' : '#374151',
            minHeight: '36px',
            maxHeight: '120px'
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleSubmit(e as any);
            }
          }}
        />
        
        {/* Send Button */}
        <button
          type="submit"
          disabled={isDisabled || (!message.trim() && selectedFiles.length === 0)}
          style={{
            padding: '8px 16px',
            backgroundColor: isDisabled || (!message.trim() && selectedFiles.length === 0) ? '#9ca3af' : '#3b82f6',
            color: '#ffffff',
            border: 'none',
            borderRadius: '6px',
            cursor: isDisabled || (!message.trim() && selectedFiles.length === 0) ? 'not-allowed' : 'pointer',
            fontSize: '14px',
            fontWeight: '500',
            display: 'flex',
            alignItems: 'center',
            gap: '4px'
          }}
        >
          {isLoading ? (
            <>
              <div style={{
                width: '12px',
                height: '12px',
                border: '2px solid rgba(255,255,255,0.3)',
                borderTop: '2px solid #ffffff',
                borderRadius: '50%',
                animation: 'spin 1s linear infinite'
              }}></div>
              Sending...
            </>
          ) : (
            <>
              ➤ Send
            </>
          )}
        </button>
      </form>
      
      <div style={{ 
        marginTop: '8px', 
        fontSize: '11px', 
        color: '#6b7280', 
        textAlign: 'center' 
      }}>
        Press Enter to send • Shift+Enter for new line
      </div>
    </div>
  );
};

// Main chat interface component
export const ChatInterface: React.FC = () => {
  const { user, logout } = useAuth();
  const { 
    messages, 
    connectionStatus, 
    clearMessages, 
    error, 
    subscription 
  } = useChatStore();

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const handleClearChat = () => {
    if (confirm('Are you sure you want to clear all messages?')) {
      clearMessages();
    }
  };

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case 'connected': return '#10b981';
      case 'connecting': return '#f59e0b';
      case 'error': return '#ef4444';
      default: return '#6b7280';
    }
  };

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case 'connected': return 'Connected';
      case 'connecting': return 'Connecting...';
      case 'error': return 'Connection Error';
      default: return 'Disconnected';
    }
  };

  return (
    <>
      {/* Add CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{ 
        height: '100vh', 
        display: 'flex', 
        flexDirection: 'column',
        backgroundColor: '#f9fafb',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        {/* Header */}
        <div style={{ 
          backgroundColor: '#ffffff', 
          borderBottom: '1px solid #e5e7eb', 
          padding: '16px 24px',
          flexShrink: 0
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'space-between' 
          }}>
            <div>
              <h1 style={{ 
                margin: '0 0 4px 0', 
                fontSize: '20px', 
                fontWeight: '600', 
                color: '#111827' 
              }}>
                AdventureOne Chat
              </h1>
              <p style={{ 
                margin: 0, 
                fontSize: '14px', 
                color: '#6b7280' 
              }}>
                Welcome back, {user?.name}! 
                {subscription && (
                  <span> • {subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1)} Plan</span>
                )}
              </p>
            </div>
            
            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '16px' 
            }}>
              {/* Connection Status */}
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: '6px' 
              }}>
                <div style={{
                  width: '8px',
                  height: '8px',
                  borderRadius: '50%',
                  backgroundColor: getConnectionStatusColor()
                }}></div>
                <span style={{ 
                  fontSize: '12px', 
                  color: '#6b7280' 
                }}>
                  {getConnectionStatusText()}
                </span>
              </div>

              {/* Usage Info */}
              {subscription && subscription.usage.maxMessages !== -1 && (
                <div style={{ 
                  fontSize: '12px', 
                  color: '#6b7280' 
                }}>
                  {subscription.usage.messagesThisMonth}/{subscription.usage.maxMessages} messages
                </div>
              )}

              {/* Actions */}
              <div style={{ 
                display: 'flex', 
                gap: '8px' 
              }}>
                <button
                  onClick={handleClearChat}
                  disabled={messages.length === 0}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: '#ffffff',
                    color: messages.length === 0 ? '#9ca3af' : '#374151',
                    cursor: messages.length === 0 ? 'not-allowed' : 'pointer'
                  }}
                >
                  Clear Chat
                </button>
                
                <button
                  onClick={handleLogout}
                  style={{
                    padding: '6px 12px',
                    fontSize: '12px',
                    border: '1px solid #d1d5db',
                    borderRadius: '4px',
                    backgroundColor: '#374151',
                    color: '#ffffff',
                    cursor: 'pointer'
                  }}
                >
                  Logout
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div style={{ 
            backgroundColor: '#fef2f2', 
            borderBottom: '1px solid #fecaca', 
            padding: '12px 24px',
            flexShrink: 0
          }}>
            <div style={{ 
              display: 'flex', 
              alignItems: 'center',
              gap: '8px',
              fontSize: '14px',
              color: '#dc2626'
            }}>
              <span>⚠️</span>
              {error}
            </div>
          </div>
        )}

        {/* Usage Warning */}
        {subscription && subscription.usage.maxMessages !== -1 && 
         subscription.usage.messagesThisMonth >= subscription.usage.maxMessages * 0.8 && (
          <div style={{ 
            backgroundColor: '#fef3c7', 
            borderBottom: '1px solid #fde68a', 
            padding: '8px 24px',
            flexShrink: 0
          }}>
            <div style={{ 
              fontSize: '12px',
              color: '#92400e',
              textAlign: 'center'
            }}>
              ⚡ You're approaching your monthly message limit. 
              {subscription.plan === 'free' && (
                <span> Upgrade to Pro for unlimited messages!</span>
              )}
            </div>
          </div>
        )}

        {/* Messages */}
        <SimpleMessageList />

        {/* Input */}
        <SimpleMessageInput />
      </div>
    </>
  );
};