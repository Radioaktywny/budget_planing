import PDFDocument from 'pdfkit';
import {
  MonthlySummary,
  CategoryBreakdown,
  NetBalancePoint,
} from './reportService';

interface PDFReportData {
  summary: MonthlySummary[];
  expenseBreakdown: CategoryBreakdown[];
  incomeBreakdown: CategoryBreakdown[];
  netBalanceTrend: NetBalancePoint[];
  totals: {
    totalIncome: number;
    totalExpenses: number;
    totalNetBalance: number;
    totalTransactions: number;
  };
  dateRange: {
    startDate: string;
    endDate: string;
  };
}

/**
 * Generate a PDF report from report data
 * Returns a buffer containing the PDF
 */
export async function generatePDFReport(data: PDFReportData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50, size: 'A4' });
      const chunks: Buffer[] = [];

      // Collect PDF data
      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Generate PDF content
      addHeader(doc, data.dateRange);
      addSummarySection(doc, data.totals);
      addMonthlySummaryTable(doc, data.summary);
      addCategoryBreakdownSection(doc, data.expenseBreakdown, 'Expense');
      addCategoryBreakdownSection(doc, data.incomeBreakdown, 'Income');
      addNetBalanceChart(doc, data.netBalanceTrend);

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}

/**
 * Add header to PDF
 */
function addHeader(doc: PDFKit.PDFDocument, dateRange: { startDate: string; endDate: string }): void {
  doc
    .fontSize(24)
    .font('Helvetica-Bold')
    .text('Budget Report', { align: 'center' });

  doc
    .fontSize(12)
    .font('Helvetica')
    .text(`Period: ${dateRange.startDate} to ${dateRange.endDate}`, { align: 'center' })
    .moveDown(2);
}

/**
 * Add summary section with totals
 */
function addSummarySection(
  doc: PDFKit.PDFDocument,
  totals: {
    totalIncome: number;
    totalExpenses: number;
    totalNetBalance: number;
    totalTransactions: number;
  }
): void {
  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Summary', { underline: true })
    .moveDown(0.5);

  const startY = doc.y;
  const boxWidth = 120;
  const boxHeight = 80;
  const spacing = 20;

  // Income box
  drawSummaryBox(doc, 50, startY, boxWidth, boxHeight, 'Total Income', totals.totalIncome, '#4CAF50');

  // Expenses box
  drawSummaryBox(
    doc,
    50 + boxWidth + spacing,
    startY,
    boxWidth,
    boxHeight,
    'Total Expenses',
    totals.totalExpenses,
    '#F44336'
  );

  // Net Balance box
  const netBalanceColor = totals.totalNetBalance >= 0 ? '#4CAF50' : '#F44336';
  drawSummaryBox(
    doc,
    50 + (boxWidth + spacing) * 2,
    startY,
    boxWidth,
    boxHeight,
    'Net Balance',
    totals.totalNetBalance,
    netBalanceColor
  );

  // Transactions box
  drawSummaryBox(
    doc,
    50 + (boxWidth + spacing) * 3,
    startY,
    boxWidth,
    boxHeight,
    'Transactions',
    totals.totalTransactions,
    '#2196F3',
    true
  );

  doc.y = startY + boxHeight + 30;
}

/**
 * Draw a summary box with label and value
 */
function drawSummaryBox(
  doc: PDFKit.PDFDocument,
  x: number,
  y: number,
  width: number,
  height: number,
  label: string,
  value: number,
  color: string,
  isCount: boolean = false
): void {
  // Draw box border
  doc.rect(x, y, width, height).stroke();

  // Draw label
  doc
    .fontSize(10)
    .font('Helvetica')
    .fillColor('#666666')
    .text(label, x + 10, y + 15, { width: width - 20, align: 'center' });

  // Draw value
  const formattedValue = isCount ? value.toString() : `$${value.toFixed(2)}`;
  doc
    .fontSize(18)
    .font('Helvetica-Bold')
    .fillColor(color)
    .text(formattedValue, x + 10, y + 40, { width: width - 20, align: 'center' });

  // Reset color
  doc.fillColor('#000000');
}

