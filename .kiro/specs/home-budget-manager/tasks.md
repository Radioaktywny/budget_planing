# Implementation Plan

- [x] 1. Set up project structure and initialize backend





  - Create backend directory with TypeScript, Express, and Prisma configuration
  - Initialize package.json with required dependencies (express, prisma, typescript, etc.)
  - Set up TypeScript configuration (tsconfig.json)
  - Create folder structure: src/routes, src/controllers, src/services, src/utils
  - Configure Prisma with SQLite datasource
  - Set up environment variables (.env file)
  - _Requirements: 19.1, 19.3_

- [x] 2. Implement database schema and migrations






  - Create Prisma schema file with all models (User, Account, Transaction, Category, Tag, Document, etc.)
  - Define enums (AccountType, TransactionType)
  - Set up relationships between models
  - Create initial migration for database schema
  - Seed database with default user and sample categories
  - _Requirements: 1.1, 2.1, 3.1, 9.1, 18.1, 19.1_

- [x] 3. Implement account management API




  - [x] 3.1 Create account service layer with business logic


    - Write functions for creating, updating, deleting accounts
    - Implement balance calculation logic
    - Add validation for account operations
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [x] 3.2 Create account routes and controllers


    - Implement GET /api/accounts endpoint
    - Implement POST /api/accounts endpoint
    - Implement PUT /api/accounts/:id endpoint
    - Implement DELETE /api/accounts/:id endpoint
    - Implement GET /api/accounts/:id/balance endpoint
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 3.3 Write unit tests for account service






    - Test account creation with valid and invalid data
    - Test account update operations
    - Test account deletion with and without transactions
    - Test balance calculation logic
    - Test duplicate name validation
    - _Requirements: 1.1, 1.2, 1.4_
  
  - [ ]* 3.4 Write integration tests for account API
    - Test all account endpoints (GET, POST, PUT, DELETE)
    - Test account balance endpoint
    - Test error responses (404, 409, 400)
    - Test validation errors
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_

- [x] 4. Implement basic transaction management




  - [x] 4.1 Create transaction service layer


    - Write functions for creating, updating, deleting transactions
    - Implement balance update logic when transactions are created/modified
    - Add validation for transaction data
    - _Requirements: 2.1, 2.4, 2.5, 4.1, 4.3_
  
  - [x] 4.2 Create transaction routes and controllers


    - Implement POST /api/transactions endpoint for creating transactions
    - Implement PUT /api/transactions/:id endpoint for editing
    - Implement DELETE /api/transactions/:id endpoint
    - Implement GET /api/transactions endpoint with basic filtering
    - _Requirements: 2.1, 2.2, 2.5, 4.1, 4.2_
  
  - [x] 4.3 Write unit tests for transaction service










    - Test transaction creation and balance updates
    - Test transaction update and deletion
    - Test validation logic
    - Test balance recalculation
    - _Requirements: 2.1, 2.4, 2.5, 4.1, 4.3_
  
  - [ ]* 4.4 Write integration tests for transaction API
    - Test all transaction endpoints
    - Test filtering and pagination
    - Test error responses
    - Test balance updates after transaction operations
    - _Requirements: 2.1, 2.2, 2.5, 4.1, 4.2_

- [x] 5. Implement transfer functionality




  - [x] 5.1 Create transfer service logic


    - Write function to create transfer between two accounts
    - Implement dual transaction creation (debit and credit)
    - Add validation to ensure both accounts exist and belong to user
    - Implement balance updates for both accounts
    - _Requirements: 3.1, 3.2, 3.5_
  


  - [ ] 5.2 Create transfer API endpoint
    - Implement POST /api/transactions/transfer endpoint
    - Add transfer display logic to transaction list endpoint
    - _Requirements: 3.1, 3.3, 3.4_
  
  - [x] 5.3 Write unit tests for transfer service






    - Test transfer creation between accounts
    - Test balance updates for both accounts
    - Test validation for invalid accounts
    - Test transfer deletion and balance rollback
    - _Requirements: 3.1, 3.2, 3.5_
  

  - [ ]* 5.4 Write integration tests for transfer API
    - Test transfer endpoint
    - Test transfer display in transaction list
    - Test error responses
    - _Requirements: 3.1, 3.3, 3.4_

