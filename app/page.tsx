'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { exportToCSV, exportToExcel, exportToPDF } from '@/lib/export-utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Download,
  SlidersHorizontal,
  RefreshCw,
  BarChart3,
  Plus,
  Trash2,
  FilterX,
  CheckCircle2,
  XCircle,
  ChevronDown,
  FileText
} from 'lucide-react';

const ALL_FIELDS = [
  { id: 'orderName', label: 'Order ID' },
  { id: 'createdAt', label: 'Order Date' },
  { id: 'customerName', label: 'Customer Name' },
  { id: 'customerEmail', label: 'Customer Email' },
  { id: 'customerPhone', label: 'Customer Phone' },
  { id: 'customerTags', label: 'Customer Tags' },
  { id: 'products', label: 'Products / Items' },
  { id: 'skus', label: 'SKUs / Codes' },
  { id: 'quantity', label: 'Total Quantity' },
  { id: 'subtotalAmount', label: 'Subtotal' },
  { id: 'totalDiscount', label: 'Total Discount' },
  { id: 'totalTax', label: 'Total Tax' },
  { id: 'totalShipping', label: 'Shipping Charge' },
  { id: 'totalAmount', label: 'Total Paid' },
  { id: 'financialStatus', label: 'Payment Status' },
  { id: 'fulfillmentStatus', label: 'Fulfillment Status' },
  { id: 'orderTags', label: 'Order Tags' },
  { id: 'shippingCity', label: 'City' },
  { id: 'shippingState', label: 'State' },
  { id: 'shippingCountry', label: 'Country' },
  { id: 'note', label: 'Order Note' },
];

interface DynamicFilter {
  id: string;
  field: string;
  operator: 'contains' | 'equals' | 'greaterThan' | 'lessThan';
  value: string;
}