/**
 * Add monthly summary table
 */
function addMonthlySummaryTable(doc: PDFKit.PDFDocument, summary: MonthlySummary[]): void {
  if (summary.length === 0) {
    return;
  }

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Monthly Summary', { underline: true })
    .moveDown(0.5);

  const tableTop = doc.y;
  const colWidths = [100, 100, 100, 100, 100];
  const rowHeight = 25;

  // Draw table header
  doc.fontSize(10).font('Helvetica-Bold');
  drawTableRow(
    doc,
    tableTop,
    ['Month', 'Income', 'Expenses', 'Net Balance', 'Transactions'],
    colWidths,
    true
  );

  // Draw table rows
  doc.font('Helvetica');
  summary.forEach((row, index) => {
    const y = tableTop + (index + 1) * rowHeight;
    drawTableRow(
      doc,
      y,
      [
        row.month,
        `$${row.income.toFixed(2)}`,
        `$${row.expenses.toFixed(2)}`,
        `$${row.netBalance.toFixed(2)}`,
        row.transactionCount.toString(),
      ],
      colWidths,
      false
    );
  });

  doc.y = tableTop + (summary.length + 1) * rowHeight + 20;
}

/**
 * Draw a table row
 */
function drawTableRow(
  doc: PDFKit.PDFDocument,
  y: number,
  columns: string[],
  widths: number[],
  isHeader: boolean
): void {
  let x = 50;

  columns.forEach((text, i) => {
    if (isHeader) {
      doc.rect(x, y, widths[i], 25).fillAndStroke('#E0E0E0', '#000000');
      doc.fillColor('#000000').text(text, x + 5, y + 8, { width: widths[i] - 10 });
    } else {
      doc.rect(x, y, widths[i], 25).stroke();
      doc.text(text, x + 5, y + 8, { width: widths[i] - 10 });
    }
    x += widths[i];
  });
}

/**
 * Add category breakdown section
 */
function addCategoryBreakdownSection(
  doc: PDFKit.PDFDocument,
  breakdown: CategoryBreakdown[],
  type: 'Expense' | 'Income'
): void {
  if (breakdown.length === 0) {
    return;
  }

  // Check if we need a new page
  if (doc.y > 600) {
    doc.addPage();
  }

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text(`${type} Breakdown by Category`, { underline: true })
    .moveDown(0.5);

  const tableTop = doc.y;
  const colWidths = [200, 100, 80, 80];
  const rowHeight = 25;

  // Draw table header
  doc.fontSize(10).font('Helvetica-Bold');
  drawTableRow(
    doc,
    tableTop,
    ['Category', 'Amount', 'Percentage', 'Count'],
    colWidths,
    true
  );

  // Draw table rows (limit to top 10)
  doc.font('Helvetica');
  const topCategories = breakdown.slice(0, 10);
  topCategories.forEach((row, index) => {
    const y = tableTop + (index + 1) * rowHeight;
    drawTableRow(
      doc,
      y,
      [
        row.categoryName,
        `$${row.amount.toFixed(2)}`,
        `${row.percentage.toFixed(1)}%`,
        row.transactionCount.toString(),
      ],
      colWidths,
      false
    );
  });

  doc.y = tableTop + (topCategories.length + 1) * rowHeight + 20;

  // Add pie chart
  addPieChart(doc, topCategories, type);
}

/**
 * Add a simple pie chart for category breakdown
 */
