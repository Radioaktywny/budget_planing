import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/ToastContainer';
import { ToastProvider } from './contexts/ToastContext';
import {
  DashboardPage,
  TransactionsPage,
  AccountsPage,
  CategoriesPage,
  ReportsPage,
  ImportPage,
  ImportDataPage,
} from './pages';

const App: React.FC = () => {
  return (
    <ErrorBoundary>
      <ToastProvider>
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Layout />}>
              <Route index element={<DashboardPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="accounts" element={<AccountsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="reports" element={<ReportsPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="import-data" element={<ImportDataPage />} />
            </Route>
          </Routes>
          <ToastContainer />
        </BrowserRouter>
      </ToastProvider>
    </ErrorBoundary>
  );
};

export default App;
