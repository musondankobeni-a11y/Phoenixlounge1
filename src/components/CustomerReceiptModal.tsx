import React from 'react';
import { 
  X, 
  Download, 
  Printer, 
  CheckCircle2, 
  Clock, 
  XCircle, 
  Flame, 
  MapPin, 
  Phone,
  ShieldCheck,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { Order, SystemConfig } from '../types';

interface CustomerReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  config?: SystemConfig;
}

export const CustomerReceiptModal: React.FC<CustomerReceiptModalProps> = ({
  isOpen,
  onClose,
  order,
  config
}) => {
  if (!isOpen || !order) return null;

  const isConfirmed = order.order_status === 'confirmed';
  const isPending = order.order_status === 'pending';
  const isDropped = order.order_status === 'dropped';

  const hotline = config?.venue_contacts.hotline || '+260 979 181461';
  const address = config?.venue_contacts.address || '12 Freedom Way, Kabwe, Zambia';

  const handleDownloadReceiptText = () => {
    const text = `======================================================
           PHOENIX LOUNGE KABWE
       Premier VIP Lounge & Nightclub
         ${address}
           VIP Hotline: ${hotline}
======================================================
OFFICIAL CUSTOMER RECEIPT PASS
RECEIPT REF: ${order.order_ref}
DATE PLACED: ${new Date(order.created_at).toLocaleString()}
${order.confirmed_at ? `CONFIRMED AT: ${new Date(order.confirmed_at).toLocaleString()}\n` : ''}TABLE / VIP BOOTH: ${order.table_booth_number}
CUSTOMER: ${order.customer_name} (${order.customer_phone})
ORDER STATUS: ${order.order_status.toUpperCase()}${isConfirmed ? ' [VERIFIED BY STAFF]' : ' [AWAITING STAFF CONFIRMATION]'}
PAYMENT METHOD: ${order.payment_method.toUpperCase()} (${order.payment_status.toUpperCase()})
------------------------------------------------------
ITEMS ORDERED:
${order.items.map(it => ` - ${it.quantity}x ${it.name.padEnd(28, ' ')} ZMW ${it.total_price.toFixed(2)}`).join('\n')}
------------------------------------------------------
TOTAL AMOUNT: ZMW ${order.total_amount_zmw.toFixed(2)}
======================================================
${isConfirmed 
  ? '*** ORDER CONFIRMED BY PHOENIX LOUNGE STAFF ***\nThank you for dining with us! Service dispatched to your table.' 
  : 'Order submitted to staff counter. Awaiting staff verification.'}
======================================================
Design by Humphrey nkobeni • Phoenix Lounge Kabwe
======================================================`;

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Phoenix_Receipt_${order.order_ref}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-md animate-in fade-in overflow-y-auto">
      <div className="w-full max-w-md bg-[#0a0d14] border border-amber-500/40 rounded-3xl shadow-2xl p-5 sm:p-6 text-white relative my-auto max-h-[92vh] flex flex-col overflow-hidden">
        
        {/* Top Action Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
          <div className="flex items-center space-x-2">
            <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
            <span className="text-xs font-black uppercase tracking-wider text-amber-400">
              Customer Digital Receipt
            </span>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={handlePrint}
              title="Print Receipt"
              className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <Printer className="w-4 h-4" />
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Scrollable Receipt Slip */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-4 font-sans">
          
          <div className="bg-black/90 p-5 rounded-2xl border border-gray-800 space-y-3 shadow-inner">
            
            {/* Venue Branding Header */}
            <div className="text-center pb-4 border-b border-dashed border-gray-800">
              <div className="w-12 h-12 mx-auto rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center shadow-lg shadow-amber-500/20 mb-2">
                <Flame className="w-6 h-6 text-white fill-white" />
              </div>
              <h2 className="font-serif-display font-black text-lg tracking-wider text-amber-400 uppercase">
                Phoenix Lounge Kabwe
              </h2>
              <p className="text-[11px] text-gray-400 mt-0.5 flex items-center justify-center gap-1">
                <MapPin className="w-3 h-3 text-amber-500" />
                <span>{address}</span>
              </p>
              <p className="text-[10px] text-gray-500 mt-0.5 font-mono">
                VIP Hotline: {hotline}
              </p>
            </div>

            {/* Status Alert Banner */}
            <div className="my-3.5">
              {isConfirmed ? (
                <div className="p-3 bg-emerald-950/80 border border-emerald-500/60 rounded-xl text-emerald-300 text-xs flex items-center space-x-2.5 animate-in fade-in">
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
                  <div className="leading-tight">
                    <p className="font-black uppercase tracking-wider text-emerald-300">
                      Order Confirmed by Staff
                    </p>
                    <p className="text-[10px] text-emerald-400/90 mt-0.5">
                      Your order is verified by staff and service is dispatched to your table!
                    </p>
                  </div>
                </div>
              ) : isDropped ? (
                <div className="p-3 bg-red-950/80 border border-red-500/60 rounded-xl text-red-300 text-xs flex items-center space-x-2.5">
                  <XCircle className="w-5 h-5 text-red-400 shrink-0" />
                  <div className="leading-tight">
                    <p className="font-black uppercase tracking-wider text-red-300">
                      Order Dropped by Staff
                    </p>
                    <p className="text-[10px] text-red-400/90 mt-0.5">
                      This order was cancelled by staff. Please check with your floor server.
                    </p>
                  </div>
                </div>
              ) : (
                <div className="p-3 bg-amber-950/60 border border-amber-500/40 rounded-xl text-amber-300 text-xs flex items-center space-x-2.5">
                  <Clock className="w-5 h-5 text-amber-400 shrink-0 animate-spin" style={{ animationDuration: '4s' }} />
                  <div className="leading-tight">
                    <p className="font-black uppercase tracking-wider text-amber-300">
                      Awaiting Staff Confirmation
                    </p>
                    <p className="text-[10px] text-amber-400/80 mt-0.5">
                      Transmitted live to Phoenix staff console. Staff must verify before bar & kitchen dispatch.
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Order Details Metadata */}
            <div className="text-xs space-y-1.5 py-3 border-y border-dashed border-gray-800 font-mono">
              <div className="flex justify-between">
                <span className="text-gray-400">Order Ref:</span>
                <span className="text-amber-400 font-black">{order.order_ref}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Table / Booth:</span>
                <span className="text-white font-bold">{order.table_booth_number}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Customer Name:</span>
                <span className="text-white font-bold">{order.customer_name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Phone:</span>
                <span className="text-gray-300">{order.customer_phone}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Payment:</span>
                <span className="text-amber-300 font-bold uppercase">{order.payment_method} ({order.payment_status})</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Placed At:</span>
                <span className="text-gray-300">{new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
              {order.confirmed_at && (
                <div className="flex justify-between text-emerald-400 font-bold">
                  <span>Confirmed At:</span>
                  <span>{new Date(order.confirmed_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
              )}
            </div>

            {/* Items Summary Table */}
            <div className="space-y-2 py-2">
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                Items Ordered
              </p>
              <div className="space-y-1.5">
                {order.items.map((it, idx) => (
                  <div key={idx} className="flex justify-between items-center text-xs">
                    <span className="text-gray-200">
                      <strong className="text-white font-bold mr-1.5">{it.quantity}x</strong>
                      {it.name}
                    </span>
                    <span className="text-amber-400 font-mono font-bold">
                      ZMW {it.total_price.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {order.notes && (
              <div className="p-2.5 bg-gray-950 rounded-xl border border-gray-800 text-xs">
                <span className="text-gray-500 block text-[10px] uppercase font-bold">Special Notes:</span>
                <span className="text-gray-300 italic">{order.notes}</span>
              </div>
            )}

            {/* Total */}
            <div className="pt-3 border-t-2 border-gray-800 flex justify-between items-center text-sm">
              <span className="font-extrabold uppercase text-white">Grand Total</span>
              <span className="text-xl font-black text-amber-400 font-mono">
                ZMW {order.total_amount_zmw.toFixed(2)}
              </span>
            </div>

            {/* Thank you note */}
            <div className="text-center pt-4 text-[10px] text-gray-500">
              <p>Thank you for choosing Phoenix Lounge Kabwe!</p>
              <p className="mt-0.5">Retain this digital pass on your device.</p>
            </div>
          </div>

        </div>

        {/* Footer Actions: Prominent Download Option once Confirmed */}
        <div className="pt-3 border-t border-gray-800 shrink-0 space-y-2">
          {isConfirmed ? (
            <button
              onClick={handleDownloadReceiptText}
              className="w-full py-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-black text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/25 transition-all transform active:scale-98"
            >
              <Download className="w-4 h-4 text-black" />
              <span>Download Confirmed Official Receipt</span>
            </button>
          ) : (
            <div className="space-y-1.5">
              <button
                onClick={handleDownloadReceiptText}
                className="w-full py-3 bg-gray-800 hover:bg-gray-700 text-white font-bold text-xs rounded-xl flex items-center justify-center space-x-2 transition-colors border border-gray-700"
              >
                <Download className="w-4 h-4 text-amber-400" />
                <span>Download Pending Slip</span>
              </button>
              <p className="text-[10px] text-center text-gray-500">
                Official staff-verified confirmation unlocks in real time once approved.
              </p>
            </div>
          )}

          <button
            onClick={onClose}
            className="w-full py-2.5 bg-gray-950 hover:bg-gray-900 border border-gray-800 text-gray-400 hover:text-white rounded-xl text-xs font-bold transition-colors"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
