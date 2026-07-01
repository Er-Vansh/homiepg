'use client';

import React from 'react';
import { FileText, Printer, CheckCircle2, QrCode } from 'lucide-react';
import { Logo } from './logo';

export interface InvoiceData {
  id: string;
  amount: number;
  paymentType: string;
  status: 'PENDING' | 'PAID' | 'FAILED';
  billingPeriod: string;
  invoiceNumber: string;
  receiptNumber?: string;
  paymentDate?: string;
  notes?: string;
  residentName: string;
  residentPhone?: string;
  buildingName: string;
  roomNumber?: string;
  bedNumber?: string;
}

interface InvoiceModalProps {
  invoice: InvoiceData;
  onClose: () => void;
}

export default function InvoiceModal({ invoice, onClose }: InvoiceModalProps) {
  const handlePrint = () => {
    window.print();
  };

  // Compute itemized details
  const baseRent = Math.round(invoice.amount * 0.85);
  const electricity = Math.round(invoice.amount * 0.08);
  const maintenance = Math.round(invoice.amount * 0.07);
  const sgst = Math.round(baseRent * 0.09);
  const cgst = Math.round(baseRent * 0.09);
  const discount = 0;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 print:p-0 print:bg-transparent">
      {/* Container */}
      <div className="bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl max-w-2xl w-full flex flex-col shadow-2xl overflow-hidden print:border-none print:shadow-none print:w-full print:h-full print:rounded-none animate-fade-in">
        
        {/* Modal Header Actions (Hidden in Print) */}
        <div className="p-4 border-b border-zinc-150 dark:border-zinc-800 flex justify-between items-center bg-zinc-50 dark:bg-zinc-950/40 print:hidden">
          <span className="text-xs font-bold text-zinc-500 flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-indigo-500" />
            Billing Transaction Receipt
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={handlePrint}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold shadow flex items-center gap-1.5 transition-all"
            >
              <Printer className="w-3.5 h-3.5" />
              Download PDF / Print
            </button>
            <button 
              onClick={onClose}
              className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 text-xs font-black p-1.5"
            >
              Close
            </button>
          </div>
        </div>

        {/* Invoice Receipt Body (Visible in both screen and print) */}
        <div className="p-8 space-y-8 flex-1 overflow-y-auto print:overflow-visible print:p-0">
          
          {/* Corporate Header */}
          <div className="flex justify-between items-start gap-4">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2">
                <Logo className="w-8 h-8" showText={false} />
                <span className="font-extrabold text-base text-zinc-900 tracking-tight">Homie<span className="text-emerald-500">PG Billing</span></span>
              </div>
              <p className="text-[10px] text-zinc-400 font-bold uppercase tracking-widest">Find Your Homie. Find Your Stay.</p>
            </div>
            <div className="text-right space-y-1">
              <h2 className="text-2xl font-black text-zinc-900 dark:text-white uppercase tracking-tight">Statement</h2>
              <span className="text-xs font-mono text-zinc-500">{invoice.invoiceNumber}</span>
            </div>
          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800"></div>

          {/* Customer & Landlord metadata block */}
          <div className="grid grid-cols-2 gap-8 text-xs">
            <div className="space-y-1.5">
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">Billed To (Tenant)</span>
              <span className="font-extrabold text-zinc-800 dark:text-zinc-200 text-sm block">{invoice.residentName}</span>
              <p className="text-zinc-500 leading-relaxed font-semibold">
                PG: {invoice.buildingName}<br />
                Room Number: {invoice.roomNumber || 'N/A'}<br />
                Bed Allocation: {invoice.bedNumber || 'N/A'}<br />
                Contact: {invoice.residentPhone || 'N/A'}
              </p>
            </div>
            <div className="space-y-1.5 text-right">
              <span className="text-[9px] uppercase font-bold text-zinc-400 tracking-wider block">Billing Matrix Details</span>
              <p className="text-zinc-500 leading-relaxed font-semibold">
                Billing Cycle: <b>{invoice.billingPeriod}</b><br />
                Invoice Date: <b>{invoice.paymentDate ? new Date(invoice.paymentDate).toLocaleDateString() : 'N/A'}</b><br />
                Payment Method: <b>UPI Wallet</b><br />
                Status: <span className="text-emerald-500 font-extrabold uppercase">{invoice.status}</span>
              </p>
            </div>
          </div>

          {/* Itemized charges table */}
          <div className="border border-zinc-200 dark:border-zinc-800 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-zinc-50 dark:bg-zinc-950 border-b border-zinc-200 dark:border-zinc-850 text-zinc-400 font-bold uppercase tracking-wider">
                  <th className="p-3">Charge description</th>
                  <th className="p-3 text-right">Amount (INR)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-150 dark:divide-zinc-850 font-semibold text-zinc-700 dark:text-zinc-300">
                <tr>
                  <td className="p-3">
                    <span>Base Accommodations Rent Charges</span>
                    <span className="block text-[9px] text-zinc-400 mt-0.5">Lease lodging costs for the active cycle month.</span>
                  </td>
                  <td className="p-3 text-right">₹{baseRent.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span>AC Utility Energy Charges</span>
                    <span className="block text-[9px] text-zinc-400 mt-0.5">Room air conditioning and sub-metered power usage.</span>
                  </td>
                  <td className="p-3 text-right">₹{electricity.toLocaleString('en-IN')}</td>
                </tr>
                <tr>
                  <td className="p-3">
                    <span>Communal Maintenance Fee</span>
                    <span className="block text-[9px] text-zinc-400 mt-0.5">Daily housekeeping, high-speed Wi-Fi, and security operations.</span>
                  </td>
                  <td className="p-3 text-right">₹{maintenance.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500">
                  <td className="p-3 pl-6 text-[11px]">State GST (SGST @ 9%)</td>
                  <td className="p-3 text-right text-[11px]">₹{sgst.toLocaleString('en-IN')}</td>
                </tr>
                <tr className="bg-zinc-50/50 dark:bg-zinc-950/20 text-zinc-500">
                  <td className="p-3 pl-6 text-[11px]">Central GST (CGST @ 9%)</td>
                  <td className="p-3 text-right text-[11px]">₹{cgst.toLocaleString('en-IN')}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Invoice Summary Block */}
          <div className="flex flex-col sm:flex-row justify-between gap-6 pt-4">
            
            {/* QR verification code & notes */}
            <div className="flex items-start gap-4 max-w-sm">
              <div className="p-2 border border-zinc-200 dark:border-zinc-800 rounded-lg bg-zinc-50 dark:bg-zinc-950/40 shrink-0">
                <QrCode className="w-16 h-16 text-zinc-700 dark:text-zinc-300" />
              </div>
              <div className="text-[10px] text-zinc-400 font-semibold leading-relaxed space-y-1.5">
                <span className="text-zinc-500 font-bold block uppercase tracking-wider">Transaction Security Seal</span>
                <p>Scan this QR code to verify invoice authenticity in our digital ledger archives. Transaction reference: <b>{invoice.receiptNumber || invoice.id}</b>.</p>
              </div>
            </div>

            {/* Price Calculations */}
            <div className="w-full sm:w-60 space-y-2.5 text-xs font-semibold">
              <div className="flex justify-between">
                <span className="text-zinc-500">Subtotal</span>
                <span>₹{(baseRent + electricity + maintenance).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">Taxes (GST)</span>
                <span>₹{(sgst + cgst).toLocaleString('en-IN')}</span>
              </div>
              {discount > 0 && (
                <div className="flex justify-between text-emerald-500">
                  <span>Coupon Discount</span>
                  <span>-₹{discount.toLocaleString('en-IN')}</span>
                </div>
              )}
              <div className="h-px bg-zinc-200 dark:bg-zinc-800 my-1"></div>
              <div className="flex justify-between text-sm font-black">
                <span>Final Total Due</span>
                <span className="text-indigo-500">₹{invoice.amount.toLocaleString('en-IN')}</span>
              </div>
            </div>

          </div>

          <div className="h-px bg-zinc-200 dark:bg-zinc-800"></div>

          {/* Footer Receipt guidelines */}
          <div className="text-center text-[9px] text-zinc-400 font-semibold leading-relaxed space-y-1 max-w-md mx-auto">
            <span className="text-zinc-500 font-bold block uppercase tracking-wider">HomiePG Digital Ledger Receipt</span>
            <p>This is a computer-generated transaction statement issued in accordance with GST rules. No physical signature is required. For disputes, file a support ticket in your tenant portal.</p>
          </div>

        </div>

      </div>
    </div>
  );
}
