// components/chat/MessageList.tsx - Enhanced with file previews and message actions
import React, { useEffect, useRef, useState } from 'react';
import { useChatStore, Message } from '../../stores/chatStore';
import { MessageActions } from '../subscription/FeatureGate';

interface MessageItemProps {
  message: Message;
  onRetry?: (messageId: string) => void;
}

const MessageItem: React.FC<MessageItemProps> = ({ message, onRetry }) => {
  const isUser = message.role === 'user';
  const [timeString, setTimeString] = useState('');
  const [showActions, setShowActions] = useState(false);
  const [imageLoadErrors, setImageLoadErrors] = useState<Set<string>>(new Set());

  // Fix hydration issue by formatting timestamp on client side only
  useEffect(() => {
    setTimeString(message.timestamp.toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    }));
  }, [message.timestamp]);

  // Handle image load errors
  const handleImageError = (fileId: string) => {
    setImageLoadErrors(prev => new Set([...prev, fileId]));
  };

  // Get file type icon
  const getFileIcon = (type: string) => {
    if (type.startsWith('image/')) return '🖼️';
    if (type.includes('pdf')) return '📄';
    if (type.includes('word')) return '📝';
    if (type.includes('excel') || type.includes('csv')) return '📊';
    if (type.includes('zip')) return '🗂️';
    if (type.includes('text')) return '📄';
    if (type.includes('json')) return '📋';
    if (type.includes('javascript') || type.includes('typescript')) return '⚙️';
    return '📎';
  };

  // Format file size
  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Render file attachment
  const renderFileAttachment = (file: any, index: number) => {
    const isImage = file.type.startsWith('image/');
    const hasError = imageLoadErrors.has(file.id);

    return (
      <div key={index} className="mt-3 first:mt-2">
        <div className={`
          border rounded-lg overflow-hidden transition-all duration-200
          ${isUser ? 'border-blue-200 bg-blue-50' : 'border-gray-200 bg-gray-50'}
        `}>
          {/* Image Preview */}
          {isImage && file.preview && !hasError && (
            <div className="relative">
              <img
                src={file.preview}
                alt={file.name}
                className="w-full max-w-sm max-h-64 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                onError={() => handleImageError(file.id)}
                onClick={() => window.open(file.url || file.preview, '_blank')}
              />
              <div className="absolute top-2 right-2 bg-black bg-opacity-50 text-white text-xs px-2 py-1 rounded">
                {formatFileSize(file.size)}
              </div>
            </div>
          )}

          {/* File Info */}
          <div className="p-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getFileIcon(file.type)}</span>
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${
                  isUser ? 'text-blue-900' : 'text-gray-900'
                }`}>
                  {file.name}
                </div>
                <div className={`text-xs ${
                  isUser ? 'text-blue-700' : 'text-gray-600'
                }`}>
                  {file.type} • {formatFileSize(file.size)}
                </div>
              </div>
              
              {/* File Actions */}
              <div className="flex items-center space-x-1">
                {file.url && (
                  <button
                    onClick={() => window.open(file.url, '_blank')}
                    className={`p-1 rounded hover:bg-opacity-20 ${
                      isUser 
                        ? 'text-blue-700 hover:bg-blue-600' 
                        : 'text-gray-600 hover:bg-gray-600'
                    }`}
                    title="Open file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                  </button>
                )}
                
                <button
                  onClick={() => {
                    // Create download link
                    const link = document.createElement('a');
                    link.href = file.url || file.preview || '';
                    link.download = file.name;
                    link.click();
                  }}
                  className={`p-1 rounded hover:bg-opacity-20 ${
                    isUser 
                      ? 'text-blue-700 hover:bg-blue-600' 
                      : 'text-gray-600 hover:bg-gray-600'
                  }`}
                  title="Download file"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </button>
              </div>
            </div>

            {/* File Analysis Results */}
            {file.analysisResult && (
              <div className={`mt-2 p-2 rounded text-xs ${
                isUser ? 'bg-blue-100 text-blue-800' : 'bg-gray-100 text-gray-700'
              }`}>
                <div className="font-medium mb-1">AI Analysis:</div>
                <div className="whitespace-pre-wrap">{file.analysisResult.summary || 'Analysis completed'}</div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div 
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-6 group`}
      onMouseEnter={() => setShowActions(true)}
      onMouseLeave={() => setShowActions(false)}
    >
      <div className={`max-w-[80%] ${isUser ? 'order-1' : 'order-2'}`}>
        {/* Message Bubble */}
        <div className={`rounded-lg px-4 py-3 ${
          isUser
            ? 'bg-blue-600 text-white'
            : 'bg-gray-100 text-gray-800 border border-gray-200'
        }`}>
          {/* Message Content */}
          {message.content && (
            <div className="text-sm leading-relaxed whitespace-pre-wrap">
              {message.content}
            </div>
          )}

          {/* File Attachments */}
          {message.files && message.files.length > 0 && (
            <div className="space-y-2">
              {message.files.map((file, index) => renderFileAttachment(file, index))}
            </div>
          )}

          {/* AI Metadata */}
          {message.metadata && (
            <div className={`text-xs mt-2 opacity-75 ${
              isUser ? 'text-blue-100' : 'text-gray-500'
            }`}>
              {message.metadata.model && (
                <div>Model: {message.metadata.model}</div>
              )}
              {message.metadata.tokens && (
                <div>Tokens: {message.metadata.tokens}</div>
              )}
              {message.metadata.processingTime && (
                <div>Processing: {message.metadata.processingTime}ms</div>
              )}
            </div>
          )}

          {/* Message Status and Time */}
          <div className={`text-xs mt-2 flex items-center justify-between ${
            isUser ? 'text-blue-100' : 'text-gray-500'
          }`}>
            <span>{timeString}</span>
            <div className="flex items-center space-x-2">
              {message.status === 'sending' && (
                <div className="flex items-center space-x-1">
                  <svg className="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span>Sending...</span>
                </div>
              )}
              {message.status === 'error' && (
                <div className="flex items-center space-x-1">
                  <svg className="h-3 w-3 text-red-500" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                  <span className="text-red-500">Failed</span>
                  {onRetry && (
                    <button
                      onClick={() => onRetry(message.id)}
                      className="ml-1 text-red-500 hover:text-red-400 underline"
                    >
                      Retry
                    </button>
                  )}
                </div>
              )}
              {message.status === 'sent' && isUser && (
                <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                </svg>
              )}
            </div>
          </div>
        </div>

        {/* Message Actions */}
        {showActions && message.status === 'sent' && (
          <div className={`mt-2 transition-opacity duration-200 ${
            isUser ? 'text-right' : 'text-left'
          }`}>
            <MessageActions 
              messageId={message.id}
              content={message.content}
              className="inline-flex"
            />
          </div>
        )}
      </div>
    </div>
  );
};