export default function OrderReportGenerator() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connected, setConnected] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [storeDomain, setStoreDomain] = useState<string>('');

  const [showColumnMenu, setShowColumnMenu] = useState<boolean>(false);
  const columnMenuRef = useRef<HTMLDivElement>(null);

  const [filters, setFilters] = useState<DynamicFilter[]>([]);

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>({
    orderName: true,
    createdAt: true,
    customerName: true,
    customerEmail: true,
    products: true,
    skus: true,
    totalAmount: true,
    financialStatus: true,
    fulfillmentStatus: true,
  });

  const [currentPage, setCurrentPage] = useState<number>(1);
  const pageSize = 100;

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (columnMenuRef.current && !columnMenuRef.current.contains(event.target as Node)) {
        setShowColumnMenu(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const fetchReportData = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      const res = await fetch('/api/orders');
      const result = await res.json();

      setStoreDomain(result.storeDomain || '');
      setConnected(!!result.connected);

      if (result.success && result.connected) {
        setData(result.data || []);
      } else {
        setData([]);
        setErrorMessage(result.error || 'Connection failed.');
      }
    } catch (err: any) {
      setConnected(false);
      setData([]);
      setErrorMessage(`Network/Server Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReportData();
  }, []);

  const addFilterRule = () => {
    setFilters((prev) => [
      ...prev,
      { id: Date.now().toString(), field: 'customerName', operator: 'contains', value: '' },
    ]);
  };

  const removeFilterRule = (id: string) => {
    setFilters((prev) => prev.filter((f) => f.id !== id));
  };

  const updateFilterRule = (id: string, key: keyof DynamicFilter, value: string) => {
    setFilters((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: value } : f))
    );
    setCurrentPage(1);
  };

  const filteredData = useMemo(() => {
    if (filters.length === 0) return data;

    return data.filter((row) => {
      return filters.every((filter) => {
        if (!filter.value.trim()) return true;

        const rowVal = row[filter.field] !== undefined ? String(row[filter.field]).toLowerCase() : '';
        const searchVal = filter.value.toLowerCase().trim();

        if (filter.operator === 'contains') return rowVal.includes(searchVal);
        if (filter.operator === 'equals') return rowVal === searchVal;

        const numRow = parseFloat(rowVal);
        const numSearch = parseFloat(searchVal);
        if (!isNaN(numRow) && !isNaN(numSearch)) {
          if (filter.operator === 'greaterThan') return numRow > numSearch;
          if (filter.operator === 'lessThan') return numRow < numSearch;
        }

        return true;
      });
    });
  }, [data, filters]);

  const paginatedData = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredData.slice(start, start + pageSize);
  }, [filteredData, currentPage]);

  const totalPages = Math.ceil(filteredData.length / pageSize) || 1;

  const toggleColumn = (colId: string) => {
    setVisibleColumns((prev) => ({ ...prev, [colId]: !prev[colId] }));
  };

  const activeColumns = ALL_FIELDS.filter((f) => visibleColumns[f.id]);

  const getExportData = () => {
    return filteredData.map((row) => {
      const exportRow: Record<string, any> = {};
      activeColumns.forEach((col) => {
        exportRow[col.label] = row[col.id] !== undefined ? row[col.id] : '';
      });
      return exportRow;
    });
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6">
      {/* HEADER */}
      <header className="flex flex-col sm:flex-row sm:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-600 text-white rounded-xl shadow-md">
            <BarChart3 className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight">Shopify Order Report Generator</h1>
            <p className="text-xs text-slate-500">Live Shopify API Connector & Filter Engine</p>
          </div>
        </div>

        <Button variant="default" size="sm" onClick={fetchReportData} disabled={loading} className="bg-indigo-600 hover:bg-indigo-700">
          <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          {loading ? 'Checking Connection...' : 'Test Shopify Connection'}
        </Button>
      </header>

      {/* SHOPIFY CONNECTION STATUS PANEL */}
      <div className="mb-6 p-4 rounded-xl border bg-white shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            {connected ? (
              <div className="p-2 bg-emerald-100 text-emerald-600 rounded-lg">
                <CheckCircle2 className="w-5 h-5" />
              </div>
            ) : (
              <div className="p-2 bg-rose-100 text-rose-600 rounded-lg">
                <XCircle className="w-5 h-5" />
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-sm">Shopify Connection Status:</span>
                {connected ? (
                  <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                    CONNECTED & READING LIVE ORDERS
                  </span>
                ) : (
                  <span className="text-xs font-semibold text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-200">
                    NOT CONNECTED
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Store: <code className="font-bold text-slate-700">{storeDomain || 'farhandev3.myshopify.com'}</code>
              </p>
            </div>
          </div>

          <div className="text-right">
            <span className="text-xs text-slate-500">Total Live Orders</span>
            <div className="text-xl font-bold text-slate-800">{data.length}</div>
          </div>
        </div>

        {/* ERROR DETAILS IF DISCONNECTED */}
        {!connected && errorMessage && (
          <div className="mt-3 p-3 bg-rose-50 border border-rose-200 rounded-lg text-xs text-rose-800">
            <div className="font-bold mb-1">Reason for Connection Failure:</div>
            <code className="block bg-white p-2 rounded border border-rose-200 font-mono text-[11px] text-rose-600 mb-2">
              {errorMessage}
            </code>
            <div className="text-slate-700 font-medium">
              💡 <strong>Fixing Step:</strong> Shopify Custom Apps require the <code>SHOPIFY_ADMIN_ACCESS_TOKEN</code>.
              <ol className="list-decimal ml-4 mt-1 space-y-0.5">
                <li>Go to Shopify Admin (<code>farhandev3.myshopify.com/admin</code>) &gt; Settings &gt; Apps and sales channels &gt; Develop apps.</li>
                <li>Click your App &gt; <strong>API credentials</strong> tab.</li>
                <li>Click <strong>Install app</strong> (or Reveal token once) and copy the token starting with <code>shpat_</code>.</li>
                <li>Add <code>SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_xxx</code> in <code>.env.local</code> and restart the server.</li>
              </ol>
            </div>
          </div>
        )}
      </div>

      {/* DYNAMIC FILTER BUILDER */}
      <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm mb-6 space-y-3">
        <div className="flex items-center justify-between border-b pb-2">
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-slate-800">Dynamic Filter Rules</span>
            <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full font-medium">
              {filters.length} Rules Active
            </span>
          </div>
          <div className="flex gap-2">
            {filters.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setFilters([])}
                className="text-red-500 hover:text-red-600 text-xs hover:bg-red-50"
              >
                <FilterX className="w-3.5 h-3.5 mr-1" /> Clear Rules
              </Button>
            )}
            <Button size="sm" variant="outline" onClick={addFilterRule} className="text-xs border-indigo-200 text-indigo-700 hover:bg-indigo-50">
              <Plus className="w-3.5 h-3.5 mr-1" /> Add Filter Rule
            </Button>
          </div>
        </div>

        {filters.length === 0 ? (
          <p className="text-xs text-slate-400 italic py-2">
            No active filters. Click &quot;Add Filter Rule&quot; to filter orders by SKU, Product Name, Customer, City, Price, Status, Tags, etc.
          </p>
        ) : (
          <div className="space-y-2">
            {filters.map((filter) => (
              <div key={filter.id} className="flex flex-wrap items-center gap-2 bg-slate-50 p-2 rounded-lg border border-slate-200">
                <select
                  value={filter.field}
                  onChange={(e) => updateFilterRule(filter.id, 'field', e.target.value)}
                  className="h-8 text-xs border rounded-md px-2 bg-white font-medium text-slate-700 shadow-sm"
                >
                  {ALL_FIELDS.map((f) => (
                    <option key={f.id} value={f.id}>{f.label}</option>
                  ))}
                </select>

                <select
                  value={filter.operator}
                  onChange={(e) => updateFilterRule(filter.id, 'operator', e.target.value as any)}
                  className="h-8 text-xs border rounded-md px-2 bg-white font-medium text-slate-700 shadow-sm"
                >
                  <option value="contains">Contains</option>
                  <option value="equals">Equals Exact</option>
                  <option value="greaterThan">Greater Than (&gt;)</option>
                  <option value="lessThan">Less Than (&lt;)</option>
                </select>

                <Input
                  placeholder="Enter value..."
                  value={filter.value}
                  onChange={(e) => updateFilterRule(filter.id, 'value', e.target.value)}
                  className="h-8 text-xs w-52 bg-white"
                />

                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeFilterRule(filter.id)}
                  className="text-slate-400 hover:text-red-500 hover:bg-red-50 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* TOOLBAR */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4">
        <div className="text-xs font-medium text-slate-600">
          Filtered Results: <span className="text-indigo-600 font-bold text-sm">{filteredData.length}</span> orders
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
          <div className="relative" ref={columnMenuRef}>
            <button
              type="button"
              onClick={() => setShowColumnMenu((p) => !p)}
              className="inline-flex items-center justify-center rounded-md border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 hover:bg-slate-50 shadow-sm transition-colors"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 mr-2" /> Choose Columns ({activeColumns.length})
              <ChevronDown className="w-3.5 h-3.5 ml-1.5 text-slate-400" />
            </button>

            {showColumnMenu && (
              <div className="absolute right-0 mt-2 w-60 bg-white border border-slate-200 rounded-lg shadow-xl z-50 p-2 max-h-80 overflow-y-auto">
                <div className="text-xs font-semibold text-slate-500 pb-2 px-2 border-b border-slate-100">
                  Toggle Columns
                </div>
                <div className="pt-2 space-y-1">
                  {ALL_FIELDS.map((field) => (
                    <label
                      key={field.id}
                      className="flex items-center gap-2 px-2 py-1 hover:bg-slate-50 rounded cursor-pointer text-xs text-slate-700"
                    >
                      <input
                        type="checkbox"
                        checked={!!visibleColumns[field.id]}
                        onChange={() => toggleColumn(field.id)}
                        className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span>{field.label}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          <Button variant="outline" size="sm" onClick={() => exportToCSV(getExportData(), 'shopify-live-report.csv')}>
            <Download className="w-3.5 h-3.5 mr-1" /> CSV
          </Button>
          <Button variant="default" size="sm" onClick={() => exportToExcel(getExportData(), 'shopify-live-report.xlsx')} className="bg-emerald-600 hover:bg-emerald-700">
            <Download className="w-3.5 h-3.5 mr-1" /> Excel
          </Button>
          <Button variant="default" size="sm" onClick={() => exportToPDF(getExportData(), 'shopify-live-report.pdf')} className="bg-rose-600 hover:bg-rose-700">
            <FileText className="w-3.5 h-3.5 mr-1" /> PDF
          </Button>
        </div>
      </div>

      {/* DATA TABLE */}
      <div className="rounded-xl border border-slate-200 bg-white shadow-sm overflow-x-auto">
        <Table>
          <TableHeader className="bg-slate-50">
            <TableRow>
              {activeColumns.map((col) => (
                <TableHead key={col.id} className="text-xs font-semibold text-slate-700 whitespace-nowrap">
                  {col.label}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="h-28 text-center text-slate-500">
                  Connecting to Shopify API...
                </TableCell>
              </TableRow>
            ) : paginatedData.length ? (
              paginatedData.map((row, idx) => (
                <TableRow key={idx} className="hover:bg-slate-50/80 transition-colors">
                  {activeColumns.map((col) => (
                    <TableCell key={col.id} className="text-xs whitespace-pre-line">
                      {row[col.id] !== undefined && row[col.id] !== '' ? String(row[col.id]) : '—'}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={activeColumns.length} className="h-28 text-center text-slate-500">
                  {connected
                    ? 'No orders found matching your active filters.'
                    : 'Not connected to Shopify. Fix API token to load live orders.'}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* PAGINATION */}
      <div className="flex items-center justify-between py-4">
        <div className="text-xs text-slate-500">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setCurrentPage((p) => Math.min(p + 1, totalPages))}
            disabled={currentPage >= totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