- [x] 6. Implement split transaction support




  - [x] 6.1 Create split transaction service logic


    - Write function to create parent transaction with child items
    - Implement validation that child amounts sum to parent amount
    - Add logic to handle parent-child relationships
    - Implement cascade delete for parent transactions
    - _Requirements: 18.1, 18.2_
  
  - [x] 6.2 Create split transaction API endpoints


    - Implement POST /api/transactions/split endpoint
    - Implement GET /api/transactions/:id/items endpoint
    - Update transaction list endpoint to include split items
    - _Requirements: 18.1, 18.3, 18.4_
  
  - [x] 6.3 Write unit tests for split transaction service



    - Test split transaction creation
    - Test validation of child amounts sum
    - Test parent-child relationships
    - Test cascade delete
    - _Requirements: 18.1, 18.2_
  
  - [ ]* 6.4 Write integration tests for split transaction API
    - Test split transaction endpoints
    - Test split items retrieval
    - Test split transaction display in list
    - Test error responses
    - _Requirements: 18.1, 18.3, 18.4_

- [x] 7. Implement category management




  - [x] 7.1 Create category service layer


    - Write functions for creating, updating, deleting categories
    - Implement hierarchical category logic (parent-child)
    - Add validation for category operations
    - Implement category reassignment logic for deletion
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 7.2 Create category routes and controllers


    - Implement GET /api/categories endpoint
    - Implement POST /api/categories endpoint
    - Implement PUT /api/categories/:id endpoint
    - Implement DELETE /api/categories/:id endpoint with reassignment
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 7.3 Write unit tests for category service



    - Test category creation and hierarchy
    - Test category update operations
    - Test category deletion with reassignment
    - Test validation logic
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [ ]* 7.4 Write integration tests for category API
    - Test all category endpoints
    - Test hierarchical category retrieval
    - Test reassignment during deletion
    - Test error responses
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_

- [-] 8. Implement tag management



  - [x] 8.1 Create tag service layer


    - Write functions for creating and deleting tags
    - Implement tag-transaction association logic
    - Add tag usage count calculation
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [x] 8.2 Create tag routes and controllers


    - Implement GET /api/tags endpoint with usage counts
    - Implement POST /api/tags endpoint
    - Implement DELETE /api/tags/:id endpoint
    - Update transaction endpoints to handle tag associations
    - _Requirements: 10.1, 10.2, 10.3, 10.4_
  
  - [ ] 8.3 Write unit tests for tag service

    - Test tag creation and deletion
    - Test tag-transaction associations
    - Test usage count calculation
    - _Requirements: 10.1, 10.2, 10.5_
  
  - [ ]* 8.4 Write integration tests for tag API
    - Test all tag endpoints
    - Test tag associations with transactions
    - Test usage counts in responses
    - Test error responses
    - _Requirements: 10.1, 10.2, 10.3, 10.4_


- [x] 9. Implement file upload and document storage






  - [x] 9.1 Set up file storage infrastructure


    - Configure Multer for file uploads
    - Create uploads directory structure
    - Implement file naming with unique IDs
    - Add file type and size validation
    - _Requirements: 5.1, 5.4, 6.1, 6.3, 16.1_
  
  - [x] 9.2 Create document routes and controllers


    - Implement POST /api/documents/upload endpoint
    - Implement GET /api/documents/:id endpoint for download
    - Implement GET /api/documents/:id/transactions endpoint
    - Add document metadata storage in database
    - _Requirements: 5.4, 5.5, 6.3, 6.4, 16.1, 16.2, 16.3, 16.4_
  
  - [x] 9.3 Write unit tests for document service



    - Test file validation logic
    - Test document metadata storage
    - Test file naming and path generation
    - _Requirements: 5.1, 5.4, 6.1, 6.3, 16.1_
  
  - [ ]* 9.4 Write integration tests for document API
    - Test file upload endpoint
    - Test file download endpoint
    - Test document-transaction associations
    - Test file type and size validation



    - _Requirements: 5.4, 5.5, 6.3, 6.4, 16.1, 16.2, 16.3, 16.4_

