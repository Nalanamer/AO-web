// components/chat/MessageInput.tsx - Enhanced with file upload integration
import React, { useState, KeyboardEvent, useRef, useCallback } from 'react';
import { useChatStore } from '../../stores/chatStore';
import { useAuth } from '../../contexts/AuthContext';
import { FileUpload } from './FileUpload';

export const MessageInput: React.FC = () => {
    const [message, setMessage] = useState('');
    const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
    const [showFileUpload, setShowFileUpload] = useState(false);
    const [isExpanded, setIsExpanded] = useState(false);
    const textareaRef = useRef<HTMLTextAreaElement>(null);
    
    const { 
        sendMessage, 
        isLoading, 
        connectionStatus, 
        subscription,
        uploadingFiles,
        uploadProgress,
        error 
    } = useChatStore();
    const { user } = useAuth();

    // Auto-resize textarea
    const adjustTextareaHeight = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${Math.min(textarea.scrollHeight, 120)}px`;
        }
    }, []);

    // Handle message input change
    const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setMessage(e.target.value);
        adjustTextareaHeight();
    };

    // Handle file selection
    const handleFileSelect = useCallback((files: File[]) => {
        setSelectedFiles(prev => [...prev, ...files]);
        if (files.length > 0 && !isExpanded) {
            setIsExpanded(true);
        }
    }, [isExpanded]);

    // Remove selected file
    const removeSelectedFile = useCallback((index: number) => {
        setSelectedFiles(prev => prev.filter((_, i) => i !== index));
        if (selectedFiles.length === 1) {
            setIsExpanded(false);
            setShowFileUpload(false);
        }
    }, [selectedFiles.length]);

    // Handle form submission
    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if ((!message.trim() && selectedFiles.length === 0) || isLoading || !user) {
            return;
        }
        
        const messageToSend = message.trim();
        const filesToSend = [...selectedFiles];
        
        // Clear input immediately
        setMessage('');
        setSelectedFiles([]);
        setIsExpanded(false);
        setShowFileUpload(false);
        
        // Reset textarea height
        if (textareaRef.current) {
            textareaRef.current.style.height = 'auto';
        }
        
        try {
            await sendMessage(messageToSend || '📎 Files attached', filesToSend);
        } catch (error) {
            console.error('Failed to send message:', error);
            // Restore message if there's an error and no files
            if (!filesToSend.length) {
                setMessage(messageToSend);
            }
        }
    };

    // Handle keyboard shortcuts
    const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSubmit(e as any);
        }
        
        if (e.key === 'Escape') {
            setIsExpanded(false);
            setShowFileUpload(false);
        }
    };

    // Check if user can send messages
    const canSendMessage = () => {
        if (!user || connectionStatus !== 'connected') return false;
        
        if (subscription && subscription.usage.maxMessages !== -1) {
            return subscription.usage.messagesThisMonth < subscription.usage.maxMessages;
        }
        
        return true;
    };

    // Check if user can upload files
    const canUploadFiles = () => {
        if (!user) return false;
        
        if (subscription && subscription.usage.maxFiles !== -1) {
            const remainingFiles = subscription.usage.maxFiles - subscription.usage.filesUploadedThisMonth;
            return remainingFiles > 0;
        }
        
        return true;
    };

    // Get placeholder text based on state
    const getPlaceholderText = () => {
        if (!user) return "Please log in to send messages...";
        if (connectionStatus !== 'connected') return "Connecting...";
        if (!canSendMessage()) return "Monthly message limit reached. Please upgrade your plan.";
        return "Type your message...";
    };

    // Format file size
    const formatFileSize = (bytes: number) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    };

    const isDisabled = isLoading || uploadingFiles || connectionStatus !== 'connected' || !user || !canSendMessage();

    return (
        <div className="bg-white border-t border-gray-200">
            {/* Error Banner */}
            {error && (
                <div className="px-6 py-2 bg-red-50 border-b border-red-200">
                    <div className="flex items-center text-sm text-red-700">
                        <svg className="w-4 h-4 mr-2 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        {error}
                    </div>
                </div>
            )}

            {/* Usage Information */}
            {subscription && subscription.usage.maxMessages !== -1 && (
                <div className="px-6 py-2 bg-blue-50 border-b border-blue-200">
                    <div className="flex items-center justify-between text-sm">
                        <div className="text-blue-700">
                            Messages: {subscription.usage.messagesThisMonth}/{subscription.usage.maxMessages} this month
                        </div>
                        {subscription.usage.maxFiles !== -1 && (
                            <div className="text-blue-700">
                                Files: {subscription.usage.filesUploadedThisMonth}/{subscription.usage.maxFiles} this month
                            </div>
                        )}
                    </div>
                    {subscription.usage.messagesThisMonth >= subscription.usage.maxMessages * 0.8 && (
                        <div className="text-xs text-blue-600 mt-1">
                            {subscription.plan === 'free' 
                                ? 'Upgrade to Pro for unlimited messages' 
                                : 'You\'re approaching your monthly limit'
                            }
                        </div>
                    )}
                </div>
            )}

            {/* File Upload Area */}
            {(isExpanded || showFileUpload) && (
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                    <FileUpload
                        onFileSelect={handleFileSelect}
                        maxFiles={5}
                        maxSizeInMB={10}
                        className="mb-4"
                    />
                </div>
            )}

            {/* Selected Files Preview */}
            {selectedFiles.length > 0 && (
                <div className="px-6 py-3 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">
                            Selected Files ({selectedFiles.length})
                        </span>
                        <button
                            onClick={() => {
                                setSelectedFiles([]);
                                setIsExpanded(false);
                                setShowFileUpload(false);
                            }}
                            className="text-xs text-red-600 hover:text-red-800"
                        >
                            Clear All
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        {selectedFiles.map((file, index) => (
                            <div key={index} className="flex items-center justify-between p-2 bg-white rounded border">
                                <div className="flex items-center space-x-2">
                                    <span className="text-lg">📎</span>
                                    <div>
                                        <div className="text-sm font-medium text-gray-900">{file.name}</div>
                                        <div className="text-xs text-gray-500">{formatFileSize(file.size)}</div>
                                    </div>
                                </div>
                                
                                <button
                                    onClick={() => removeSelectedFile(index)}
                                    className="text-gray-400 hover:text-red-600 p-1"
                                >
                                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Upload Progress */}
            {uploadingFiles && Object.keys(uploadProgress).length > 0 && (
                <div className="px-6 py-3 border-b border-gray-200 bg-blue-50">
                    <div className="space-y-2">
                        {Object.entries(uploadProgress).map(([fileName, progress]) => (
                            <div key={fileName} className="space-y-1">
                                <div className="flex justify-between text-sm">
                                    <span className="text-blue-700">Uploading {fileName}</span>
                                    <span className="text-blue-600">{progress}%</span>
                                </div>
                                <div className="w-full bg-blue-200 rounded-full h-2">
                                    <div 
                                        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                        style={{ width: `${progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* Main Input Area */}
            <div className="p-6">
                <form onSubmit={handleSubmit} className="flex items-end space-x-4">
                    {/* File Upload Button */}
                    <button
                        type="button"
                        onClick={() => {
                            setShowFileUpload(!showFileUpload);
                            setIsExpanded(true);
                        }}
                        disabled={!canUploadFiles() || uploadingFiles}
                        className={`
                            flex-shrink-0 p-2 rounded-lg transition-colors
                            ${canUploadFiles() && !uploadingFiles
                                ? 'text-gray-500 hover:text-blue-600 hover:bg-blue-50' 
                                : 'text-gray-300 cursor-not-allowed'
                            }
                        `}
                        title={canUploadFiles() ? "Attach files" : "File upload not available"}
                    >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13" />
                        </svg>
                    </button>

                    {/* Message Input */}
                    <div className="flex-1">
                        <textarea
                            ref={textareaRef}
                            value={message}
                            onChange={handleMessageChange}
                            onKeyDown={handleKeyDown}
                            placeholder={getPlaceholderText()}
                            disabled={isDisabled}
                            rows={1}
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                            style={{ minHeight: '48px', maxHeight: '120px' }}
                        />
                    </div>
                    
                    {/* Send Button */}
                    <button
                        type="submit"
                        disabled={isDisabled || (!message.trim() && selectedFiles.length === 0)}
                        className="flex-shrink-0 inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                    >
                        {isLoading || uploadingFiles ? (
                            <>
                                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {uploadingFiles ? 'Uploading...' : 'Sending...'}
                            </>
                        ) : (
                            <>
                                <svg className="-ml-1 mr-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                                </svg>
                                Send
                            </>
                        )}
                    </button>
                </form>
                
                <div className="mt-2 text-xs text-gray-500 text-center">
                    Press Enter to send • Shift+Enter for new line • Escape to collapse
                </div>
            </div>
        </div>
    );
};