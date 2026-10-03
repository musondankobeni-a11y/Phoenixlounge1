import React, { useState } from 'react';
import { 
  X, 
  Copy, 
  Check, 
  Smartphone, 
  PhoneCall, 
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { Order, GatewayConfig, PaymentGateway } from '../types';

interface MobileMoneyModalProps {
  order: Order | null;
  gateways: Record<PaymentGateway, GatewayConfig>;
  onClose: () => void;
  onConfirmPaymentSent: (orderId: string, reference: string) => void;
}

export const MobileMoneyModal: React.FC<MobileMoneyModalProps> = ({
  order,
  gateways,
  onClose,
  onConfirmPaymentSent
}) => {
  const [copied, setCopied] = useState(false);
  const [reference, setReference] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!order) return null;

  const gw = gateways[order.payment_method] || gateways.mtn;
  const amount = order.total_amount_zmw.toFixed(2);

  const handleCopyMerchantCode = () => {
    navigator.clipboard.writeText(gw.merchant_code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const handleConfirm = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      onConfirmPaymentSent(order.id, reference.trim() || `MOMO-${Date.now().toString().slice(-6)}`);
      setIsSubmitting(false);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-gray-950 border border-amber-500/40 rounded-2xl shadow-2xl p-6 text-white relative">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 w-8 h-8 rounded-full bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center space-x-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
            <Smartphone className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">
              Mobile Money Dispatch
            </span>
            <h3 className="text-lg font-black text-white uppercase">
              {gw.name} Instructions
            </h3>
          </div>
        </div>

        {/* Order Details Banner */}
        <div className="p-3 bg-gray-900 border border-gray-800 rounded-xl mb-4 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-gray-400">Order Reference</p>
            <p className="text-sm font-black text-white font-mono">{order.order_ref}</p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-gray-400">Payable Amount</p>
            <p className="text-base font-black text-amber-400 font-mono">ZMW {amount}</p>
          </div>
        </div>

        {/* 4 Clear Operational Steps */}
        <div className="space-y-3 mb-5 text-xs text-gray-300">
          
          <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center shrink-0 text-[11px]">
              1
            </div>
            <div>
              <p className="font-bold text-white">Dial {gw.short_code} on your phone</p>
              <p className="text-gray-400 text-[11px]">Open your phone dialer and dial the shortcode.</p>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center shrink-0 text-[11px]">
              2
            </div>
            <div>
              <p className="font-bold text-white">Select 'Pay Merchant' / 'Make Payment'</p>
              <p className="text-gray-400 text-[11px]">Choose merchant payment option from the USSD prompt.</p>
            </div>
          </div>

          {/* Step 3: Copy Merchant Code */}
          <div className="p-2.5 rounded-lg bg-amber-950/30 border border-amber-500/40 flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center shrink-0 text-[11px]">
              3
            </div>
            <div className="flex-1">
              <p className="font-bold text-amber-300">Copy Merchant Code:</p>
              <div className="mt-1 flex items-center space-x-2">
                <span className="font-mono font-black text-sm text-white bg-black/60 px-2.5 py-1 rounded border border-gray-700">
                  {gw.merchant_code}
                </span>
                <button
                  type="button"
                  onClick={handleCopyMerchantCode}
                  className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-black rounded font-bold text-[11px] flex items-center space-x-1"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5" />
                      <span>COPIED!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copy Code</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          <div className="p-2.5 rounded-lg bg-gray-900/60 border border-gray-800 flex items-start space-x-3">
            <div className="w-5 h-5 rounded-full bg-amber-500 text-black font-extrabold flex items-center justify-center shrink-0 text-[11px]">
              4
            </div>
            <div>
              <p className="font-bold text-white">Enter Amount & PIN</p>
              <p className="text-gray-400 text-[11px]">Input exact <span className="text-amber-400 font-bold">ZMW {amount}</span> and authorize with your secret PIN.</p>
            </div>
          </div>

        </div>

        {/* Submission / Confirmation Form */}
        <form onSubmit={handleConfirm} className="space-y-3">
          <div>
            <label className="block text-xs font-semibold text-gray-300 mb-1">
              MoMo Transaction Reference or Phone (Optional)
            </label>
            <input
              type="text"
              placeholder="e.g. TXN-89218 or your number"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="w-full p-2.5 bg-gray-900 border border-gray-700 focus:border-amber-400 rounded-lg text-xs text-white placeholder-gray-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center space-x-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex-1 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs sm:text-sm rounded-xl flex items-center justify-center space-x-2 transition-all disabled:opacity-50"
            >
              <Check className="w-4 h-4" />
              <span>{isSubmitting ? 'Confirming with Hub...' : 'I Have Completed Mobile Payment'}</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 bg-gray-900 hover:bg-gray-800 border border-gray-700 text-gray-300 rounded-xl text-xs font-bold"
            >
              Close
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
