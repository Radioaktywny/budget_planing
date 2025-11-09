# Home Budget Manager

A comprehensive web-based application for managing personal finances across multiple accounts with AI-powered document parsing and intelligent categorization.

## Features

- **Multi-Account Management**: Track checking, savings, credit cards, and cash accounts
- **Smart Transaction Entry**: Manual entry with AI-powered category suggestions
- **Document Parsing**: Upload bank statements (PDF) and receipts (images) for automatic transaction extraction
- **Transfer Tracking**: Distinguish transfers between your accounts from income/expenses
- **Split Transactions**: Break down receipts with multiple categories into line items
- **Custom Categories**: Create hierarchical categories that match your lifestyle
- **Flexible Tagging**: Add multiple tags to transactions for cross-dimensional analysis
- **Visual Reports**: Interactive charts showing spending patterns and trends
- **Export Reports**: Generate PDF and Excel reports for any time period
- **JSON/YAML Import**: Bulk import transactions from external tools or manual files
- **Responsive Design**: Works seamlessly on desktop, tablet, and mobile devices

## Technology Stack

### Frontend
- React 19 with TypeScript
- Tailwind CSS for styling
- Recharts for data visualization
- React Router for navigation
- Axios for API communication

### Backend
- Node.js with Express
- TypeScript for type safety
- Prisma ORM with SQLite (development) / PostgreSQL (production)
- Multer for file uploads
- PDFKit for PDF generation
- ExcelJS for Excel exports

### AI Service
- Python with FastAPI
- Tesseract OCR for receipt parsing
- PyPDF2/pdfplumber for PDF parsing
- Pattern-based categorization with learning

## Quick Start

**New to the project?** See the [Getting Started Guide](docs/GETTING_STARTED.md) for detailed setup instructions.

### Prerequisites

- Node.js 16+ and npm
- Python 3.9+
- Tesseract OCR (for receipt parsing)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd home-budget-manager
   ```

2. **Set up the Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   npm run prisma:generate
   npm run prisma:migrate
   npm run prisma:seed
   ```

3. **Set up the Frontend**
   ```bash
   cd ../frontend
   npm install
   cp .env.example .env
   ```

