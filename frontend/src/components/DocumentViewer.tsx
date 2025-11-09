import React, { useState, useEffect } from 'react';
import { documentService } from '../services/documentService';
import { Document } from '../types';

interface DocumentViewerProps {
  documentId: string;
  document?: Document;
  isOpen: boolean;
  onClose: () => void;
}

const DocumentViewer: React.FC<DocumentViewerProps> = ({
  documentId,
  document: providedDocument,
  isOpen,
  onClose,
}) => {
  const [documentUrl, setDocumentUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [documentMetadata, setDocumentMetadata] = useState<Document | null>(
    providedDocument || null
  );

  useEffect(() => {
    if (isOpen && documentId) {
      loadDocument();
    }

    return () => {
      // Cleanup object URL when component unmounts or modal closes
      if (documentUrl) {
        URL.revokeObjectURL(documentUrl);
      }
    };
  }, [isOpen, documentId]);

  const loadDocument = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const blob = await documentService.getById(documentId);
      const url = URL.createObjectURL(blob);
      setDocumentUrl(url);
    } catch (err: any) {
      setError(err.message || 'Failed to load document');
      console.error('Document load error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!documentMetadata) return;

    try {
      await documentService.download(documentId, documentMetadata.originalName);
    } catch (err: any) {
      setError(err.message || 'Failed to download document');
      console.error('Download error:', err);
    }
  };

  const handleClose = () => {
    if (documentUrl) {
      URL.revokeObjectURL(documentUrl);
      setDocumentUrl(null);
    }
    onClose();
  };

  if (!isOpen) return null;

  const isPDF = documentMetadata?.mimeType === 'application/pdf';
  const isImage =
    documentMetadata?.mimeType === 'image/jpeg' ||
    documentMetadata?.mimeType === 'image/png';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black bg-opacity-50 transition-opacity"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="relative bg-white rounded-lg shadow-xl max-w-5xl w-full max-h-[90vh] flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-semibold text-gray-900 truncate">
                {documentMetadata?.originalName || 'Document'}
              </h2>
              {documentMetadata && (
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  <span>
                    {(documentMetadata.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                  <span>
                    {new Date(documentMetadata.uploadedAt).toLocaleDateString()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex items-center gap-2 ml-4">
              {/* Download Button */}
              <button
                onClick={handleDownload}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Download"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                  />
                </svg>
              </button>

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                title="Close"
              >
                <svg
                  className="h-5 w-5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-auto p-4 bg-gray-50">
            {isLoading && (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <svg
                    className="animate-spin h-10 w-10 text-blue-600 mx-auto"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <p className="mt-2 text-gray-600">Loading document...</p>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full">
                <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md">
                  <div className="flex items-start">
                    <svg
                      className="h-6 w-6 text-red-500 mt-0.5 mr-3"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                      />
                    </svg>
                    <div>
                      <h3 className="text-sm font-medium text-red-800">
                        Error Loading Document
                      </h3>
                      <p className="text-sm text-red-700 mt-1">{error}</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {!isLoading && !error && documentUrl && (
              <>
                {/* PDF Viewer */}
                {isPDF && (
                  <div className="h-full min-h-[600px]">
                    <iframe
                      src={documentUrl}
                      className="w-full h-full rounded-lg border border-gray-300"
                      title="PDF Document"
                    />
                  </div>
                )}

                {/* Image Viewer */}
                {isImage && (
                  <div className="flex items-center justify-center">
                    <img
                      src={documentUrl}
                      alt={documentMetadata?.originalName || 'Document'}
                      className="max-w-full h-auto rounded-lg shadow-lg"
                    />
                  </div>
                )}

                {/* Unsupported Type */}
                {!isPDF && !isImage && (
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <svg
                        className="h-16 w-16 text-gray-400 mx-auto"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                        />
                      </svg>
                      <p className="mt-4 text-gray-600">
                        Preview not available for this file type
                      </p>
                      <button
                        onClick={handleDownload}
                        className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                      >
                        Download to View
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default DocumentViewer;
