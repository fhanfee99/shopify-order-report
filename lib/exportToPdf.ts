import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface ExportPdfProps {
  orders: Record<string, any>[];
  fileName?: string;
  storeDomain?: string;
}

export function exportOrdersToPdf({
  orders,
  fileName = 'Shopify_Orders_Report.pdf',
  storeDomain = 'farhandev3.myshopify.com',
}: ExportPdfProps) {
  if (!orders || orders.length === 0) {
    alert('Export ke liye koi order data nahi hai.');
    return;
  }

  // Landscape A4 PDF Document Initialize Karein
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a4',
  });

  // 1. Header Section
  doc.setFontSize(18);
  doc.setTextColor(30, 41, 59); // Dark slate
  doc.text('Shopify Orders & Bundle Report', 14, 15);

  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139); // Slate gray
  doc.text(`Store Domain: ${storeDomain}`, 14, 22);
  doc.text(`Generated On: ${new Date().toLocaleString()}`, 14, 27);
  doc.text(`Total Orders Exported: ${orders.length}`, 200, 27);

  // Divider Line
  doc.setLineWidth(0.5);
  doc.setDrawColor(226, 232, 240);
  doc.line(14, 31, 283, 31);

  // 2. Table Headers Definition
  const tableHeaders = [
    'Order #',
    'Date',
    'Customer',
    'Financial Status',
    'Fulfillment',
    'Is Bundle?',
    'Bundle Name',
    'Bundle Price',
    'Bundle Qty',
    'Total Amount',
  ];

  // 3. Table Rows Mapping
  const tableRows = orders.map((order) => [
    order.orderName || 'N/A',
    order.createdAt || 'N/A',
    order.customerName || 'Guest',
    order.financialStatus || 'N/A',
    order.fulfillmentStatus || 'N/A',
    order.isBundle || 'No',
    order.bundleName && order.bundleName !== 'N/A' ? order.bundleName : '-',
    order.bundlePrice ? `${order.currency || ''} ${order.bundlePrice}` : '0.00',
    order.bundleQty || 0,
    `${order.currency || ''} ${order.totalAmount || '0.00'}`,
  ]);

  // 4. AutoTable Generation with Styling
  autoTable(doc, {
    startY: 35,
    head: [tableHeaders],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [15, 23, 42], // Primary dark background
      textColor: [255, 255, 255],
      fontSize: 9,
      fontStyle: 'bold',
      halign: 'left',
    },
    bodyStyles: {
      fontSize: 8,
      textColor: [51, 65, 85],
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252], // Subtle zebra striping
    },
    columnStyles: {
      0: { cellWidth: 22 }, // Order #
      1: { cellWidth: 22 }, // Date
      2: { cellWidth: 35 }, // Customer
      3: { cellWidth: 28 }, // Financial Status
      4: { cellWidth: 28 }, // Fulfillment
      5: { cellWidth: 20 }, // Is Bundle?
      6: { cellWidth: 40 }, // Bundle Name
      7: { cellWidth: 25 }, // Bundle Price
      8: { cellWidth: 20 }, // Bundle Qty
      9: { cellWidth: 28 }, // Total Amount
    },
    margin: { top: 35, left: 14, right: 14, bottom: 15 },
    didDrawPage: (data) => {
      // Footer Page Numbering
      const pageCount = (doc as any).internal.getNumberOfPages();
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(
        `Page ${data.pageNumber} of ${pageCount}`,
        283 - 20,
        200,
        { align: 'right' }
      );
    },
  });

  // Save PDF File
  doc.save(fileName);
}
