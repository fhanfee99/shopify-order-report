import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export function exportToCSV(data: any[], filename = 'custom-report.csv') {
  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.click();
}

export function exportToExcel(data: any[], filename = 'custom-report.xlsx') {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Report');
  XLSX.writeFile(workbook, filename);
}

export function exportToPDF(data: Record<string, any>[], filename = 'shopify-live-report.pdf') {
  if (!data || data.length === 0) return;

  const doc = new jsPDF('landscape', 'pt', 'a4');

  // Header Title
  doc.setFontSize(14);
  doc.text('Shopify Live Orders Report', 40, 40);

  // Extract columns and rows dynamically from the exported data structure
  const headers = Object.keys(data[0]);
  const rows = data.map((row) => headers.map((key) => row[key] ?? ''));

  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 60,
    styles: { fontSize: 8, cellPadding: 4 },
    headStyles: { fillColor: [79, 70, 229] }, // Indigo header color matching app theme
  });

  doc.save(filename);
}
