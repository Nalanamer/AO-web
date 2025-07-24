// components/chat/FileUpload.tsx - Drag & drop file upload with preview
import React, { useState, useCallback, useRef } from 'react';
import { useAuth } from '../../contexts/AuthContext';

interface FileUploadProps {
  onFileSelect: (files: File[]) => void;
  maxFiles?: number;
  maxSizeInMB?: number;
  acceptedTypes?: string[];
  className?: string;
}

interface UploadedFile {
  file: File;
  id: string;
  preview?: string;
  status: 'pending' | 'uploading' | 'success' | 'error';
  error?: string;
}

const ACCEPTED_FILE_TYPES = {
  'image/*': ['jpg', 'jpeg', 'png', 'gif', 'webp'],
  'application/pdf': ['pdf'],
  'application/msword': ['doc'],
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['docx'],
  'text/plain': ['txt'],
  'text/csv': ['csv'],
  'application/vnd.ms-excel': ['xls'],
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['xlsx'],
  'application/json': ['json'],
  'text/javascript': ['js'],
  'text/typescript': ['ts'],
  'text/jsx': ['jsx'],
  'text/tsx': ['tsx'],
  'text/css': ['css'],
  'text/html': ['html'],
  'application/zip': ['zip']
};

export const FileUpload: React.FC<FileUploadProps> = ({
  onFileSelect,
  maxFiles = 5,
  maxSizeInMB = 10,
  acceptedTypes = Object.keys(ACCEPTED_FILE_TYPES),
  className = ''
}) => {
  const { user } = useAuth();
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Generate file preview for images
  const generatePreview = useCallback((file: File): Promise<string | undefined> => {
    return new Promise((resolve) => {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => resolve(e.target?.result as string);
        reader.onerror = () => resolve(undefined);
        reader.readAsDataURL(file);
      } else {
        resolve(undefined);
      }
    });
  }, []);

  // Validate file type and size
  const validateFile = useCallback((file: File): { valid: boolean; error?: string } => {
    // Check file size
    if (file.size > maxSizeInMB * 1024 * 1024) {
      return { valid: false, error: `File too large. Max size: ${maxSizeInMB}MB` };
    }

    // Check file type
    const isValidType = acceptedTypes.some(type => {
      if (type.endsWith('/*')) {
        return file.type.startsWith(type.slice(0, -1));
      }
      return file.type === type;
    });

    if (!isValidType) {
      const extensions = acceptedTypes.flatMap(type => 
        ACCEPTED_FILE_TYPES[type as keyof typeof ACCEPTED_FILE_TYPES] || []
      );
      return { 
        valid: false, 
        error: `File type not supported. Accepted: ${extensions.join(', ')}` 
      };
    }

    return { valid: true };
  }, [acceptedTypes, maxSizeInMB]);

  // Process selected files
  const processFiles = useCallback(async (fileList: FileList) => {
    const newFiles: File[] = Array.from(fileList);
    
    // Check file limit
    if (files.length + newFiles.length > maxFiles) {
      alert(`Maximum ${maxFiles} files allowed`);
      return;
    }

    const processedFiles: UploadedFile[] = [];

    for (const file of newFiles) {
      const validation = validateFile(file);
      const preview = await generatePreview(file);

      processedFiles.push({
        file,
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        preview,
        status: validation.valid ? 'pending' : 'error',
        error: validation.error
      });
    }

    setFiles(prev => [...prev, ...processedFiles]);
    
    // Notify parent of valid files
    const validFiles = processedFiles
      .filter(f => f.status === 'pending')
      .map(f => f.file);
    
    if (validFiles.length > 0) {
      onFileSelect(validFiles);
    }
  }, [files.length, maxFiles, validateFile, generatePreview, onFileSelect]);

  // Handle drag events
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDragIn = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.items && e.dataTransfer.items.length > 0) {
      setDragActive(true);
    }
  }, []);

  const handleDragOut = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFiles(e.dataTransfer.files);
    }
  }, [processFiles]);

  // Handle file input change
  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFiles(e.target.files);
    }
  }, [processFiles]);

  // Remove file
  const removeFile = useCallback((fileId: string) => {
    setFiles(prev => prev.filter(f => f.id !== fileId));
  }, []);

  // Clear all files
  const clearFiles = useCallback(() => {
    setFiles([]);
  }, []);

  // Get file type icon
  const getFileIcon = (file: File) => {
    if (file.type.startsWith('image/')) return '🖼️';
    if (file.type.includes('pdf')) return '📄';
    if (file.type.includes('word')) return '📝';
    if (file.type.includes('excel') || file.type.includes('csv')) return '📊';
    if (file.type.includes('zip')) return '🗂️';
    if (file.type.includes('text')) return '📄';
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

  if (!user) {
    return (
      <div className="p-4 text-center text-gray-500 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        Please log in to upload files
      </div>
    );
  }

  return (
    <div className={`w-full ${className}`}>
      {/* Upload Area */}
      <div
        className={`
          relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
          ${dragActive 
            ? 'border-blue-500 bg-blue-50' 
            : 'border-gray-300 hover:border-gray-400 bg-gray-50 hover:bg-gray-100'
          }
          ${files.length >= maxFiles ? 'opacity-50 cursor-not-allowed' : ''}
        `}
        onDragEnter={handleDragIn}
        onDragLeave={handleDragOut}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleFileInput}
          className="hidden"
          disabled={files.length >= maxFiles}
        />

        <div className="space-y-2">
          <div className="text-4xl">📁</div>
          <div className="text-lg font-medium text-gray-700">
            {dragActive ? 'Drop files here' : 'Click or drag files to upload'}
          </div>
          <div className="text-sm text-gray-500">
            Maximum {maxFiles} files, {maxSizeInMB}MB each
          </div>
          <div className="text-xs text-gray-400">
            Supported: Images, PDFs, Documents, Code files
          </div>
        </div>
      </div>

      {/* File List */}
      {files.length > 0 && (
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium text-gray-700">
              Uploaded Files ({files.length}/{maxFiles})
            </h4>
            <button
              onClick={clearFiles}
              className="text-xs text-red-600 hover:text-red-800"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-48 overflow-y-auto">
            {files.map((uploadedFile) => (
              <div
                key={uploadedFile.id}
                className={`
                  flex items-center space-x-3 p-3 rounded-lg border
                  ${uploadedFile.status === 'error' 
                    ? 'border-red-200 bg-red-50' 
                    : 'border-gray-200 bg-white'
                  }
                `}
              >
                {/* File Icon/Preview */}
                <div className="flex-shrink-0">
                  {uploadedFile.preview ? (
                    <img
                      src={uploadedFile.preview}
                      alt={uploadedFile.file.name}
                      className="w-10 h-10 object-cover rounded"
                    />
                  ) : (
                    <div className="w-10 h-10 flex items-center justify-center text-lg">
                      {getFileIcon(uploadedFile.file)}
                    </div>
                  )}
                </div>

                {/* File Info */}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {uploadedFile.file.name}
                  </div>
                  <div className="text-xs text-gray-500">
                    {formatFileSize(uploadedFile.file.size)}
                  </div>
                  {uploadedFile.error && (
                    <div className="text-xs text-red-600 mt-1">
                      {uploadedFile.error}
                    </div>
                  )}
                </div>

                {/* Status & Actions */}
                <div className="flex items-center space-x-2">
                  {uploadedFile.status === 'pending' && (
                    <div className="text-xs text-green-600">✓ Ready</div>
                  )}
                  {uploadedFile.status === 'uploading' && (
                    <div className="text-xs text-blue-600">↑ Uploading...</div>
                  )}
                  {uploadedFile.status === 'success' && (
                    <div className="text-xs text-green-600">✓ Sent</div>
                  )}
                  {uploadedFile.status === 'error' && (
                    <div className="text-xs text-red-600">✗ Error</div>
                  )}

                  <button
                    onClick={() => removeFile(uploadedFile.id)}
                    className="text-gray-400 hover:text-red-600 p-1"
                    title="Remove file"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};