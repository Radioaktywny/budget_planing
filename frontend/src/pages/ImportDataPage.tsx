import React, { useState, useEffect } from 'react';
import { ImportReview } from '../components';
import { importService } from '../services/importService';
import { transactionService } from '../services/transactionService';
import { TransactionType } from '../types';
import { ImportReviewTransaction } from '../components/ImportReview';

type ImportFormat = 'json' | 'yaml';

interface ValidationError {
  field: string;
  message: string;
  index?: number;
}

interface ImportPreview {
  transactions: Array<{
    date: string;
    amount: number;
    type: 'INCOME' | 'EXPENSE' | 'TRANSFER';
    description: string;
    category?: string;
    categoryId?: string;
    account: string;
    accountId?: string;
    notes?: string;
    tags?: string[];
    tagIds?: string[];
    split?: boolean;
    items?: Array<{
      amount: number;
      description: string;
      category?: string;
      categoryId?: string;
      notes?: string;
    }>;
  }>;
  warnings: string[];
  document?: {
    filename?: string;
    date?: string;
  };
}

const ImportDataPage: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState<string>('');
  const [format, setFormat] = useState<ImportFormat>('json');
  const [isValidating, setIsValidating] = useState(false);
  const [isParsing, setIsParsing] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [validationErrors, setValidationErrors] = useState<ValidationError[]>([]);
  const [reviewTransactions, setReviewTransactions] = useState<ImportReviewTransaction[]>([]);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [showSchema, setShowSchema] = useState(false);
  const [schema, setSchema] = useState<any>(null);

  useEffect(() => {
    loadSchema();
  }, []);

  const loadSchema = async () => {
    try {
      const schemaData = await importService.getSchema();
      setSchema(schemaData);
    } catch (err) {
      console.error('Failed to load schema:', err);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setError(null);
    setValidationErrors([]);
    setReviewTransactions([]);
    setWarnings([]);

    // Detect format from file extension
    const extension = file.name.split('.').pop()?.toLowerCase();
    if (extension === 'yaml' || extension === 'yml') {
      setFormat('yaml');
    } else {
      setFormat('json');
    }

    // Read file content
    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setFileContent(content);
    };
    reader.onerror = () => {
      setError('Failed to read file');
    };
    reader.readAsText(file);
  };

  const handleValidate = async () => {
    if (!fileContent) {
      setError('Please select a file first');
      return;
    }

    setIsValidating(true);
    setError(null);
    setValidationErrors([]);

    try {
      let data: any;
      
      if (format === 'json') {
        try {
          data = JSON.parse(fileContent);
        } catch (parseError) {
          setError('Invalid JSON format. Please check your file syntax.');
          setIsValidating(false);
          return;
        }
      } else {
        // For YAML, we'll send the raw content to the backend
        data = { yaml: fileContent };
      }

      // Call validate endpoint
      const response = await importService.validate(data);
      
      if (response.valid) {
        setSuccessMessage(`File is valid! Found ${(response as any).transactionCount || 0} transactions.`);
        setValidationErrors([]);
      } else {
        setValidationErrors(response.errors as ValidationError[] || []);
        setError('Validation failed. Please fix the errors below.');
      }
    } catch (err: any) {
      if (err.details) {
        setValidationErrors(err.details);
        setError('Validation failed. Please fix the errors below.');
      } else {
        setError(err.message || 'Failed to validate file');
      }
    } finally {
      setIsValidating(false);
    }
  };

  const handleImport = async () => {
    if (!fileContent) {
      setError('Please select a file first');
      return;
    }

    setIsParsing(true);
    setError(null);
    setValidationErrors([]);
    setSuccessMessage(null);

    try {
      let response: any;
      
      if (format === 'json') {
        const data = JSON.parse(fileContent);
        response = await importService.importJSON(data);
      } else {
        response = await importService.importYAML(fileContent);
      }

      // Extract preview data
      const preview: ImportPreview = response.preview || response;
      
      // Convert to review format
      const reviewTxns: ImportReviewTransaction[] = preview.transactions.map((t, index) => ({
        id: `import-${index}`,
        date: t.date,
        amount: t.amount,
        type: t.type as TransactionType,
        description: t.description,
        category: t.category,
        categoryId: t.categoryId,
        account: t.account,
        accountId: t.accountId,
        notes: t.notes,
        tags: t.tags,
        tagIds: t.tagIds,
        split: t.split,
        items: t.items?.map((item, itemIndex) => ({
          id: `import-${index}-item-${itemIndex}`,
          amount: item.amount,
          description: item.description,
          category: item.category,
          categoryId: item.categoryId,
          notes: item.notes,
        })),
        selected: true,
        expanded: false,
      }));
      
      setReviewTransactions(reviewTxns);
      setWarnings(preview.warnings || []);
    } catch (err: any) {
      if (err.details) {
        setValidationErrors(err.details);
        setError('Import failed. Please fix the errors below.');
      } else {
        setError(err.message || 'Failed to import file');
      }
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
          // Handle split transactions
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
          // Handle regular transactions
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
    setWarnings([]);
  };

  const handleReset = () => {
    setSelectedFile(null);
    setFileContent('');
    setValidationErrors([]);
    setReviewTransactions([]);
    setWarnings([]);
    setError(null);
    setSuccessMessage(null);
  };

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-bold">Import from JSON/YAML</h1>
        <a
          href="/import"
          className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm"
        >
          Import Documents (PDF/Images)
        </a>
      </div>

      {!reviewTransactions.length && (
        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {/* Info Section */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <div className="flex items-start">
              <svg
                className="h-5 w-5 text-blue-500 mt-0.5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <div className="flex-1">
                <h3 className="text-sm font-medium text-blue-800">Import Instructions</h3>
                <p className="text-sm text-blue-700 mt-1">
                  Upload a JSON or YAML file containing transaction data. You can use external AI tools
                  to parse documents and export the results in this format. The system will validate
                  the data and allow you to review before importing.
                </p>
                <button
                  onClick={() => setShowSchema(!showSchema)}
                  className="text-sm text-blue-600 hover:text-blue-800 mt-2 underline"
                >
                  {showSchema ? 'Hide' : 'Show'} Schema Documentation
                </button>
              </div>
            </div>
          </div>

          {/* Schema Documentation */}
          {showSchema && schema && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-gray-800 mb-2">Schema Documentation</h3>
              <div className="text-xs text-gray-700 space-y-2">
                <p className="font-medium">Required Fields:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code className="bg-gray-200 px-1 rounded">version</code>: Schema version (currently "1.0")</li>
                  <li><code className="bg-gray-200 px-1 rounded">transactions</code>: Array of transaction objects</li>
                </ul>
                <p className="font-medium mt-3">Transaction Fields:</p>
                <ul className="list-disc list-inside ml-2 space-y-1">
                  <li><code className="bg-gray-200 px-1 rounded">date</code>: YYYY-MM-DD format (required)</li>
                  <li><code className="bg-gray-200 px-1 rounded">amount</code>: Positive number (required)</li>
                  <li><code className="bg-gray-200 px-1 rounded">type</code>: "income", "expense", or "transfer" (required)</li>
                  <li><code className="bg-gray-200 px-1 rounded">description</code>: Transaction description (required)</li>
                  <li><code className="bg-gray-200 px-1 rounded">account</code>: Account name - must match existing account (required)</li>
                  <li><code className="bg-gray-200 px-1 rounded">category</code>: Category name (optional, will be created if not exists)</li>
                  <li><code className="bg-gray-200 px-1 rounded">notes</code>: Additional notes (optional)</li>
                  <li><code className="bg-gray-200 px-1 rounded">tags</code>: Array of tag names (optional)</li>
                  <li><code className="bg-gray-200 px-1 rounded">split</code>: Boolean for multi-category transactions (optional)</li>
                  <li><code className="bg-gray-200 px-1 rounded">items</code>: Array of line items for split transactions (required if split=true)</li>
                </ul>
                {schema.examples && (
                  <div className="mt-3">
                    <p className="font-medium">Example JSON:</p>
                    <pre className="bg-gray-800 text-gray-100 p-3 rounded mt-1 overflow-x-auto text-xs">
                      {JSON.stringify(schema.examples.json, null, 2)}
                    </pre>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* File Upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Upload File
            </label>
            <div className="flex items-center gap-4">
              <input
                type="file"
                accept=".json,.yaml,.yml"
                onChange={handleFileSelect}
                className="block w-full text-sm text-gray-500
                  file:mr-4 file:py-2 file:px-4
                  file:rounded-lg file:border-0
                  file:text-sm file:font-semibold
                  file:bg-blue-50 file:text-blue-700
                  hover:file:bg-blue-100
                  cursor-pointer"
              />
              {selectedFile && (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">
                    Format: <span className="font-medium uppercase">{format}</span>
                  </span>
                </div>
              )}
            </div>
            {selectedFile && (
              <p className="text-xs text-gray-500 mt-1">
                Selected: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
              </p>
            )}
          </div>

          {/* Action Buttons */}
          {selectedFile && (
            <div className="flex gap-3">
              <button
                onClick={handleValidate}
                disabled={isValidating || isParsing}
                className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isValidating ? 'Validating...' : 'Validate File'}
              </button>
              <button
                onClick={handleImport}
                disabled={isValidating || isParsing}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isParsing ? 'Processing...' : 'Import and Review'}
              </button>
              <button
                onClick={handleReset}
                disabled={isValidating || isParsing}
                className="px-6 py-2 bg-white border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Reset
              </button>
            </div>
          )}

          {/* Validation Errors */}
          {validationErrors.length > 0 && (
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
                <div className="flex-1">
                  <h3 className="text-sm font-medium text-red-800">Validation Errors</h3>
                  <ul className="text-sm text-red-700 mt-2 space-y-1">
                    {validationErrors.map((error, index) => (
                      <li key={index} className="flex items-start">
                        <span className="font-mono text-xs bg-red-100 px-2 py-0.5 rounded mr-2">
                          {error.field}
                        </span>
                        <span>{error.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* Error Display */}
          {error && !validationErrors.length && (
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

          {/* Success Message */}
          {successMessage && !reviewTransactions.length && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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
        </div>
      )}

      {/* Success Message After Import */}
      {successMessage && reviewTransactions.length === 0 && selectedFile && (
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
      {reviewTransactions.length > 0 && !successMessage && (
        <div className="mt-6">
          <ImportReview
            transactions={reviewTransactions}
            warnings={warnings}
            onApprove={handleApproveTransactions}
            onCancel={handleCancelReview}
            loading={isApproving}
          />
        </div>
      )}
    </div>
  );
};

export default ImportDataPage;