- [x] 10. Set up Python AI service foundation





  - [x] 10.1 Initialize Python project structure


    - Create Python virtual environment
    - Set up Flask or FastAPI for REST API
    - Create requirements.txt with dependencies (tesseract, pypdf2, scikit-learn)
    - Create folder structure for parsers and models
    - _Requirements: 5.2, 6.2_
  
  - [x] 10.2 Implement basic PDF parsing


    - Write PDF text extraction using PyPDF2 or pdfplumber
    - Implement basic transaction pattern recognition
    - Create endpoint POST /parse/pdf
    - Return structured transaction data
    - _Requirements: 5.1, 5.2, 5.3_
  
  - [x] 10.3 Implement receipt OCR parsing


    - Set up Tesseract OCR
    - Write image preprocessing functions
    - Implement text extraction from receipt images
    - Create endpoint POST /parse/receipt
    - Extract date, items, and amounts from receipt text
    - _Requirements: 6.1, 6.2, 6.5_
  
  - [x] 10.4 Write unit tests for PDF parsing






    - Test PDF text extraction
    - Test transaction pattern recognition
    - Test structured data output
    - _Requirements: 5.1, 5.2, 5.3_
  
    - _Requirements: 6.1, 6.2, 6.5_
CR parsing
    - Test image preprocessing
    - Test text extraction
    - Test data extraction from receipt text
    - _Requirements: 6.1, 6.2, 6.5_


- [x] 11. Implement document parsing integration






  - [x] 11.1 Create document parsing service in backend


    - Write service to call Python AI service endpoints
    - Implement error handling and fallback logic
    - Add timeout handling for AI service calls
    - Create pending transaction storage logic
    - _Requirements: 5.2, 5.3, 5.5, 6.2, 6.4_
  
  - [x] 11.2 Create document parsing API endpoint


    - Implement POST /api/documents/parse endpoint
    - Integrate with Python AI service
    - Store parsed transactions as pending
    - Return parsed data for review interface
    - _Requirements: 5.2, 5.3, 6.2, 7.1_
  
  - [x] 11.3 Write unit tests for parsing service



    - Test AI service integration
    - Test error handling and fallback logic
    - Test timeout handling
    - Test pending transaction storage
    - _Requirements: 5.2, 5.3, 6.2, 7.1_

  - _Requirements: 5.2, 5.3, 5.5, 6.2, 6.4_p
  
  - [ ]* 11.4 Write integration tests for parsing API
    - Test document parsing endpoint
    - Test integration with Python service
    - Test error responses
    - _Requirements: 5.2, 5.3, 6.2, 7.1_

- [x] 12. Implement AI categorization system





  - [x] 12.1 Create categorization model in Python service


    - Implement simple pattern matching for categorization
    - Create endpoint POST /categorize
    - Return category suggestion with confidence score
    - _Requirements: 8.1, 8.3_
  
  - [x] 12.2 Implement categorization learning


    - Create CategorizationRule storage logic
    - Implement learning from user corrections
    - Create endpoint POST /train for model updates
    - Update pattern matching based on learned rules
    - _Requirements: 8.2, 8.3_
  
  - [x] 12.3 Integrate categorization into backend


    - Create AI service in backend to call Python endpoints
    - Implement POST /api/ai/suggest-category endpoint
    - Implement POST /api/ai/learn endpoint
    - Add automatic categorization to transaction creation
    - _Requirements: 8.1, 8.2, 8.4, 8.5_
  
  - [x] 12.4 Write unit tests for categorization model






    - Test pattern matching logic
    - Test confidence score calculation
    -e_Rsqu  eme : 8.1, 8.2, 8.4,8.5_

    -e_Rsqu  eme : 8.1, 8.2, 8.4,8.5_

  
  - [ ]* 12.5 Write integration tests for categorization API
    - Test categorization endpoints
    - Test learning endpoint
    - Test automatic categorization
    - Test error responses
    - _Requirements: 8.1, 8.2, 8.4, 8.5_

- [x] 13. Implement JSON/YAML import functionality






  - [x] 13.1 Create import validation service


    - Write JSON schema validator
    - Write YAML parser and validator
    - Implement account name matching logic
    - Add split transaction validation
    - _Requirements: 7.2, 7.3_
  


  - [x] 13.2 Create import API endpoints




    - Implement POST /api/import/json endpoint
    - Implement POST /api/import/yaml endpoint
    - Implement GET /api/import/schema endpoint
    - Implement POST /api/import/validate endpoint
    - Return parsed transactions for review interface


    - _Requirements: 7.1, 7.2, 7.3_
  
  - [x] 13.3 Write unit tests for import validation

    - Test JSON schema validation
    - Test YAML parsing and validation
    - Test account name matching
    - Test split transaction validation

  
  - _Requirements: 7.2, 7.3_
  
  - [ ]* 13.4 Write integration tests for import API
    - Test JSON import endpoint
    - Test YAML import endpoint
    - Test schema endpoint
    - Test validation endpoint
    - Test error responses
    - _Requirements: 7.1, 7.2, 7.3_


