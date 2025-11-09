import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import {
  DashboardPage,
  TransactionsPage,
  AccountsPage,
  CategoriesPage,
  ReportsPage,
  ImportPage,
} from './pages';

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<DashboardPage />} />
          <Route path="transactions" element={<TransactionsPage />} />
          <Route path="accounts" element={<AccountsPage />} />
          <Route path="categories" element={<CategoriesPage />} />
          <Route path="reports" element={<ReportsPage />} />
          <Route path="import" element={<ImportPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
};

export default App;
