import React, { useState } from 'react';
import { FileUpload, ImportReview } from '../components';
import { documentService } from '../services/documentService';
import { transactionService } from '../services/transactionService';
import { Document, TransactionType } from '../types';
import { ImportReviewTransaction } from '../components/ImportReview';

type DocumentType = 'bank_statement' | 'receipt';

const ImportPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [documentType, setDocumentType] = useState<DocumentType>('bank_statement');
  const [isUploading, setIsUploading] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [uploadedDocument, setUploadedDocument] = useState<Document | null>(null);
  const [reviewTransactions, setReviewTransactions] = useState<ImportReviewTransaction[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    setError(null);
    setUploadedDocument(null);
    setReviewTransactions([]);
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
      const parsedTransactions = await documentService.parse(documentId);
      
      // Convert parsed transactions to review format
      const reviewTxns: ImportReviewTransaction[] = parsedTransactions.map((t, index) => ({
        id: `parsed-${index}`,
        date: t.date,
        amount: t.amount,
        type: TransactionType.EXPENSE, // Default to expense, user can change
        description: t.description,
        category: t.category,
        categoryId: undefined,
        account: '', // User needs to select
        accountId: undefined,
        notes: undefined,
        selected: true,
        expanded: false,
      }));
      
      setReviewTransactions(reviewTxns);
    } catch (err: any) {
      setError(err.message || 'Failed to parse document');
      console.error('Parse error:', err);
    } finally {
      setIsParsing(false);
    }
  };

  const handleApproveTransactions = async (transactions: ImportReviewTransaction[]) => {
    setIsApproving(true);
    setError(null);
    setSuccessMessage(null);

    try {
      // Validate that all transactions have required fields
      const invalidTransactions = transactions.filter(t => !t.accountId || !t.date || !t.description);
      if (invalidTransactions.length > 0) {
        setError('Please ensure all transactions have an account, date, and description selected');
        setIsApproving(false);
        return;
      }

      let successCount = 0;
      
      for (const transaction of transactions) {
        if (transaction.split && transaction.items && transaction.items.length > 0) {
          // Handle split transactions - use createSplit endpoint
          await transactionService.createSplit({
            date: transaction.date,
            amount: transaction.amount,
            description: transaction.description,
            accountId: transaction.accountId!,
            items: transaction.items.map(item => ({
              amount: item.amount,
              description: item.description,
              categoryId: item.categoryId,
              notes: item.notes,
            })),
          });
          successCount++;
        } else {
          // Handle regular transactions - use bulk create
          await transactionService.create({
            date: transaction.date,
            amount: transaction.amount,
            type: transaction.type,
            description: transaction.description,
            notes: transaction.notes,
            accountId: transaction.accountId!,
            categoryId: transaction.categoryId,
            tagIds: transaction.tagIds,
          });
          successCount++;
        }
      }

      if (successCount > 0) {
        setSuccessMessage(`Successfully imported ${successCount} transaction(s)`);
        
        // Reset state after successful import
        setTimeout(() => {
          handleReset();
        }, 2000);
      } else {
        setError('No valid transactions to import');
      }
    } catch (err: any) {
      setError(err.message || 'Failed to approve transactions');
      console.error('Approval error:', err);
    } finally {
      setIsApproving(false);
    }
  };

  const handleCancelReview = () => {
    setReviewTransactions([]);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setUploadedDocument(null);
    setReviewTransactions([]);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Import Documents</h1>
        <a
          href="/import-data"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
        >
          Import from JSON/YAML
        </a>
      </div>

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

      {/* Success Message */}
      {successMessage && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-6">
          <div className="flex items-start">
            <svg
              className="h-5 w-5 text-green-500 mt-0.5 mr-2"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-green-800">Success</h3>
              <p className="text-sm text-green-700 mt-1">{successMessage}</p>
            </div>
          </div>
        </div>
      )}

      {/* Import Review Interface */}
      {reviewTransactions.length > 0 && !isParsing && !successMessage && (
        <div className="mt-6">
          <ImportReview
            transactions={reviewTransactions}
            onApprove={handleApproveTransactions}
            onCancel={handleCancelReview}
            loading={isApproving}
          />
        </div>
      )}
    </div>
  );
};

export default ImportPage;