// Main message list component
export const MessageList: React.FC = () => {
  const { messages, isLoading, retryMessage, searchMessages } = useChatStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredMessages, setFilteredMessages] = useState<Message[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Handle search
  useEffect(() => {
    if (searchQuery.trim()) {
      setFilteredMessages(searchMessages(searchQuery));
    } else {
      setFilteredMessages([]);
    }
  }, [searchQuery, messages, searchMessages]);

  const displayMessages = filteredMessages.length > 0 ? filteredMessages : messages;

  return (
    <div className="flex-1 overflow-y-auto bg-gray-50">
      {/* Search Bar */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 p-4">
        <div className="max-w-4xl mx-auto">
          <div className="relative">
            <input
              type="text"
              placeholder="Search messages..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            />
            <svg className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
          
          {/* Search Results Info */}
          {searchQuery && (
            <div className="mt-2 text-sm text-gray-600">
              {filteredMessages.length > 0 
                ? `Found ${filteredMessages.length} message${filteredMessages.length === 1 ? '' : 's'}`
                : 'No messages found'
              }
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="p-6">
        <div className="max-w-4xl mx-auto">
          {displayMessages.length === 0 && !isLoading ? (
            <div className="text-center py-12">
              <div className="text-6xl mb-4">💬</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {searchQuery ? 'No messages found' : 'Start a conversation'}
              </h3>
              <p className="text-gray-600">
                {searchQuery 
                  ? 'Try different search terms or clear the search to see all messages.'
                  : 'Send a message or upload files to get started with your AI assistant.'
                }
              </p>
            </div>
          ) : (
            <>
              {displayMessages.map((message) => (
                <MessageItem 
                  key={message.id} 
                  message={message} 
                  onRetry={retryMessage}
                />
              ))}

              {/* Loading Indicator */}
              {isLoading && (
                <div className="flex justify-start mb-6">
                  <div className="bg-gray-100 border border-gray-200 rounded-lg px-4 py-3">
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin h-4 w-4 border-2 border-blue-600 border-t-transparent rounded-full"></div>
                      <span className="text-gray-600 text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>
    </div>
  );
};