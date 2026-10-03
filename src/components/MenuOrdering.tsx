import React, { useState, useMemo } from 'react';
import { 
  Search, 
  Plus, 
  Minus, 
  Trash2, 
  ShoppingBag, 
  ArrowRight, 
  Check, 
  X,
  CreditCard,
  Banknote,
  Smartphone,
  Flame
} from 'lucide-react';
import { MenuItem, OrderItem, PaymentGateway } from '../types';

interface MenuOrderingProps {
  items: MenuItem[];
  cart: OrderItem[];
  onAddToCart: (item: MenuItem) => void;
  onUpdateCartQty: (itemId: string, delta: number) => void;
  onClearCart: () => void;
  onCheckout: (details: {
    table_booth_number: string;
    customer_name: string;
    customer_phone: string;
    payment_method: PaymentGateway;
    notes: string;
  }) => void;
  isCartOpen: boolean;
  onCloseCart: () => void;
  onOpenCart: () => void;
}

export const MenuOrdering: React.FC<MenuOrderingProps> = ({
  items,
  cart,
  onAddToCart,
  onUpdateCartQty,
  onClearCart,
  onCheckout,
  isCartOpen,
  onCloseCart,
  onOpenCart
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  // Checkout form fields
  const [tableBooth, setTableBooth] = useState('');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentGateway>('mtn');
  const [notes, setNotes] = useState('');
  const [formError, setFormError] = useState('');

  // Extract categories
  const categories = useMemo(() => {
    const set = new Set<string>();
    items.forEach(i => set.add(i.category));
    return ['All', ...Array.from(set)];
  }, [items]);

  // Live fuzzy search filtering only visible items
  const filteredItems = useMemo(() => {
    return items.filter(item => {
      if (!item.is_visible) return false;
      const matchesCategory = selectedCategory === 'All' || item.category === selectedCategory;
      const q = searchQuery.toLowerCase().trim();
      const matchesSearch = !q || 
        item.name.toLowerCase().includes(q) || 
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchesCategory && matchesSearch;
    });
  }, [items, selectedCategory, searchQuery]);

  const totalAmount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.total_price, 0);
  }, [cart]);

  const totalItemCount = useMemo(() => {
    return cart.reduce((sum, item) => sum + item.quantity, 0);
  }, [cart]);

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');
    if (!tableBooth.trim()) {
      setFormError('Enter your table or VIP booth number.');
      return;
    }
    if (!customerName.trim()) {
      setFormError('Enter your name for service delivery.');
      return;
    }
    if (!customerPhone.trim()) {
      setFormError('Enter your contact phone number.');
      return;
    }
    if (cart.length === 0) {
      setFormError('Cart is empty. Add drinks or food first.');
      return;
    }

    onCheckout({
      table_booth_number: tableBooth.trim(),
      customer_name: customerName.trim(),
      customer_phone: customerPhone.trim(),
      payment_method: paymentMethod,
      notes: notes.trim()
    });
  };

  return (
    <section id="menu-section" className="py-10 bg-gray-950 text-white relative">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        
        {/* Section Headline matching Screenshot 1 bottom */}
        <div className="mb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-1.5 border border-amber-600/50 bg-amber-950/30 text-amber-300 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider mb-2.5">
              <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
              <span>PHOENIX BAR & KITCHEN MENU</span>
            </div>
            <h2 className="font-serif-display text-2xl sm:text-4xl font-black uppercase tracking-tight text-white leading-tight">
              FINE SPIRITS, ICE COLD BEERS & MASTER GRILLS
            </h2>
            <p className="text-xs sm:text-sm text-gray-400 mt-1">
              Select items below. Orders route straight to the service bar at 12 Freedom Way.
            </p>
          </div>

          {/* Quick Cart Trigger */}
          {cart.length > 0 && (
            <button
              onClick={onOpenCart}
              className="self-start md:self-auto px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-lg flex items-center space-x-2 shadow-lg shadow-amber-500/20"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Review Cart ({totalItemCount} items • ZMW {totalAmount.toFixed(2)})</span>
            </button>
          )}
        </div>

        {/* Live Search Component: Full-width fuzzy search */}
        <div className="relative mb-4">
          <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-gray-400" />
          </div>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Hennessy, Mosi, Braii Wings, Moët, Gin, Platters..."
            className="w-full pl-10 pr-10 py-3 bg-gray-900 border border-gray-800 focus:border-amber-500 rounded-xl text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-amber-500 transition-colors"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Category Pills */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-3 mb-6 custom-scrollbar text-xs font-semibold">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-amber-500 text-black font-bold'
                  : 'bg-gray-900 hover:bg-gray-800 text-gray-300 border border-gray-800'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grid of Menu Items */}
        {filteredItems.length === 0 ? (
          <div className="bg-gray-900/60 border border-gray-800 rounded-xl p-8 text-center text-gray-400 text-sm">
            No active menu items match your search. Try adjusting the query.
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredItems.map(item => {
              const inCart = cart.find(ci => ci.id === item.id);
              return (
                <div
                  key={item.id}
                  className="bg-gray-900 border border-gray-800 hover:border-amber-500/40 rounded-2xl overflow-hidden flex flex-col justify-between transition-colors group shadow-lg"
                >
                  {/* Product Picture Display */}
                  <div className="relative aspect-16/10 w-full bg-black overflow-hidden">
                    <img 
                      src={item.image_url} 
                      alt={item.name} 
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/30 pointer-events-none" />
                    
                    <span className="absolute top-2.5 left-2.5 text-[10px] uppercase font-bold tracking-wider text-amber-300 bg-black/75 backdrop-blur-md px-2.5 py-0.5 rounded-full border border-amber-500/30">
                      {item.category}
                    </span>

                    <span className="absolute bottom-2.5 right-2.5 text-sm font-black text-amber-400 font-mono bg-black/85 px-2.5 py-1 rounded-lg border border-amber-500/40 shadow-lg">
                      ZMW {item.price.toFixed(2)}
                    </span>
                  </div>

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-bold text-white text-base leading-snug group-hover:text-amber-200 transition-colors">
                        {item.name}
                      </h3>
                      <p className="text-xs text-gray-400 mt-1.5 line-clamp-2">
                        {item.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-800/80 flex items-center justify-between">
                      <span className="text-[11px] text-emerald-400 font-medium flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                        In Stock
                      </span>

                      {inCart ? (
                        <div className="flex items-center space-x-2 bg-gray-950 border border-amber-500/40 rounded-lg p-1">
                          <button
                            onClick={() => onUpdateCartQty(item.id, -1)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-gray-800 hover:bg-gray-700 text-white"
                            aria-label="Decrease quantity"
                          >
                            <Minus className="w-3.5 h-3.5" />
                          </button>
                          <span className="w-6 text-center text-xs font-bold text-amber-400 font-mono">
                            {inCart.quantity}
                          </span>
                          <button
                            onClick={() => onUpdateCartQty(item.id, 1)}
                            className="w-7 h-7 flex items-center justify-center rounded bg-amber-500 hover:bg-amber-400 text-black font-bold"
                            aria-label="Increase quantity"
                          >
                            <Plus className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ) : (
                        <button
                          onClick={() => onAddToCart(item)}
                          className="px-3.5 py-1.5 rounded-xl bg-gray-800 hover:bg-amber-500 hover:text-black text-gray-200 font-bold text-xs flex items-center space-x-1.5 transition-colors shadow"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>Add to Order</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

      </div>

      {/* Cart & Checkout Drawer Modal */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="w-full max-w-md bg-gray-950 border-l border-amber-500/30 flex flex-col h-full shadow-2xl overflow-hidden">
            
            {/* Drawer Header */}
            <div className="p-4 border-b border-gray-800 flex items-center justify-between bg-gray-900/60">
              <div className="flex items-center space-x-2">
                <ShoppingBag className="w-5 h-5 text-amber-400" />
                <h3 className="font-extrabold text-white text-base uppercase">Your Order Cart</h3>
              </div>
              <button
                onClick={onCloseCart}
                className="w-8 h-8 rounded-lg bg-gray-800 hover:bg-gray-700 flex items-center justify-center text-gray-300 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Cart Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
              {cart.length === 0 ? (
                <div className="text-center py-12 text-gray-400 text-sm">
                  <ShoppingBag className="w-10 h-10 mx-auto text-gray-600 mb-3" />
                  <p>Your cart is empty.</p>
                  <p className="text-xs text-gray-500 mt-1">Add drinks or food items to dispatch.</p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between text-xs text-gray-400 pb-1 border-b border-gray-800">
                    <span>{totalItemCount} Items Selected</span>
                    <button
                      onClick={onClearCart}
                      className="text-red-400 hover:text-red-300 flex items-center space-x-1"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Empty</span>
                    </button>
                  </div>

                  {cart.map(item => (
                    <div
                      key={item.id}
                      className="p-3 bg-gray-900/80 border border-gray-800 rounded-lg flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-400 font-mono">
                          ZMW {item.price.toFixed(2)} × {item.quantity} = <span className="text-amber-400 font-bold">ZMW {item.total_price.toFixed(2)}</span>
                        </p>
                      </div>

                      <div className="flex items-center space-x-1 bg-gray-950 border border-gray-700 rounded p-0.5">
                        <button
                          onClick={() => onUpdateCartQty(item.id, -1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-gray-800 text-white"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-5 text-center text-xs font-bold text-amber-400 font-mono">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => onUpdateCartQty(item.id, 1)}
                          className="w-6 h-6 flex items-center justify-center rounded bg-amber-500 text-black font-bold"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </>
              )}
            </div>

            {/* Checkout Form */}
            {cart.length > 0 && (
              <form onSubmit={handleFormSubmit} className="p-4 border-t border-gray-800 bg-gray-900/80 space-y-3">
                {formError && (
                  <div className="p-2 rounded bg-red-950/80 border border-red-500/40 text-red-300 text-xs">
                    {formError}
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Table / Booth *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Table 04 / V02"
                      value={tableBooth}
                      onChange={(e) => setTableBooth(e.target.value)}
                      className="w-full p-2 bg-gray-950 border border-gray-700 rounded focus:border-amber-400 text-white focus:outline-none text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 font-semibold mb-1">Your Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Mwape"
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className="w-full p-2 bg-gray-950 border border-gray-700 rounded focus:border-amber-400 text-white focus:outline-none text-xs"
                    />
                  </div>
                </div>

                <div className="text-xs">
                  <label className="block text-gray-300 font-semibold mb-1">Phone Number (MoMo / SMS) *</label>
                  <input
                    type="tel"
                    required
                    placeholder="e.g. 0977 123 456"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    className="w-full p-2 bg-gray-950 border border-gray-700 rounded focus:border-amber-400 text-white focus:outline-none text-xs"
                  />
                </div>

                {/* Payment Gateway Picker */}
                <div className="text-xs">
                  <label className="block text-gray-300 font-semibold mb-1">Payment Method</label>
                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('mtn')}
                      className={`p-2 rounded border text-left flex items-center space-x-2 transition-all ${
                        paymentMethod === 'mtn'
                          ? 'border-yellow-400 bg-yellow-950/40 text-yellow-300 font-bold'
                          : 'border-gray-800 bg-gray-950 text-gray-400'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>MTN MoMo (*115#)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('airtel')}
                      className={`p-2 rounded border text-left flex items-center space-x-2 transition-all ${
                        paymentMethod === 'airtel'
                          ? 'border-red-500 bg-red-950/40 text-red-300 font-bold'
                          : 'border-gray-800 bg-gray-950 text-gray-400'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Airtel Money (*115#)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('zamtel')}
                      className={`p-2 rounded border text-left flex items-center space-x-2 transition-all ${
                        paymentMethod === 'zamtel'
                          ? 'border-emerald-500 bg-emerald-950/40 text-emerald-300 font-bold'
                          : 'border-gray-800 bg-gray-950 text-gray-400'
                      }`}
                    >
                      <Smartphone className="w-3.5 h-3.5" />
                      <span>Zamtel Kwacha</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setPaymentMethod('cash')}
                      className={`p-2 rounded border text-left flex items-center space-x-2 transition-all ${
                        paymentMethod === 'cash'
                          ? 'border-amber-400 bg-amber-950/40 text-amber-300 font-bold'
                          : 'border-gray-800 bg-gray-950 text-gray-400'
                      }`}
                    >
                      <Banknote className="w-3.5 h-3.5" />
                      <span>Cash on Delivery</span>
                    </button>
                  </div>
                </div>

                <div className="text-xs">
                  <input
                    type="text"
                    placeholder="Special requests (e.g. extra ice, lime, urgent)"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className="w-full p-2 bg-gray-950 border border-gray-700 rounded focus:border-amber-400 text-white focus:outline-none text-xs"
                  />
                </div>

                <div className="pt-2 border-t border-gray-800 flex items-center justify-between">
                  <div>
                    <span className="text-xs text-gray-400">Total Payable:</span>
                    <div className="text-xl font-black text-amber-400 font-mono">
                      ZMW {totalAmount.toFixed(2)}
                    </div>
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-sm rounded-xl flex items-center space-x-2 shadow-lg shadow-amber-500/25 active:scale-95 transition-all"
                  >
                    <span>Dispatch Order</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </form>
            )}

          </div>
        </div>
      )}
    </section>
  );
};