4. **Set up the AI Service**
   ```bash
   cd ../ai-service
   python -m venv venv
   
   # Windows
   venv\Scripts\activate
   
   # macOS/Linux
   source venv/bin/activate
   
   pip install -r requirements.txt
   cp .env.example .env
   ```
   
   Install Tesseract OCR:
   - **Windows**: Download from [GitHub](https://github.com/UB-Mannheim/tesseract/wiki)
   - **macOS**: `brew install tesseract`
   - **Linux**: `sudo apt-get install tesseract-ocr`

### Running the Application

You need to start all three services in separate terminals:

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev
# Or use: start.bat (Windows) / ./start.sh (macOS/Linux)
```
Backend runs on http://localhost:3001

**Terminal 2 - Frontend:**
```bash
cd frontend
npm start
# Or use: start.bat (Windows) / ./start.sh (macOS/Linux)
```
Frontend runs on http://localhost:3000

**Terminal 3 - AI Service:**
```bash
cd ai-service
# Activate venv first (see above)
python main.py
# Or use: start.bat (Windows) / ./start.sh (macOS/Linux)
```
AI Service runs on http://localhost:8001

**Visit http://localhost:3000 to start using the application!**

## Project Structure

```
home-budget-manager/
├── backend/              # Express API server
│   ├── prisma/          # Database schema and migrations
│   ├── src/
│   │   ├── controllers/ # Request handlers
│   │   ├── routes/      # API route definitions
│   │   ├── services/    # Business logic
│   │   ├── middleware/  # Express middleware
│   │   └── utils/       # Utility functions
│   ├── uploads/         # File storage
│   └── dev.db          # SQLite database (generated)
│
├── frontend/            # React application
│   ├── public/         # Static assets
│   └── src/
│       ├── components/ # Reusable UI components
│       ├── pages/      # Page components
│       ├── services/   # API service layer
│       ├── contexts/   # React contexts
│       ├── hooks/      # Custom React hooks
│       ├── types/      # TypeScript definitions
│       └── utils/      # Utility functions
│
└── ai-service/         # Python AI microservice
    ├── routers/        # FastAPI routers
    ├── parsers/        # Document parsing logic
    ├── models/         # ML models and database
    ├── tests/          # Python tests
    └── utils/          # Utility functions
```

## Documentation

### Getting Started
- **[Getting Started Guide](docs/GETTING_STARTED.md)** - Complete setup walkthrough for new users
- [Backend README](backend/README.md) - Backend setup and development
- [Frontend README](frontend/README.md) - Frontend setup and development
- [AI Service README](ai-service/README.md) - AI service setup and endpoints
- [AI Service Setup Guide](ai-service/SETUP.md) - Detailed AI service installation

### API & Configuration
- **[API Documentation](docs/API.md)** - Complete API endpoint reference
- **[Environment Variables](docs/ENVIRONMENT.md)** - Configuration guide for all services
- **[Database Guide](docs/DATABASE.md)** - Database schema, migrations, and management

### Features & Usage
- [Import Guide](frontend/public/IMPORT_GUIDE.md) - JSON/YAML import format and examples
- [Error Handling](frontend/ERROR_HANDLING.md) - Frontend error handling patterns
- [Responsive Design](frontend/RESPONSIVE_DESIGN.md) - Mobile optimization guide
- [Browser Compatibility](frontend/BROWSER_COMPATIBILITY.md) - Browser support info

### Advanced Topics
- [Authentication Integration](backend/AUTHENTICATION_INTEGRATION.md) - Future multi-user auth setup

## Development

### Running Tests

**Backend:**
```bash
cd backend
npm test                 # Run all tests
npm run test:watch      # Watch mode
npm run test:coverage   # With coverage
```

**Frontend:**
```bash
cd frontend
npm test                # Run all tests
```

**AI Service:**
```bash
cd ai-service
# Activate venv first
pytest                  # Run all tests
pytest -v              # Verbose output
```

### Database Management

**View database in GUI:**
```bash
cd backend
npm run prisma:studio
```

**Create a new migration:**
```bash
cd backend
npm run prisma:migrate
```

**Reset database:**
```bash
cd backend
npx prisma migrate reset
npm run prisma:seed
```

### Building for Production

**Backend:**
```bash
cd backend
npm run build
npm start
```

**Frontend:**
```bash
cd frontend
npm run build
# Serve the build folder with a static server
```

## Usage Guide

### Getting Started

1. **Create Accounts**: Start by adding your bank accounts (checking, savings, credit cards, cash)
2. **Set Up Categories**: Customize categories to match your spending habits
3. **Add Transactions**: 
   - Manually enter transactions
   - Upload bank statements (PDF)
   - Upload receipts (photos)
   - Import from JSON/YAML files
4. **Review Imports**: Approve and edit automatically parsed transactions
5. **View Reports**: Check your dashboard and reports for insights

### Importing Transactions

#### From Bank Statements (PDF)
1. Go to Import page
2. Upload your bank statement PDF
3. Wait for AI parsing
4. Review and approve transactions

#### From Receipts (Photos)
1. Go to Import page
2. Upload receipt photo (JPEG/PNG)
3. AI extracts date, items, and amounts
4. Review and approve

#### From JSON/YAML Files
1. Go to Import → Import from JSON/YAML
2. Upload your file (see [Import Guide](frontend/public/IMPORT_GUIDE.md))
3. Review parsed transactions
4. Approve to import

### Split Transactions

For receipts with multiple categories:
1. Create or import a transaction
2. Click "Split Transaction"
3. Add line items with different categories
4. Ensure items sum to total amount
5. Save

### Generating Reports

1. Go to Reports page
2. Select date range
3. View charts and summaries
4. Export as PDF or Excel

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Ensure database migrations are run: `npm run prisma:migrate`
- Verify `.env` file exists

### Frontend can't connect to backend
- Ensure backend is running on port 3001
- Check `REACT_APP_API_BASE_URL` in frontend `.env`
- Verify CORS is enabled in backend

### AI Service errors
- Verify Tesseract is installed: `tesseract --version`
- Check `TESSERACT_CMD` path in `.env` (Windows)
- Ensure Python dependencies are installed
- Check if port 8001 is available

### Document parsing fails
- Verify AI service is running
- Check file format (PDF, JPEG, PNG only)
- Ensure file size is under 10MB
- Check AI service logs for errors

### Database issues
- Reset database: `npx prisma migrate reset`
- Regenerate client: `npm run prisma:generate`
- Check SQLite file permissions

## Contributing

This is a personal finance management application. Contributions are welcome!

### Development Workflow

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Ensure all tests pass
5. Update documentation
6. Submit a pull request

### Code Style

- **TypeScript**: Follow existing patterns, use strict typing
- **React**: Functional components with hooks
- **Python**: Follow PEP 8 style guide
- **Testing**: Write tests for new features

## Architecture

The application follows a microservices architecture:

```
┌─────────────┐
│   Browser   │
│   (React)   │
└──────┬──────┘
       │ HTTP/REST
┌──────▼──────┐      ┌──────────────┐
│   Express   │◄────►│   Python     │
│   Backend   │ HTTP │ AI Service   │
└──────┬──────┘      └──────────────┘
       │
   ┌───┴───┐
   │       │
┌──▼──┐ ┌─▼────┐
│ DB  │ │ Files│
└─────┘ └──────┘
```

- **Frontend**: React SPA communicates with backend via REST API
- **Backend**: Express server handles business logic, database, and file storage
- **AI Service**: Python microservice for document parsing and categorization
- **Database**: SQLite (dev) or PostgreSQL (prod) via Prisma ORM
- **Storage**: Local filesystem for uploaded documents

## Future Enhancements

- [ ] Multi-user authentication with JWT
- [ ] Recurring transaction templates
- [ ] Budget goals and alerts
- [ ] Multi-currency support
- [ ] Bank API integration (Plaid, Teller)
- [ ] Mobile app (React Native)
- [ ] Real-time notifications
- [ ] Cloud storage integration (S3)
- [ ] Advanced ML categorization models
- [ ] Predictive budgeting

## License

This project is for personal use. See LICENSE file for details.

## Support

For issues, questions, or feature requests, please open an issue on the repository.

---

**Built with ❤️ for better personal finance management**