function addPieChart(
  doc: PDFKit.PDFDocument,
  breakdown: CategoryBreakdown[],
  _type: 'Expense' | 'Income'
): void {
  if (breakdown.length === 0) {
    return;
  }

  // Check if we need a new page
  if (doc.y > 550) {
    doc.addPage();
  }

  const centerX = 300;
  const centerY = doc.y + 100;
  const radius = 80;

  // Colors for pie slices
  const colors = [
    '#FF6384',
    '#36A2EB',
    '#FFCE56',
    '#4BC0C0',
    '#9966FF',
    '#FF9F40',
    '#FF6384',
    '#C9CBCF',
    '#4BC0C0',
    '#FF6384',
  ];

  let startAngle = -Math.PI / 2; // Start at top

  breakdown.forEach((item, index) => {
    const sliceAngle = (item.percentage / 100) * 2 * Math.PI;
    const endAngle = startAngle + sliceAngle;

    // Draw pie slice using path commands
    doc
      .save()
      .fillColor(colors[index % colors.length])
      .moveTo(centerX, centerY);

    // Draw arc using line segments approximation
    const steps = 20;
    for (let i = 0; i <= steps; i++) {
      const angle = startAngle + (sliceAngle * i) / steps;
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      doc.lineTo(x, y);
    }

    doc.lineTo(centerX, centerY).fill().restore();

    startAngle = endAngle;
  });

  // Draw legend
  const legendX = 420;
  let legendY = centerY - radius;

  doc.fontSize(9).font('Helvetica');
  breakdown.forEach((item, index) => {
    // Draw color box
    doc.rect(legendX, legendY, 10, 10).fillAndStroke(colors[index % colors.length]);

    // Draw label
    doc
      .fillColor('#000000')
      .text(`${item.categoryName} (${item.percentage.toFixed(1)}%)`, legendX + 15, legendY, {
        width: 130,
      });

    legendY += 15;
  });

  doc.y = centerY + radius + 30;
}

/**
 * Add net balance trend chart
 */
function addNetBalanceChart(doc: PDFKit.PDFDocument, trend: NetBalancePoint[]): void {
  if (trend.length === 0) {
    return;
  }

  // Check if we need a new page
  if (doc.y > 500) {
    doc.addPage();
  }

  doc
    .fontSize(16)
    .font('Helvetica-Bold')
    .text('Net Balance Trend', { underline: true })
    .moveDown(0.5);

  const chartX = 50;
  const chartY = doc.y;
  const chartWidth = 500;
  const chartHeight = 200;

  // Draw chart border
  doc.rect(chartX, chartY, chartWidth, chartHeight).stroke();

  // Find min and max values for scaling
  const values = trend.map((p) => p.cumulativeBalance);
  const minValue = Math.min(...values, 0);
  const maxValue = Math.max(...values, 0);
  const range = maxValue - minValue || 1;

  // Draw horizontal grid lines and labels
  doc.fontSize(8).font('Helvetica');
  for (let i = 0; i <= 4; i++) {
    const value = minValue + (range * i) / 4;
    const y = chartY + chartHeight - (chartHeight * i) / 4;

    // Grid line
    doc
      .strokeColor('#E0E0E0')
      .moveTo(chartX, y)
      .lineTo(chartX + chartWidth, y)
      .stroke();

    // Label
    doc.fillColor('#666666').text(`$${value.toFixed(0)}`, chartX - 45, y - 5);
  }

  doc.strokeColor('#000000');

  // Draw line chart
  if (trend.length > 1) {
    const pointSpacing = chartWidth / (trend.length - 1);

    doc.strokeColor('#2196F3').lineWidth(2);

    trend.forEach((point, index) => {
      const x = chartX + index * pointSpacing;
      const normalizedValue = (point.cumulativeBalance - minValue) / range;
      const y = chartY + chartHeight - normalizedValue * chartHeight;

      if (index === 0) {
        doc.moveTo(x, y);
      } else {
        doc.lineTo(x, y);
      }
    });

    doc.stroke();

    // Draw points
    trend.forEach((point, index) => {
      const x = chartX + index * pointSpacing;
      const normalizedValue = (point.cumulativeBalance - minValue) / range;
      const y = chartY + chartHeight - normalizedValue * chartHeight;

      doc.circle(x, y, 3).fillAndStroke('#2196F3', '#2196F3');
    });
  }

  // Draw month labels
  doc.fontSize(8).font('Helvetica').fillColor('#666666');
  const labelSpacing = chartWidth / trend.length;
  trend.forEach((point, index) => {
    const x = chartX + index * labelSpacing + labelSpacing / 2;
    const y = chartY + chartHeight + 10;
    doc.text(point.month, x - 20, y, { width: 40, align: 'center' });
  });

  doc.y = chartY + chartHeight + 40;
  doc.strokeColor('#000000').fillColor('#000000').lineWidth(1);
}