- [x] 14. Implement transaction import review interface backend





  - [x] 14.1 Create import review service


    - Create pending transaction storage and retrieval
    - Implement bulk transaction approval endpoint
    - Add individual transaction rejection logic
    - Implement transaction editing before approval
    - Create POST /api/transactions/bulk endpoint
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 14.2 Write unit tests for import review service



    - Test pending transaction storage

    - Test udiapng befpreoapprovav
ogic
    - Test rejection logic
    - Test editing before approval
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [x] 14.3 Write integration tests for import review API





    - Test bulk transaction endpoint
    - Test approval and rejection flows
    - Test editing functionality
    - Test error responses
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_

- [x] 15. Implement advanced transaction filtering and search





  - [x] 15.1 Enhance transaction query service


    - Add date range filtering logic
    - Implement account filtering
    - Add category filtering with hierarchy support
    - Implement tag filtering (multiple tags)
    - Add text search on description
    - _Requirements: 14.2, 14.4_
  
  - [x] 15.2 Update transaction list endpoint


    - Enhance GET /api/transactions with query parameters
    - Implement sorting by any column
    - Add pagination support
    - Return transaction count and totals
    - _Requirements: 14.1, 14.2, 14.3, 14.5_
  
  - [x] 15.3 Write unit tests for filtering service




    - Test date range filtering
    - Test account and category filtering
    - Test tag filtering
    - Test text search
    - Test sorting and pagination
    - _Requirements: 14.2, 14.4_
  
  - [ ]* 15.4 Write integration tests for filtering API
    - Test all filter combinations
    - Test sorting options
    - Test pagination
    - Test count and totals
    - _Requirements: 14.1, 14.2, 14.3, 14.5_

- [x] 16. Implement reporting and analytics services






  - [x] 16.1 Create report calculation services


    - Write function to calculate monthly summary (income, expenses, net balance)
    - Implement category breakdown calculation
    - Add net balance over time calculation
    - Exclude transfers from income/expense calculations
    - Handle split transactions in category breakdowns
    - _Requirements: 11.2, 12.1, 12.5, 13.1, 13.3, 18.5_
  
  - [x] 16.2 Create report API endpoints


    - Implement GET /api/reports/summary endpoint
    - Implement GET /api/reports/category-breakdown endpoint
    - Implement GET /api/reports/net-balance endpoint
    - Add date range parameters to all endpoints
    - _Requirements: 11.2, 12.1, 12.4, 13.1, 13.4_
    - Test monthly summary calculations

    - Test monthly summary calculations
  - [x] 16.3 Write unit tests for report calculations



    - Test monthly summary calculations
    - Test category breakdown logic
    - Test net balance over time
    - Test transfer exclusion
    - Test split transaction handling
    - _Requirements: 11.2, 12.1, 12.5, 13.1, 13.3, 18.5_
  
  - [ ]* 16.4 Write integration tests for report API
    - Test all report endpoints
    - Test date range filtering
    - Test data accuracy
    - Test error responses
    - _Requirements: 11.2, 12.1, 12.4, 13.1, 13.4_

- [x] 17. Implement PDF report generation







  - [x] 17.1 Set up PDF generation library

    - Install and configure PDFKit or Puppeteer
    - Create PDF template structure
    - Implement chart rendering for PDF
    - _Requirements: 15.1, 15.3_
  


  - [x] 17.2 Create PDF export endpoint
    - Implement POST /api/reports/export/pdf endpoint
    - Generate PDF with summary data
    - Include category breakdown table
    - Include transaction list

    - Add charts to PDF

    - Return PDF file for download
    - _Requirements: 15.1, 15.2, 15.3, 15.5_

  
  - [x] 17.3 Write unit tests for PDF generation


    - Test PDF template rendering
    - Test chart rendering
    - Test data formatting
    - _Requirements: 15.1, 15.3_
  
  - [ ]* 17.4 Write integration tests for PDF export
    - Test PDF export endpoint
    - Test PDF content accuracy
    - Test file download
    - Test error responses
    - _Requirements: 15.1, 15.2, 15.3, 15.5_

- [x] 18. Implement Excel report generation







  - [x] 18.1 Set up Excel generation library

    - Install and configure ExcelJS
    - Create Excel template structure with multiple sheets
    - _Requirements: 15.2_
  

  - [x] 18.2 Create Excel export endpoint

    - Implement POST /api/reports/export/excel endpoint
    - Create Summary sheet with tota
