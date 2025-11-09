import React, { useState } from 'react';
import { FileUpload } from '../components';
import { documentService } from '../services/documentService';
import { Document, ParsedTransaction } from '../types';

type DocumentType = 'bank_statement' | 'receipt';

const ImportPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('bank_statement');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);
  const [parsedTransactions, setParsedTransactions] = useState<ParsedTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setUploadedDocument(null);
    setParsedTransactions([]);
  };

  const handleUpload = async () => {
    if (!selectedFile) return;

    setIsUploading(true);
    setError(null);

    try {
      const document = await documentService.upload(selectedFile);
      setUploadedDocument(document);
      
      // Automatically start parsing after upload
      await handleParse(document.id);
    } catch (err: any) {
      setError(err.message || 'Failed to upload document');
      console.error('Upload error:', err);
    } finally {
      setIsUploading(false);
    }
  };

  const handleParse = async (documentId: string) => {
    setIsParsing(true);
    setError(null);

    try {
      const transactions = await documentService.parse(documentId);
      setParsedTransactions(transactions);
    } catch (err: any) {
      setError(err.message || 'Failed to parse document');
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedDocument(null);
    setParsedTransactions([]);
    setError(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-3xl font-bold mb-6">Import Documents</h1>

      {!uploadedDocument && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Document Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Document Type
            </label>
            <div className="flex gap-4">
              <label className="flex items-center">
                <input
                  type="radio"
                  name="documentType"
                  value="bank_statement"
                  checked={documentType === 'bank_statement'}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="mr-2"
                />
                <span className="text-sm">Bank Statement (PDF)</span>
              </label>
              <label className="flex items-center">
                <input
                  type="radio"
                  name="documentType"
                  value="receipt"
                  checked={documentType === 'receipt'}
                  onChange={(e) => setDocumentType(e.target.value as DocumentType)}
                  className="mr-2"
                />
                <span className="text-sm">Receipt (Image)</span>
              </label>
            </div>
            <p className="text-xs text-gray-500 mt-1">
              {documentType === 'bank_statement'
                ? 'Upload a PDF bank statement to extract multiple transactions'
                : 'Upload a receipt image (JPEG/PNG) to extract purchase details'}
            </p>
          </div>

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload Document
            </label>
            <FileUpload
              onFileSelect={handleFileSelect}
              acceptedTypes={
                documentType === 'bank_statement'
                  ? ['application/pdf']
                  : ['image/jpeg', 'image/png']
              }
              maxSizeMB={10}
              disabled={isUploading}
            />
          </div>

          {/* Upload Button */}
          {selectedFile && (
            <div className="flex justify-end">
              <button
                onClick={handleUpload}
                disabled={isUploading}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isUploading ? 'Uploading...' : 'Upload and Parse'}
              </button>
            </div>
          )}

          {/* Error Display */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-start">
                <svg
                  className="h-5 w-5 text-red-500 mt-0.5 mr-2"
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
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Parsing Status */}
      {isParsing && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <div className="flex items-center justify-center space-x-3">
            <svg
              className="animate-spin h-6 w-6 text-blue-600"
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
            <span className="text-lg font-medium text-gray-700">
              Parsing document...
            </span>
          </div>
          <p className="text-center text-sm text-gray-500 mt-2">
            This may take a few moments
          </p>
        </div>
      )}

      {/* Import Review Interface (Placeholder for Task 26) */}
      {parsedTransactions.length > 0 && !isParsing && (
        <div className="bg-white rounded-lg shadow p-6 mt-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Parsed Transactions</h2>
            <button
              onClick={handleReset}
              className="text-sm text-gray-600 hover:text-gray-800"
            >
              Upload Another Document
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <p className="text-sm text-blue-800">
              Found {parsedTransactions.length} transaction(s). Import review interface will be implemented in Task 26.
            </p>
          </div>

          {/* Display parsed transactions */}
          <div className="space-y-2">
            {parsedTransactions.map((transaction, index) => (
              <div
                key={index}
                className="border border-gray-200 rounded-lg p-4 bg-gray-50"
              >
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="font-medium">Date:</span> {transaction.date}
                  </div>
                  <div>
                    <span className="font-medium">Amount:</span> ${transaction.amount.toFixed(2)}
                  </div>
                  <div className="col-span-2">
                    <span className="font-medium">Description:</span> {transaction.description}
                  </div>
                  {transaction.category && (
                    <div className="col-span-2">
                      <span className="font-medium">Category:</span> {transaction.category}
                      {transaction.confidence && (
                        <span className="text-gray-500 ml-2">
                          ({Math.round(transaction.confidence * 100)}% confidence)
                        </span>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default ImportPage;
