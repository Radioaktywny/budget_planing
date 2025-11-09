# Home Budget Manager - Frontend

React-based frontend application for the Home Budget Manager.

## Technology Stack

- **React** with TypeScript
- **React Router** for navigation
- **Axios** for API communication
- **Tailwind CSS** for styling
- **Recharts** for data visualization

## Project Structure

```
src/
├── components/     # Reusable UI components
├── pages/          # Page components (routes)
├── services/       # API service layer
├── types/          # TypeScript type definitions
├── utils/          # Utility functions
└── App.tsx         # Main application component
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Update the API base URL in `.env` if needed:
```
REACT_APP_API_BASE_URL=http://localhost:3001/api
```

### Development

Start the development server:
```bash
npm start
```

The application will open at [http://localhost:3000](http://localhost:3000).

### Build

Create a production build:
```bash
npm run build
```

The build files will be in the `build/` directory.

### Testing

Run tests:
```bash
npm test
```

## API Configuration

The frontend communicates with the backend API through the axios client configured in `src/services/api.ts`. The base URL is set via the `REACT_APP_API_BASE_URL` environment variable.

## Available Routes

- `/` - Dashboard
- `/transactions` - Transaction list and management
- `/accounts` - Account management
- `/categories` - Category management
- `/reports` - Reports and analytics
- `/import` - Document import

## Features

### Implemented

- Project structure and configuration
- API service layer with typed interfaces
- React Router setup with navigation
- Basic page components
- Utility functions for formatting and validation
- Tailwind CSS configuration

### To Be Implemented

- Account management UI
- Transaction forms and list
- Category and tag management
- Document upload and parsing
- Reports and charts
- Import review interface
- Responsive design
- Error handling and notifications

## Development Guidelines

### Adding New Pages

1. Create a new component in `src/pages/`
2. Export it from `src/pages/index.ts`
3. Add a route in `src/App.tsx`
4. Add navigation link in `src/components/Layout.tsx`

### Adding New API Services

1. Create a new service file in `src/services/`
2. Define the service methods using the `apiClient`
3. Export the service from `src/services/index.ts`
4. Use the service in components

### Type Definitions

All TypeScript types are defined in `src/types/index.ts`. Update this file when adding new data models or API interfaces.

## Troubleshooting

### API Connection Issues

If you see network errors:
1. Ensure the backend server is running on port 3001
2. Check the `REACT_APP_API_BASE_URL` in `.env`
3. Verify CORS is configured correctly in the backend

### Build Issues

If you encounter build errors:
1. Delete `node_modules` and `package-lock.json`
2. Run `npm install` again
3. Clear the cache: `npm cache clean --force`

## License

This project is part of the Home Budget Manager application.