ls and breakdown
    - Reeurn ExTraaftlenfsetdownloit
all transaction data
    - Create Category Breakdown sheet
    - Format cells with proper headers and styling
    - Return Excel file for download
    - _Requirements: 15.2, 15.4, 15.5_
  

  - [x] 18.3 Write unit tests for Excel generation


    - Test Excel template creation
    - Test sheet generation
    - Test data formatting
    - _Requirements: 15.2_
  
  - [ ]* 18.4 Write integration tests for Excel export
    - Test Excel export endpoint
    - Test file content accuracy
    - Test file download
    - Test error responses
    - _Requirements: 15.2, 15.4, 15.5_

- [x] 19. Initialize React frontend project






  - Create React app with TypeScript template
  - Install dependencies (react-router-dom, axios, tailwindcss, chart.js/recharts)
  - Set up Tailwind CSS configuration
  - Create folder structure: src/pages, src/components, src/services, src/utils, src/types
  - Configure API base URL and axios instance
  - Set up React Router with route definitions
  - _Requirements: 17.1, 17.5_

- [x] 20. Implement frontend API service layer





  - Create TypeScript interfaces for all data models
  - Write API service functions for accounts (CRUD operations)
  - Write API service functions for transactions (CRUD, filters)
  - Write API service functions for categories and tags
  - Write API service functions for documents and imports
  - Write API service functions for reports
  - Add error handling and response typing
  - _Requirements: All API-related requirements_

- [x] 21. Implement account management UI




  - [x] 21.1 Create AccountsPage component


    - Display list of accounts with balances
    - Add account creation form
    - Implement account editing modal
    - Add account deletion with confirmation
    - _Requirements: 1.1, 1.2, 1.3, 1.4, 1.5_
  
  - [x] 21.2 Create AccountSelector component


    - Build dropdown component for account selection
    - Add account type icons
    - Use in transaction forms
    - _Requirements: 2.1_

- [x] 22. Implement transaction form components




  - [x] 22.1 Create TransactionForm component


    - Build form with date, amount, type, description, account, category fields
    - Add form validation
    - Implement category selector integration
    - Add tag input integration
    - Support both create and edit modes
    - _Requirements: 2.1, 2.2, 2.4, 4.1_
  
  - [x] 22.2 Create split transaction form


    - Add UI to create parent transaction with child items
    - Implement dynamic item addition/removal
    - Add validation for sum of items equals parent
    - Allow different categories for each item
    - _Requirements: 18.1, 18.2, 18.3_
  
  - [x] 22.3 Create transfer form


    - Build form for transfer between accounts
    - Add from/to account selectors
    - Implement amount and date fields
    - _Requirements: 3.1, 3.2_

- [x] 23. Implement transaction list and filtering UI





  - [x] 23.1 Create TransactionTable component


    - Display transactions in sortable table
    - Show columns: date, description, category, amount, account
    - Add expand/collapse for split transactions
    - Implement row actions (edit, delete)
    - Show document icon for transactions with attachments
    - _Requirements: 14.1, 14.3, 16.5, 18.4_
  
  - [x] 23.2 Create transaction filter controls


    - Add date range picker
    - Add account filter dropdown
    - Add category filter with hierarchy
    - Add tag filter with multi-select
    - Add search input for description
    - Display filtered totals
    - _Requirements: 14.2, 14.4, 14.5_
  
  - [x] 23.3 Create TransactionsPage



    - Integrate TransactionTable and filters
    - Add "Add Transaction" button
    - Implement pagination
    - Wire up API calls
    - _Requirements: 14.1, 14.2, 14.3, 14.4, 14.5_

- [x] 24. Implement category and tag management UI





  - [x] 24.1 Create CategoriesPage component


    - Display hierarchical category tree
    - Add category creation form
    - Implement category editing
    - Add category deletion with reassignment UI
    - Show category colors
    - _Requirements: 9.1, 9.2, 9.3, 9.4, 9.5_
  
  - [x] 24.2 Create CategorySelector component


    - Build hierarchical category picker
    - Show parent-child relationships
    - Add "Create new category" option
    - _Requirements: 9.2_
  
  - [x] 24.3 Create TagInput component


    - Build multi-tag input with autocomplete
    - Show existing tags as suggestions
    - Allow creating new tags inline
    - Display selected tags as chips
    - _Requirements: 10.1, 10.2, 10.3_

