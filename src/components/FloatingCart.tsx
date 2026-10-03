import React from 'react';
import { ShoppingBag, ArrowRight } from 'lucide-react';

interface FloatingCartProps {
  itemCount: number;
  totalAmount: number;
  onOpenCart: () => void;
  isCartOpen?: boolean;
}

export const FloatingCart: React.FC<FloatingCartProps> = ({
  itemCount,
  totalAmount,
  onOpenCart,
  isCartOpen = false
}) => {
  if (itemCount === 0 || isCartOpen) return null;

  return (
    <div className="fixed bottom-5 left-1/2 -translate-x-1/2 z-50 w-[92%] max-w-md animate-in slide-in-from-bottom-6 duration-300">
      <button
        onClick={onOpenCart}
        className="w-full p-3.5 bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 hover:from-amber-400 hover:to-amber-300 text-black font-extrabold rounded-2xl shadow-2xl shadow-amber-500/30 border border-amber-300 flex items-center justify-between transition-transform transform active:scale-98"
      >
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-xl bg-black text-amber-400 flex items-center justify-center font-black text-sm shadow-inner">
            <ShoppingBag className="w-5 h-5 text-amber-400" />
          </div>
          <div className="text-left leading-tight">
            <div className="flex items-center space-x-2">
              <span className="text-xs font-black uppercase tracking-wider bg-black/15 px-2 py-0.5 rounded-full">
                {itemCount} {itemCount === 1 ? 'Item' : 'Items'} in Cart
              </span>
            </div>
            <p className="text-sm font-black font-mono mt-0.5">
              ZMW {totalAmount.toFixed(2)}
            </p>
          </div>
        </div>

        <div className="flex items-center space-x-1.5 bg-black text-amber-400 font-extrabold text-xs px-3.5 py-2 rounded-xl shadow-md">
          <span>Checkout</span>
          <ArrowRight className="w-4 h-4" />
        </div>
      </button>
    </div>
  );
};
