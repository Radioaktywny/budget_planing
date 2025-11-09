import { Router } from 'express';
import * as reportController from '../controllers/reportController';

const router = Router();

// GET /api/reports/summary - Get monthly summary
router.get('/summary', reportController.getMonthlySummary);

// GET /api/reports/category-breakdown - Get category breakdown
router.get('/category-breakdown', reportController.getCategoryBreakdown);

// GET /api/reports/net-balance - Get net balance over time
router.get('/net-balance', reportController.getNetBalanceOverTime);

// GET /api/reports/comprehensive - Get comprehensive report
router.get('/comprehensive', reportController.getComprehensiveReport);

// POST /api/reports/export/pdf - Export PDF report
router.post('/export/pdf', reportController.exportPDFReport);

// POST /api/reports/export/excel - Export Excel report
router.post('/export/excel', reportController.exportExcelReport);

export default router;