- [x] 25. Implement file upload and document UI




  - [x] 25.1 Create FileUpload component


    - Build drag-and-drop upload area
    - Add file type validation (PDF, JPEG, PNG)
    - Show upload progress
    - Display file preview
    - _Requirements: 5.1, 6.1_
  
  - [x] 25.2 Create ImportPage component


    - Integrate FileUpload component
    - Add document type selection (bank statement vs receipt)
    - Show parsing status
    - Display import review interface after parsing
    - _Requirements: 5.1, 6.1, 7.1_
  
  - [x] 25.3 Create document viewer


    - Add modal to view linked documents
    - Support PDF and image display
    - Add download button
    - Show document metadata
    - _Requirements: 16.3, 16.4_

- [ ] 26. Implement import review interface
  - [ ] 26.1 Create ImportReview component
    - Display parsed transactions in editable table
    - Allow editing category, amount, date, description
    - Add checkbox to select/deselect transactions
    - Show category suggestions
    - Add "Approve All" and "Approve Selected" buttons
    - _Requirements: 7.1, 7.2, 7.3, 7.4, 7.5_
  
  - [ ] 26.2 Add split transaction support in review
    - Allow splitting single transaction into multiple items
    - Show split transaction UI in review table
    - Validate item amounts sum to total
    - _Requirements: 18.1, 18.2_

- [ ] 27. Implement JSON/YAML import UI
  - Create ImportDataPage component
  - Add file upload for JSON/YAML files
  - Show schema documentation
  - Display validation errors
  - Integrate with ImportReview component
  - _Requirements: 7.1, 7.2, 7.3_

- [ ] 28. Implement dashboard and charts
  - [ ] 28.1 Create chart components
    - Create PieChart component for category breakdown
    - Create BarChart component for monthly comparison
    - Create LineChart component for net balance trend
    - Add responsive sizing
    - _Requirements: 11.3, 12.1, 12.2, 13.2_
  
  - [ ] 28.2 Create DashboardPage component
    - Display total balance across all accounts
    - Show current month income, expenses, net balance
    - Add expense breakdown pie chart
    - Display recent transactions (last 10)
    - Add quick action buttons (Add Transaction, Upload Document)
    - _Requirements: 11.1, 11.2, 11.3, 11.4, 11.5_

- [ ] 29. Implement reports page and visualization
  - [ ] 29.1 Create ReportsPage component
    - Add date range selector
    - Display summary cards (income, expenses, net balance)
    - Show category breakdown chart
    - Display net balance trend chart
    - Add month comparison bar chart
    - _Requirements: 12.1, 12.2, 12.3, 12.4, 13.1, 13.2, 13.5_
  
  - [ ] 29.2 Add export functionality
    - Add "Export PDF" button
    - Add "Export Excel" button
    - Show export progress
    - Trigger file download
    - _Requirements: 15.1, 15.2, 15.5_

- [ ] 30. Implement responsive design and mobile optimization
  - [ ] 30.1 Add responsive layouts
    - Implement mobile navigation menu
    - Make tables responsive with horizontal scroll
    - Adjust chart sizes for mobile
    - Optimize forms for touch input
    - _Requirements: 17.1, 17.2, 17.3, 17.4_
  
  - [ ] 30.2 Test cross-browser compatibility
    - Test on Chrome, Firefox, Safari, Edge
    - Fix any browser-specific issues
    - Ensure consistent styling
    - _Requirements: 17.5_

- [ ] 31. Implement error handling and loading states
  - Add error boundary components
  - Create toast notification system
  - Add loading spinners for async operations
  - Implement retry logic for failed requests
  - Show user-friendly error messages
  - _Requirements: All requirements (error handling)_

- [ ] 32. Add user context and authentication preparation
  - Create default user in database
  - Add user context to all API calls
  - Implement user ID association in services
  - Document authentication integration points
  - Add placeholder for auth middleware
  - _Requirements: 19.1, 19.2, 19.3, 19.4, 19.5_

- [ ] 33. Create seed data and sample content
  - Create database seed script
  - Add sample accounts (checking, savings, credit card, cash)
  - Add sample categories (Food, Transport, Housing, etc.)
  - Add sample transactions for testing
  - Add sample tags
  - _Requirements: All requirements (for testing)_

- [ ] 34. Set up development environment and documentation
  - Create README with setup instructions
  - Document API endpoints
  - Add environment variable documentation
  - Create development startup scripts
  - Document database migration process
  - Add JSON/YAML import schema documentation
  - _Requirements: 19.5_
