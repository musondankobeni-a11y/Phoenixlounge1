import React from 'react';
import { X, FileText, Download, CheckCircle, Clock, XCircle, ShoppingBag, ShieldCheck } from 'lucide-react';
import { Order } from '../types';

interface OrdersReceiptModalProps {
  isOpen: boolean;
  onClose: () => void;
  orders: Order[];
}

export const OrdersReceiptModal: React.FC<OrdersReceiptModalProps> = ({
  isOpen,
  onClose,
  orders
}) => {
  if (!isOpen) return null;

  const handleDownloadReceipt = (order: Order) => {
    const text = `======================================================
           PHOENIX LOUNGE KABWE
      Premier VIP Lounge & Nightclub
        12 Freedom Way, Kabwe, Zambia
======================================================
ORDER RECEIPT: ${order.order_ref}
DATE: ${new Date(order.created_at).toLocaleString()}
TABLE / BOOTH: ${order.table_booth_number}
CUSTOMER: ${order.customer_name} (${order.customer_phone})
STATUS: ${order.order_status.toUpperCase()}
PAYMENT METHOD: ${order.payment_method.toUpperCase()} (${order.payment_status.toUpperCase()})
------------------------------------------------------
ITEMS ORDERED:
${order.items.map(it => ` - ${it.quantity}x ${it.name.padEnd(30, ' ')} ZMW ${it.total_price.toFixed(2)}`).join('\n')}
------------------------------------------------------
TOTAL AMOUNT: ZMW ${order.total_amount_zmw.toFixed(2)}
======================================================
Thank you for spending your night at Phoenix Lounge!
Present this digital pass at the bar or service counter.
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

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in">
      <div className="w-full max-w-lg bg-[#0a0d14] border border-amber-500/40 rounded-3xl p-6 text-white shadow-2xl relative max-h-[90vh] flex flex-col">
        
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-gray-800">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <FileText className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
                Service Desk & Receipts
              </span>
              <h3 className="font-serif-display text-lg font-black text-white">
                My Orders & Receipts
              </h3>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Orders List */}
        <div className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3">
          {orders.length === 0 ? (
            <div className="text-center py-12 text-gray-400 text-xs">
              <ShoppingBag className="w-10 h-10 mx-auto text-gray-600 mb-2" />
              <p>No active orders placed yet this session.</p>
              <p className="text-gray-500 mt-1">Orders dispatched to tables appear here immediately.</p>
            </div>
          ) : (
            orders.map(order => (
              <div
                key={order.id}
                className="p-4 bg-gray-900/90 border border-gray-800 rounded-2xl flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between text-xs mb-2">
                    <span className="font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                      {order.order_ref}
                    </span>
                    <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded flex items-center space-x-1 ${
                      order.order_status === 'confirmed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                      order.order_status === 'dropped' ? 'bg-red-950 text-red-400 border border-red-500/40' :
                      'bg-amber-950 text-amber-400 border border-amber-500/40 animate-pulse'
                    }`}>
                      {order.order_status === 'confirmed' ? <CheckCircle className="w-3 h-3 mr-1" /> :
                       order.order_status === 'dropped' ? <XCircle className="w-3 h-3 mr-1" /> :
                       <Clock className="w-3 h-3 mr-1" />}
                      <span>{order.order_status}</span>
                    </span>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-300 mb-2">
                    <span>Destination: <strong className="text-white font-mono">{order.table_booth_number}</strong></span>
                    <span className="text-[11px] text-gray-400 font-mono">
                      {new Date(order.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>

                  {/* Items summary */}
                  <div className="p-2.5 bg-black/60 rounded-xl border border-gray-800 space-y-1 text-xs mb-3">
                    {order.items.map((it, idx) => (
                      <div key={idx} className="flex justify-between items-center text-gray-300">
                        <span>{it.quantity}x {it.name}</span>
                        <span className="font-mono text-amber-400">ZMW {it.total_price.toFixed(2)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center justify-between text-xs border-t border-gray-800 pt-2">
                    <span className="text-gray-400">Payment: <strong className="text-amber-300 uppercase">{order.payment_method}</strong></span>
                    <span className="text-sm font-black text-amber-400 font-mono">
                      ZMW {order.total_amount_zmw.toFixed(2)}
                    </span>
                  </div>
                </div>

                <div className="mt-3 pt-2 flex items-center justify-between border-t border-gray-800">
                  <span className="text-[10px] text-gray-400">
                    {order.order_status === 'confirmed' ? 'Verified by Staff' : 'Awaiting confirmation'}
                  </span>
                  <button
                    onClick={() => handleDownloadReceipt(order)}
                    className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center space-x-1.5 transition-all ${
                      order.order_status === 'confirmed'
                        ? 'bg-amber-500 hover:bg-amber-400 text-black font-black shadow-md shadow-amber-500/20'
                        : 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                    }`}
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>{order.order_status === 'confirmed' ? 'Download Confirmed Receipt' : 'Download Receipt'}</span>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="pt-3 border-t border-gray-800 flex items-center justify-between text-[11px] text-gray-400">
          <span>Phoenix Lounge Kabwe • 12 Freedom Way</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-xl text-xs font-bold"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};
