import React, { useState, useEffect, useRef } from 'react';
import { 
  Shield, 
  CheckCircle, 
  XCircle, 
  Download, 
  Eye, 
  EyeOff, 
  Sliders, 
  LogOut, 
  Clock, 
  Banknote, 
  Smartphone, 
  DollarSign, 
  Lock, 
  Save, 
  FileText,
  AlertTriangle,
  RefreshCw,
  Camera,
  Upload,
  Check,
  Trash2,
  Plus,
  Edit3,
  Calendar,
  Tv,
  MapPin,
  Phone,
  Sparkles,
  Flame,
  Image as ImageIcon,
  Tag,
  ArrowRight,
  Crown
} from 'lucide-react';
import { 
  Order, 
  MenuItem, 
  SystemConfig, 
  ManagerAuditSummary, 
  PaymentGateway,
  EventItem,
  AdCampaign,
  VIPBooth
} from '../types';
import { verifyManagerRootCredential } from '../security';
import { processImageFile, isValidImageUrl } from '../utils/imageHandler';

interface StaffCommandHubProps {
  orders: Order[];
  menuItems: MenuItem[];
  events: EventItem[];
  booths?: VIPBooth[];
  config: SystemConfig;
  auditSummary: ManagerAuditSummary;
  onUpdateOrderStatus: (orderId: string, status: Order['order_status']) => void;
  onDeleteOrder: (orderId: string) => void;
  onToggleMenuItem: (itemId: string, is_visible: boolean) => void;
  onAddMenuItem: (item: Omit<MenuItem, 'id'>) => void;
  onUpdateMenuItem: (item: MenuItem) => void;
  onDeleteMenuItem: (itemId: string) => void;
  onUpdateProductImage: (itemId: string, imageDataUrl: string) => void;
  onAddEvent: (event: Omit<EventItem, 'id'>) => void;
  onUpdateEvent: (event: EventItem) => void;
  onDeleteEvent: (eventId: string) => void;
  onUpdateAdSettings: (interval: number, enabled: boolean) => void;
  onUpdateAdCampaign: (ad: AdCampaign) => void;
  onUpdateVenueContacts: (contacts: SystemConfig['venue_contacts']) => void;
  onUpdateGatewayConfig: (gateway: PaymentGateway, merchant_code: string, short_code: string) => void;
  onUpdateBoothConfig?: (booth_code: string, min_spend: number, capacity: number) => void;
  onUpdateBatchPrices?: (prices: { id: string; price: number }[]) => void;
  onLogout: () => void;
}

export const StaffCommandHub: React.FC<StaffCommandHubProps> = ({
  orders,
  menuItems,
  events,
  booths = [],
  config,
  auditSummary,
  onUpdateOrderStatus,
  onDeleteOrder,
  onToggleMenuItem,
  onAddMenuItem,
  onUpdateMenuItem,
  onDeleteMenuItem,
  onUpdateProductImage,
  onAddEvent,
  onUpdateEvent,
  onDeleteEvent,
  onUpdateAdSettings,
  onUpdateAdCampaign,
  onUpdateVenueContacts,
  onUpdateGatewayConfig,
  onUpdateBoothConfig,
  onUpdateBatchPrices,
  onLogout
}) => {
  const [orderFilter, setOrderFilter] = useState<'all' | 'pending' | 'confirmed' | 'dropped'>('all');
  const [activeTab, setActiveTab] = useState<'orders' | 'products' | 'ads' | 'screenings' | 'venue' | 'manager'>('orders');
  
  // Feedback states
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [incomingAlertOrder, setIncomingAlertOrder] = useState<Order | null>(null);

  const previousOrderIdsRef = useRef<Set<string>>(new Set(orders.map(o => o.id)));

  // Sound chime synthesizer for incoming customer orders
  const playOrderArrivalChime = () => {
    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      [587.33, 880, 1174.66].forEach((freq, i) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, now + i * 0.1);
        gain.gain.setValueAtTime(0.18, now + i * 0.1);
        gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.4);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(now + i * 0.1);
        osc.stop(now + i * 0.1 + 0.4);
      });
    } catch {}
  };

  // Detect newly arrived customer orders instantly across all devices
  useEffect(() => {
    const prevSet = previousOrderIdsRef.current;
    const newPending = orders.find(o => !prevSet.has(o.id) && o.order_status === 'pending');
    if (newPending) {
      playOrderArrivalChime();
      setIncomingAlertOrder(newPending);
    }
    previousOrderIdsRef.current = new Set(orders.map(o => o.id));
  }, [orders]);

  const showFeedback = (msg: string) => {
    setFeedbackMsg(msg);
    setTimeout(() => setFeedbackMsg(null), 3500);
  };

  // -------------------------------------------------------------
  // 1. PRODUCT MANAGEMENT STATE
  // -------------------------------------------------------------
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<MenuItem | null>(null);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);

  const [productForm, setProductForm] = useState({
    name: '',
    category: 'Whisky & Cognac',
    price: 0,
    description: '',
    image_url: '',
    in_stock: true,
    is_visible: true
  });
  const [productImageUploading, setProductImageUploading] = useState(false);
  const productFileInputRef = useRef<HTMLInputElement | null>(null);
  const editProductFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenAddProduct = () => {
    setProductForm({
      name: '',
      category: 'Whisky & Cognac',
      price: 100,
      description: '',
      image_url: 'https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=700&auto=format&fit=crop&q=80',
      in_stock: true,
      is_visible: true
    });
    setIsAddProductModalOpen(true);
  };

  const handleOpenEditProduct = (item: MenuItem) => {
    setEditingProduct(item);
    setProductForm({
      name: item.name,
      category: item.category,
      price: item.price,
      description: item.description,
      image_url: item.image_url,
      in_stock: item.in_stock,
      is_visible: item.is_visible
    });
  };

  const handleProductImageUpload = async (file: File, isEditing = false) => {
    try {
      setProductImageUploading(true);
      const dataUrl = await processImageFile(file, 800, 800, 0.85);
      setProductForm(prev => ({ ...prev, image_url: dataUrl }));
      showFeedback('Photo loaded & optimized for mobile and desktop!');
    } catch (err) {
      console.error(err);
      showFeedback('Could not read image file. Please try another photo.');
    } finally {
      setProductImageUploading(false);
    }
  };

  const handleSaveAddProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!productForm.name.trim()) {
      showFeedback('Product name is required.');
      return;
    }
    if (productForm.price <= 0) {
      showFeedback('Price must be greater than zero ZMW.');
      return;
    }
    onAddMenuItem({
      name: productForm.name.trim(),
      category: productForm.category,
      price: Number(productForm.price),
      description: productForm.description.trim(),
      image_url: productForm.image_url || 'https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=700&auto=format&fit=crop&q=80',
      in_stock: productForm.in_stock,
      is_visible: productForm.is_visible
    });
    setIsAddProductModalOpen(false);
    showFeedback(`Product "${productForm.name}" added to catalog.`);
  };

  const handleSaveEditProduct = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    if (!productForm.name.trim()) {
      showFeedback('Product name is required.');
      return;
    }
    onUpdateMenuItem({
      ...editingProduct,
      name: productForm.name.trim(),
      category: productForm.category,
      price: Number(productForm.price),
      description: productForm.description.trim(),
      image_url: productForm.image_url,
      in_stock: productForm.in_stock,
      is_visible: productForm.is_visible
    });
    setEditingProduct(null);
    showFeedback(`Product "${productForm.name}" updated successfully.`);
  };

  const handleConfirmDeleteProduct = (id: string, name: string) => {
    onDeleteMenuItem(id);
    setProductToDelete(null);
    showFeedback(`Product "${name}" removed from catalog.`);
  };

  // -------------------------------------------------------------
  // 2. ADS & PROMOTION CAMPAIGNS STATE
  // -------------------------------------------------------------
  const [adInterval, setAdInterval] = useState(config.ad_interval_seconds);
  const [adEnabled, setAdEnabled] = useState(config.ad_enabled);
  const [adForm, setAdForm] = useState<AdCampaign>(() => config.active_ad || {
    id: 'ad-active',
    badge_text: 'Phoenix Special Promotion',
    title: "Tonight's Signature Braii & Cold Buckets",
    description: 'Order a Phoenix Platter & 6 Mosi Lagers directly to your table with zero wait time.',
    price_tag: 'Special ZMW 850',
    action_text: 'Order To Table',
    action_target: 'menu',
    image_url: 'https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=600&auto=format&fit=crop&q=80',
    is_active: true
  });
  const adFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleAdImageUpload = async (file: File) => {
    try {
      const dataUrl = await processImageFile(file, 800, 600, 0.85);
      setAdForm(prev => ({ ...prev, image_url: dataUrl }));
      showFeedback('Ad banner image loaded & optimized.');
    } catch (err) {
      console.error(err);
      showFeedback('Failed to read image.');
    }
  };

  const handleSaveAdSettings = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateAdSettings(adInterval, adEnabled);
    onUpdateAdCampaign(adForm);
    showFeedback('Ad campaign and overlay frequency settings saved!');
  };

  // -------------------------------------------------------------
  // 3. UPCOMING SCREENINGS & THEME NIGHTS STATE
  // -------------------------------------------------------------
  const [isAddEventModalOpen, setIsAddEventModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<EventItem | null>(null);
  const [eventToDelete, setEventToDelete] = useState<string | null>(null);

  const [eventForm, setEventForm] = useState<Omit<EventItem, 'id'>>({
    category: 'LIVE SPORTS BROADCAST',
    title: '',
    subtitle: '',
    date: 'Sunday • 17:30 CAT',
    description: '',
    tag: 'Big Screens Active',
    badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
    image_url: '',
    is_active: true
  });
  const eventFileInputRef = useRef<HTMLInputElement | null>(null);

  const handleOpenAddEvent = () => {
    setEventForm({
      category: 'LIVE SPORTS BROADCAST',
      title: '',
      subtitle: '',
      date: 'Sunday • 17:30 CAT',
      description: 'Ultra HD 4K Big Screen Projection, synced sound, cold Mosi buckets on promotion.',
      tag: 'Big Screens Active',
      badgeColor: 'bg-red-500/20 text-red-300 border-red-500/40',
      image_url: 'https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80',
      is_active: true
    });
    setIsAddEventModalOpen(true);
  };

  const handleOpenEditEvent = (ev: EventItem) => {
    setEditingEvent(ev);
    setEventForm({
      category: ev.category,
      title: ev.title,
      subtitle: ev.subtitle,
      date: ev.date,
      description: ev.description,
      tag: ev.tag,
      badgeColor: ev.badgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/40',
      image_url: ev.image_url || '',
      is_active: ev.is_active !== false
    });
  };

  const handleEventImageUpload = async (file: File) => {
    try {
      const dataUrl = await processImageFile(file, 900, 600, 0.85);
      setEventForm(prev => ({ ...prev, image_url: dataUrl }));
      showFeedback('Event poster image loaded.');
    } catch (err) {
      console.error(err);
      showFeedback('Failed to read image.');
    }
  };

  const handleSaveAddEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventForm.title.trim()) {
      showFeedback('Event title is required.');
      return;
    }
    onAddEvent(eventForm);
    setIsAddEventModalOpen(false);
    showFeedback(`Event "${eventForm.title}" added to calendar.`);
  };

  const handleSaveEditEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingEvent) return;
    if (!eventForm.title.trim()) {
      showFeedback('Event title is required.');
      return;
    }
    onUpdateEvent({
      ...editingEvent,
      ...eventForm
    });
    setEditingEvent(null);
    showFeedback(`Event "${eventForm.title}" updated.`);
  };

  const handleConfirmDeleteEvent = (id: string, title: string) => {
    onDeleteEvent(id);
    setEventToDelete(null);
    showFeedback(`Event "${title}" removed.`);
  };

  // -------------------------------------------------------------
  // 4. VENUE CONTACTS & OPERATIONAL HOURS STATE
  // -------------------------------------------------------------
  const [venueContacts, setVenueContacts] = useState(config.venue_contacts);

  // Keep venueContacts, momo merchants, and ads in live sync with config updates from Firestore
  React.useEffect(() => {
    if (config) {
      setVenueContacts(config.venue_contacts);
      setAirtelMerchant(config.momo_gateways.airtel.merchant_code);
      setMtnMerchant(config.momo_gateways.mtn.merchant_code);
      setZamtelMerchant(config.momo_gateways.zamtel.merchant_code);
      setAdInterval(config.ad_interval_seconds);
      setAdEnabled(config.ad_enabled);
      if (config.active_ad) setAdForm(config.active_ad);
    }
  }, [config]);

  const handleSaveVenueContacts = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateVenueContacts(venueContacts);
    showFeedback('Venue phone numbers, operational hours & address updated live across all devices!');
  };

  // -------------------------------------------------------------
  // 5. MANAGER ROOT SECURITY & GATEWAYS
  // -------------------------------------------------------------
  const [managerUnlocked, setManagerUnlocked] = useState(false);
  const [managerKeyInput, setManagerKeyInput] = useState('');
  const [managerKeyError, setManagerKeyError] = useState('');

  const [airtelMerchant, setAirtelMerchant] = useState(config.momo_gateways.airtel.merchant_code);
  const [mtnMerchant, setMtnMerchant] = useState(config.momo_gateways.mtn.merchant_code);
  const [zamtelMerchant, setZamtelMerchant] = useState(config.momo_gateways.zamtel.merchant_code);

  // Master Numbers & Prices State
  const [managerPrices, setManagerPrices] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    menuItems.forEach(m => { init[m.id] = m.price; });
    return init;
  });

  React.useEffect(() => {
    setManagerPrices(prev => {
      const next = { ...prev };
      menuItems.forEach(m => {
        if (next[m.id] === undefined) next[m.id] = m.price;
      });
      return next;
    });
  }, [menuItems]);

  const [managerBoothsState, setManagerBoothsState] = useState<{ [code: string]: { min_spend: number; capacity: number } }>(() => {
    const map: { [code: string]: { min_spend: number; capacity: number } } = {};
    booths.forEach(b => {
      map[b.booth_code] = { min_spend: b.min_spend, capacity: b.capacity };
    });
    return map;
  });

  React.useEffect(() => {
    setManagerBoothsState(prev => {
      const next = { ...prev };
      booths.forEach(b => {
        if (!next[b.booth_code]) {
          next[b.booth_code] = { min_spend: b.min_spend, capacity: b.capacity };
        }
      });
      return next;
    });
  }, [booths]);

  const handleSaveAllPrices = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBatchPrices) {
      const updates = Object.entries(managerPrices).map(([id, price]) => ({ id, price: Number(price) }));
      onUpdateBatchPrices(updates);
      showFeedback('All drink & food product prices updated across all guest devices live!');
    }
  };

  const handleSaveAllBooths = (e: React.FormEvent) => {
    e.preventDefault();
    if (onUpdateBoothConfig) {
      Object.entries(managerBoothsState).forEach(([code, data]) => {
        onUpdateBoothConfig(code, Number(data.min_spend), Number(data.capacity));
      });
      showFeedback('VIP Booth minimum spend amounts & capacities updated across the app!');
    }
  };

  const handleUnlockManager = async (e: React.FormEvent) => {
    e.preventDefault();
    setManagerKeyError('');
    if (!managerKeyInput.trim()) {
      setManagerKeyError('Master Root Key is required.');
      return;
    }
    const isValid = await verifyManagerRootCredential(managerKeyInput.trim());
    if (isValid) {
      setManagerUnlocked(true);
      setManagerKeyError('');
      setManagerKeyInput('');
      showFeedback('Master Manager Root Key verified.');
    } else {
      setManagerKeyError('Access Denied: Invalid Master Root Key.');
    }
  };

  const handleSaveGateways = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateGatewayConfig('airtel', airtelMerchant, '*115#');
    onUpdateGatewayConfig('mtn', mtnMerchant, '*115#');
    onUpdateGatewayConfig('zamtel', zamtelMerchant, '*115#');
    showFeedback('Mobile money merchant routing codes updated.');
  };

  // -------------------------------------------------------------
  // ORDERS DISPATCH & MANIFEST & RECEIPTS
  // -------------------------------------------------------------
  const filteredOrders = orders.filter(o => {
    if (orderFilter === 'all') return true;
    return o.order_status === orderFilter;
  });

  const handleDownloadManifest = () => {
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    let text = `=======================================================\n`;
    text += `PHOENIX LOUNGE KABWE - ACTIVE ORDERS MANIFEST\n`;
    text += `VENUE: 12 FREEDOM WAY, KABWE\n`;
    text += `TIMESTAMP: ${new Date().toLocaleString()}\n`;
    text += `=======================================================\n\n`;

    orders.forEach((o, idx) => {
      text += `[#${idx + 1}] REF: ${o.order_ref} | TABLE: ${o.table_booth_number}\n`;
      text += `CUSTOMER: ${o.customer_name} (${o.customer_phone})\n`;
      text += `STATUS: ${o.order_status.toUpperCase()} | PAYMENT: ${o.payment_method.toUpperCase()} (${o.payment_status.toUpperCase()})\n`;
      text += `ITEMS:\n`;
      o.items.forEach(it => {
        text += `   - ${it.quantity}x ${it.name} [ZMW ${it.total_price.toFixed(2)}]\n`;
      });
      if (o.notes) text += `NOTE: ${o.notes}\n`;
      text += `TOTAL: ZMW ${o.total_amount_zmw.toFixed(2)}\n`;
      text += `-------------------------------------------------------\n`;
    });

    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Phoenix_Manifest_${timestamp}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleDownloadReceipt = (order: Order) => {
    const text = `======================================================
           PHOENIX LOUNGE KABWE
       Premier VIP Lounge & Nightclub
         12 Freedom Way, Kabwe, Zambia
           Hotline: ${config.venue_contacts.hotline}
======================================================
OFFICIAL ORDER RECEIPT: ${order.order_ref}
DATE: ${new Date(order.created_at).toLocaleString()}
${order.confirmed_at ? `CONFIRMED: ${new Date(order.confirmed_at).toLocaleString()}\n` : ''}TABLE / BOOTH: ${order.table_booth_number}
CUSTOMER: ${order.customer_name} (${order.customer_phone})
STATUS: ${order.order_status.toUpperCase()}
PAYMENT: ${order.payment_method.toUpperCase()} (${order.payment_status.toUpperCase()})
------------------------------------------------------
ITEMS ORDERED:
${order.items.map(it => ` - ${it.quantity}x ${it.name.padEnd(28, ' ')} ZMW ${it.total_price.toFixed(2)}`).join('\n')}
------------------------------------------------------
TOTAL AMOUNT: ZMW ${order.total_amount_zmw.toFixed(2)}
======================================================
Verified by Phoenix Lounge Staff
Design by HUMPHREY NKOBENI • Phoenix Lounge Kabwe
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

  const handleConfirmDeleteOrder = (orderId: string, orderRef: string) => {
    onDeleteOrder(orderId);
    setOrderToDelete(null);
    showFeedback(`Receipt & order ${orderRef} deleted permanently.`);
  };

  const categories = Array.from(new Set(menuItems.map(m => m.category)));
  if (!categories.includes('Whisky & Cognac')) categories.push('Whisky & Cognac');
  if (!categories.includes('Vodka & Gin')) categories.push('Vodka & Gin');
  if (!categories.includes('Champagne')) categories.push('Champagne');
  if (!categories.includes('Beers & Ciders')) categories.push('Beers & Ciders');
  if (!categories.includes('Grills & Platters')) categories.push('Grills & Platters');

  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col selection:bg-amber-500 selection:text-black">
      
      {/* Top Navigation Bar */}
      <header className="sticky top-0 z-40 bg-gray-950/95 backdrop-blur border-b border-gray-800 px-4 sm:px-6 py-3">
        <div className="max-w-7xl mx-auto flex flex-wrap items-center justify-between gap-3">
          
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-amber-600 to-red-600 flex items-center justify-center text-black font-black shadow-lg shadow-amber-500/20">
              <Shield className="w-5 h-5 text-black" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="text-[10px] font-bold text-emerald-400 bg-emerald-950/80 px-2 py-0.5 rounded border border-emerald-500/30 uppercase tracking-widest">
                  Staff Command Hub
                </span>
                <span className="text-[10px] text-gray-400 font-mono">12 Freedom Way</span>
              </div>
              <h1 className="font-serif-display text-base sm:text-lg font-black tracking-wide text-white">
                Phoenix Lounge Operations Console
              </h1>
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={handleDownloadManifest}
              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-amber-300 text-xs font-bold rounded-xl flex items-center space-x-1.5 border border-amber-500/30 transition-colors"
              title="Download text order manifest for kitchen & bar"
            >
              <Download className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Export Kitchen Manifest</span>
              <span className="sm:hidden">Manifest</span>
            </button>

            <button
              onClick={onLogout}
              className="px-3.5 py-1.5 bg-red-950/70 hover:bg-red-900 text-red-200 text-xs font-bold rounded-xl flex items-center space-x-1.5 border border-red-500/40 transition-colors shadow-md"
              title="Log out from Staff Command Hub session"
            >
              <LogOut className="w-3.5 h-3.5 text-red-400" />
              <span>Log Out</span>
            </button>
          </div>

        </div>
      </header>

      {/* Incoming New Customer Order Alert Banner for Staff */}
      {incomingAlertOrder && (
        <div className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-500 text-black px-4 sm:px-6 py-3 flex flex-wrap items-center justify-between gap-3 shadow-2xl animate-in fade-in border-b border-amber-600">
          <div className="flex items-center space-x-2.5 text-xs font-black">
            <span className="w-3 h-3 rounded-full bg-red-600 animate-ping"></span>
            <span>
              🔔 NEW INCOMING ORDER: Table <strong className="underline">{incomingAlertOrder.table_booth_number}</strong> • Ref <strong className="font-mono">{incomingAlertOrder.order_ref}</strong> ({incomingAlertOrder.customer_name}) • Total: <strong className="font-mono">ZMW {incomingAlertOrder.total_amount_zmw.toFixed(2)}</strong>
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                onUpdateOrderStatus(incomingAlertOrder.id, 'confirmed');
                setIncomingAlertOrder(null);
                showFeedback(`Order ${incomingAlertOrder.order_ref} verified & dispatched to bar/kitchen!`);
              }}
              className="px-4 py-1.5 bg-black hover:bg-gray-900 text-amber-300 hover:text-white rounded-xl text-xs font-black flex items-center space-x-1.5 shadow-lg transition-transform active:scale-95"
            >
              <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
              <span>Confirm & Dispatch</span>
            </button>
            <button 
              onClick={() => setIncomingAlertOrder(null)}
              className="p-1.5 bg-black/20 hover:bg-black/40 text-black rounded-lg text-xs font-bold"
              aria-label="Dismiss alert"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* Global Feedback Toast */}
      {feedbackMsg && (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-3 w-full">
          <div className="p-3 bg-emerald-950 border border-emerald-500/60 text-emerald-200 rounded-xl text-xs font-bold flex items-center justify-between shadow-xl animate-in fade-in">
            <div className="flex items-center space-x-2">
              <Check className="w-4 h-4 text-emerald-400" />
              <span>{feedbackMsg}</span>
            </div>
            <button onClick={() => setFeedbackMsg(null)} className="text-emerald-400 hover:text-white text-xs">✕</button>
          </div>
        </div>
      )}

      {/* Main Content Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 py-5 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center space-x-2 overflow-x-auto pb-2 custom-scrollbar text-xs font-extrabold border-b border-gray-800">
          <button
            onClick={() => setActiveTab('orders')}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all ${
              activeTab === 'orders'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Live Orders & Receipts ({orders.length})</span>
            {orders.filter(o => o.order_status === 'pending').length > 0 && (
              <span className="ml-1 px-2 py-0.5 rounded-full bg-red-600 text-white text-[10px] font-black animate-pulse">
                {orders.filter(o => o.order_status === 'pending').length} PENDING
              </span>
            )}
          </button>

          <button
            onClick={() => setActiveTab('products')}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all ${
              activeTab === 'products'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Tag className="w-4 h-4" />
            <span>Products & Prices ({menuItems.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('ads')}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all ${
              activeTab === 'ads'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            <span>Ads & Promotions</span>
          </button>

          <button
            onClick={() => setActiveTab('screenings')}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all ${
              activeTab === 'screenings'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Tv className="w-4 h-4" />
            <span>Screenings & Theme Nights ({events.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('venue')}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all ${
              activeTab === 'venue'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            <span>Operating Hours & Venue</span>
          </button>

          <button
            onClick={() => setActiveTab('manager')}
            className={`px-4 py-2.5 rounded-xl whitespace-nowrap flex items-center space-x-2 transition-all ${
              activeTab === 'manager'
                ? 'bg-amber-500 text-black shadow-lg shadow-amber-500/20'
                : 'bg-gray-900 text-gray-400 hover:text-white'
            }`}
          >
            <Lock className="w-4 h-4" />
            <span>Manager Root & MoMo</span>
          </button>
        </div>

        {/* ------------------------------------------------------------- */}
        {/* TAB 1: LIVE ORDERS & RECEIPTS                                  */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'orders' && (
          <div className="space-y-4">
            
            {/* Filter Tabs */}
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center space-x-1.5 text-xs font-bold">
                {(['all', 'pending', 'confirmed', 'dropped'] as const).map(f => (
                  <button
                    key={f}
                    onClick={() => setOrderFilter(f)}
                    className={`px-3 py-1.5 rounded-lg uppercase tracking-wider transition-all ${
                      orderFilter === f
                        ? 'bg-amber-500 text-black font-black'
                        : 'bg-gray-900 text-gray-400 hover:text-white border border-gray-800'
                    }`}
                  >
                    {f} ({orders.filter(o => f === 'all' ? true : o.order_status === f).length})
                  </button>
                ))}
              </div>

              <span className="text-xs text-gray-400 font-mono">
                Staff can delete any unneeded receipt or confirm orders to dispatch
              </span>
            </div>

            {filteredOrders.length === 0 ? (
              <div className="p-12 bg-gray-950 border border-gray-800 rounded-2xl text-center text-gray-400 text-sm">
                No receipts or orders found under this filter.
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {filteredOrders.map(order => (
                  <div
                    key={order.id}
                    className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col justify-between shadow-xl"
                  >
                    <div>
                      <div className="flex items-center justify-between text-xs mb-2">
                        <span className="font-mono font-black text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                          {order.table_booth_number} • {order.order_ref}
                        </span>
                        <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                          order.order_status === 'confirmed' ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40' :
                          order.order_status === 'dropped' ? 'bg-red-950 text-red-400 border border-red-500/40' :
                          'bg-amber-950 text-amber-400 border border-amber-500/40 animate-pulse'
                        }`}>
                          {order.order_status}
                        </span>
                      </div>

                      <div className="text-xs space-y-0.5 mb-3">
                        <p className="font-bold text-white text-sm">{order.customer_name}</p>
                        <p className="text-gray-400 font-mono">{order.customer_phone}</p>
                        <p className="text-[11px] text-gray-400">
                          Payment: <strong className="text-white uppercase font-mono">{order.payment_method}</strong> ({order.payment_status})
                        </p>
                      </div>

                      {/* Items */}
                      <div className="p-2.5 bg-gray-950/80 rounded-xl border border-gray-800 space-y-1.5 text-xs">
                        {order.items.map((it, idx) => (
                          <div key={idx} className="flex justify-between items-center text-gray-300">
                            <span>{it.quantity}x {it.name}</span>
                            <span className="font-mono text-amber-400 font-semibold">ZMW {it.total_price.toFixed(2)}</span>
                          </div>
                        ))}
                        {order.notes && (
                          <p className="pt-1.5 border-t border-gray-800 text-[11px] text-gray-400 italic">
                            "{order.notes}"
                          </p>
                        )}
                      </div>

                      <div className="mt-3 flex items-center justify-between text-xs">
                        <span className="text-gray-400">Total:</span>
                        <span className="text-base font-black text-amber-400 font-mono">
                          ZMW {order.total_amount_zmw.toFixed(2)}
                        </span>
                      </div>
                    </div>

                    {/* Operational Action Buttons */}
                    <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
                      <div className="flex items-center space-x-2">
                        {order.order_status !== 'confirmed' ? (
                          <button
                            onClick={() => {
                              onUpdateOrderStatus(order.id, 'confirmed');
                              showFeedback(`Order ${order.order_ref} verified & dispatched to bar/kitchen!`);
                            }}
                            className="flex-1 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-black flex items-center justify-center space-x-1.5 shadow-lg shadow-emerald-900/40 transition-transform active:scale-95"
                          >
                            <CheckCircle className="w-4 h-4 text-white" />
                            <span>✓ Confirm & Dispatch to Bar/Kitchen</span>
                          </button>
                        ) : (
                          <div className="flex-1 py-2 bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5">
                            <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                            <span>Verified by Staff [Dispatched]</span>
                          </div>
                        )}

                        {order.order_status !== 'dropped' && (
                          <button
                            onClick={() => {
                              onUpdateOrderStatus(order.id, 'dropped');
                              showFeedback(`Order ${order.order_ref} dropped.`);
                            }}
                            className="py-2 px-3 bg-red-950/60 hover:bg-red-900 border border-red-500/40 text-red-200 rounded-xl text-xs font-bold flex items-center justify-center space-x-1"
                            title="Cancel / Drop Order"
                          >
                            <XCircle className="w-3.5 h-3.5" />
                            <span>Drop</span>
                          </button>
                        )}
                      </div>

                      {/* Receipt Management: Download & Delete Any Unneeded Receipt */}
                      {orderToDelete === order.id ? (
                        <div className="p-2.5 bg-red-950 border border-red-500/60 rounded-xl space-y-2 animate-in fade-in">
                          <p className="text-[11px] text-red-200 font-bold text-center">
                            Permanently delete receipt {order.order_ref}?
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleConfirmDeleteOrder(order.id, order.order_ref)}
                              className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg text-[11px]"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setOrderToDelete(null)}
                              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-lg text-[11px]"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => handleDownloadReceipt(order)}
                            className="flex-1 py-1.5 bg-gray-950 hover:bg-gray-800 border border-gray-700 hover:border-amber-500/40 text-gray-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors"
                            title="Download Receipt Text Pass"
                          >
                            <Download className="w-3.5 h-3.5 text-amber-400" />
                            <span>Receipt Pass</span>
                          </button>

                          <button
                            onClick={() => setOrderToDelete(order.id)}
                            className="py-1.5 px-3 bg-red-950/40 hover:bg-red-900/80 border border-red-500/30 text-red-400 hover:text-red-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1 transition-colors"
                            title="Staff can delete any unneeded receipt"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Delete Receipt</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 2: PRODUCTS & PRICES MANAGEMENT                            */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'products' && (
          <div className="space-y-4">
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <h3 className="font-bold text-white text-base">
                  Live Product Catalog & Menu Pricing Management
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Staff can edit prices, product names, categories, descriptions, add new items, or remove products. Any photo format uploads effortlessly on laptop & mobile.
                </p>
              </div>

              <button
                onClick={handleOpenAddProduct}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 shrink-0 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>Add New Product</span>
              </button>
            </div>

            {/* Product Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {menuItems.map(item => (
                <div
                  key={item.id}
                  className={`rounded-2xl border overflow-hidden flex flex-col justify-between transition-all shadow-lg ${
                    item.is_visible
                      ? 'bg-gray-900 border-gray-800 hover:border-gray-700'
                      : 'bg-red-950/20 border-red-900/40 opacity-75'
                  }`}
                >
                  {/* Photo with Responsive Aspect Ratio */}
                  <div className="w-full h-44 bg-black relative overflow-hidden group">
                    <img
                      src={item.image_url}
                      alt={item.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/30" />
                    
                    <span className="absolute top-3 left-3 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/80 backdrop-blur border border-amber-500/30 text-amber-400">
                      {item.category}
                    </span>

                    <span className="absolute bottom-3 right-3 text-sm font-black font-mono px-2.5 py-1 rounded-lg bg-amber-500 text-black shadow-lg">
                      ZMW {item.price.toFixed(2)}
                    </span>
                  </div>

                  {/* Body Info */}
                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      <h4 className="font-bold text-white text-base leading-snug">
                        {item.name}
                      </h4>
                      <p className="text-xs text-gray-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.description}
                      </p>
                    </div>

                    {/* Action Bar */}
                    <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditProduct(item)}
                          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border border-gray-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Details & Price</span>
                        </button>

                        <button
                          onClick={() => onToggleMenuItem(item.id, !item.is_visible)}
                          className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center space-x-1 transition-colors ${
                            item.is_visible
                              ? 'bg-gray-800 hover:bg-gray-700 text-gray-300'
                              : 'bg-red-950 hover:bg-red-900 text-red-200 border border-red-500/30'
                          }`}
                          title={item.is_visible ? 'Hide from customer menu' : 'Unhide on menu'}
                        >
                          {item.is_visible ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                          <span className="hidden sm:inline">{item.is_visible ? 'Visible' : 'Hidden'}</span>
                        </button>
                      </div>

                      {productToDelete === item.id ? (
                        <div className="p-2.5 bg-red-950 border border-red-500/60 rounded-xl space-y-2 animate-in fade-in">
                          <p className="text-[11px] text-red-200 font-bold text-center">
                            Remove "{item.name}" from catalog?
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleConfirmDeleteProduct(item.id, item.name)}
                              className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg text-xs"
                            >
                              Yes, Remove
                            </button>
                            <button
                              onClick={() => setProductToDelete(null)}
                              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setProductToDelete(item.id)}
                          className="w-full py-1.5 bg-red-950/30 hover:bg-red-900/60 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Product</span>
                        </button>
                      )}
                    </div>

                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 3: ADS & PROMOTIONS CAMPAIGN MANAGER                       */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'ads' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Form to Post / Edit Ads */}
            <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl space-y-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                  Ad Campaign & Overlay Engine
                </span>
                <h3 className="text-lg font-black text-white mt-1">
                  Post & Edit Active Ad Promotion
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Customize the banner, headline, pricing tag, and display frequency interval shown to guests.
                </p>
              </div>

              <form onSubmit={handleSaveAdSettings} className="space-y-4 text-xs">
                
                {/* Master Switch & Interval */}
                <div className="p-3.5 bg-black border border-gray-800 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div className="flex items-center space-x-3">
                    <input
                      type="checkbox"
                      id="ad-enabled-toggle"
                      checked={adEnabled}
                      onChange={(e) => {
                        setAdEnabled(e.target.checked);
                        setAdForm(prev => ({ ...prev, is_active: e.target.checked }));
                      }}
                      className="w-5 h-5 rounded text-amber-500 focus:ring-amber-500 bg-gray-900 border-gray-700"
                    />
                    <div>
                      <label htmlFor="ad-enabled-toggle" className="font-bold text-white cursor-pointer text-sm">
                        Ad Pop-up Overlay Active
                      </label>
                      <p className="text-[11px] text-gray-400">
                        {adEnabled ? 'Ads appear periodically to guests.' : 'Ads are turned OFF completely.'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center space-x-2">
                    <span className="text-gray-400">Frequency:</span>
                    <select
                      value={adInterval}
                      onChange={(e) => setAdInterval(Number(e.target.value))}
                      className="bg-gray-900 border border-gray-700 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold"
                    >
                      <option value={10}>Every 10 sec</option>
                      <option value={15}>Every 15 sec</option>
                      <option value={30}>Every 30 sec</option>
                      <option value={60}>Every 60 sec</option>
                      <option value={120}>Every 2 min</option>
                    </select>
                  </div>
                </div>

                {/* Ad Content Fields */}
                <div className="space-y-3">
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Badge / Tagline</label>
                    <input
                      type="text"
                      value={adForm.badge_text}
                      onChange={(e) => setAdForm({ ...adForm, badge_text: e.target.value })}
                      placeholder="e.g. Phoenix Special Promotion, VIP Flash Deal"
                      className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Headline / Ad Title</label>
                    <input
                      type="text"
                      value={adForm.title}
                      onChange={(e) => setAdForm({ ...adForm, title: e.target.value })}
                      placeholder="e.g. Tonight's Signature Braii & Cold Buckets"
                      className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 font-bold"
                    />
                  </div>

                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Description / Subtitle</label>
                    <textarea
                      value={adForm.description}
                      onChange={(e) => setAdForm({ ...adForm, description: e.target.value })}
                      rows={2}
                      placeholder="Order details or deal breakdown..."
                      className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Price Tag Highlight</label>
                      <input
                        type="text"
                        value={adForm.price_tag || ''}
                        onChange={(e) => setAdForm({ ...adForm, price_tag: e.target.value })}
                        placeholder="e.g. Special ZMW 850"
                        className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-amber-500 font-mono"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Action Button Text</label>
                      <input
                        type="text"
                        value={adForm.action_text}
                        onChange={(e) => setAdForm({ ...adForm, action_text: e.target.value })}
                        placeholder="e.g. Order To Table, Book VIP"
                        className="w-full bg-black border border-gray-800 rounded-xl px-3 py-2 text-white focus:border-amber-500"
                      />
                    </div>
                  </div>

                  {/* Ad Banner Image */}
                  <div>
                    <label className="block text-gray-300 font-bold mb-1">Ad Banner Photo (Any photo format supported)</label>
                    <div className="flex items-center space-x-2">
                      <input
                        type="text"
                        value={adForm.image_url || ''}
                        onChange={(e) => setAdForm({ ...adForm, image_url: e.target.value })}
                        placeholder="Image URL or upload below..."
                        className="flex-1 bg-black border border-gray-800 rounded-xl px-3 py-2 text-white text-xs"
                      />
                      <input
                        type="file"
                        ref={adFileInputRef}
                        accept="image/*"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleAdImageUpload(file);
                        }}
                        className="hidden"
                      />
                      <button
                        type="button"
                        onClick={() => adFileInputRef.current?.click()}
                        className="px-3 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 rounded-xl font-bold flex items-center space-x-1.5 shrink-0"
                      >
                        <Camera className="w-4 h-4" />
                        <span>Upload Photo</span>
                      </button>
                    </div>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all"
                >
                  <Save className="w-4 h-4" />
                  <span>Save & Publish Ad Campaign</span>
                </button>
              </form>
            </div>

            {/* Live Preview of Ad */}
            <div className="p-5 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                  Live Guest Preview
                </span>
                <h4 className="text-sm font-bold text-white mt-1 mb-4">
                  How guests see your promotion popup:
                </h4>

                <div className="bg-gray-950 border-2 border-amber-500/70 rounded-2xl overflow-hidden shadow-2xl relative text-white max-w-sm mx-auto">
                  {adForm.image_url && (
                    <div className="w-full h-36 overflow-hidden relative bg-black">
                      <img 
                        src={adForm.image_url} 
                        alt="Ad preview" 
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-950 via-transparent to-black/30" />
                    </div>
                  )}

                  <div className="p-4">
                    <div className="flex items-center space-x-1.5 text-amber-400 text-[11px] font-black uppercase tracking-wider mb-1">
                      <Flame className="w-3.5 h-3.5 fill-amber-400" />
                      <span>{adForm.badge_text || 'Phoenix Promotion'}</span>
                    </div>

                    <h4 className="font-black text-sm text-white leading-snug">
                      {adForm.title || 'Special Promotion Title'}
                    </h4>
                    <p className="text-xs text-gray-300 mt-1 leading-relaxed">
                      {adForm.description || 'Promotion details and customer offer appear here.'}
                    </p>

                    <div className="mt-3.5 flex items-center justify-between pt-2.5 border-t border-gray-800">
                      <span className="text-xs text-amber-400 font-black font-mono">
                        {adForm.price_tag || 'Special Offer'}
                      </span>
                      <div className="px-3 py-1.5 bg-amber-500 text-black font-black text-xs rounded-lg flex items-center space-x-1">
                        <span>{adForm.action_text || 'Order To Table'}</span>
                        <ArrowRight className="w-3 h-3 text-black" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-black rounded-xl border border-gray-800 text-center text-xs text-gray-400">
                Current Status: <strong className={adEnabled ? 'text-emerald-400' : 'text-red-400'}>{adEnabled ? 'Active (Displaying every ' + adInterval + 's)' : 'Turned OFF'}</strong>
              </div>
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 4: UPCOMING SCREENINGS & THEME NIGHTS                      */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'screenings' && (
          <div className="space-y-4">
            
            <div className="p-4 bg-gray-900 border border-gray-800 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-lg">
              <div>
                <h3 className="font-bold text-white text-base">
                  Upcoming Screenings & Theme Nights Calendar
                </h3>
                <p className="text-xs text-gray-400 mt-0.5">
                  Staff can post upcoming big match screenings, guest DJ sessions, and theme nights with photos and schedules.
                </p>
              </div>

              <button
                onClick={handleOpenAddEvent}
                className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 shrink-0 transition-transform active:scale-95"
              >
                <Plus className="w-4 h-4 text-black" />
                <span>Add Event / Screening</span>
              </button>
            </div>

            {/* Events Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {events.map(ev => (
                <div
                  key={ev.id}
                  className="bg-gray-900 border border-gray-800 rounded-2xl overflow-hidden flex flex-col justify-between shadow-xl"
                >
                  {ev.image_url && (
                    <div className="w-full h-36 bg-black overflow-hidden relative">
                      <img src={ev.image_url} alt={ev.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-gray-900 via-transparent to-black/30" />
                      <span className="absolute top-2.5 left-2.5 text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-black/80 border border-amber-500/30 text-amber-400">
                        {ev.category}
                      </span>
                    </div>
                  )}

                  <div className="p-4 flex-1 flex flex-col justify-between">
                    <div>
                      {!ev.image_url && (
                        <div className="flex items-center justify-between gap-2 mb-2">
                          <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded border ${ev.badgeColor || 'bg-amber-500/20 text-amber-300 border-amber-500/40'}`}>
                            {ev.category}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center text-[11px] text-gray-400 font-mono gap-1 mb-1">
                        <Clock className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                        <span>{ev.date}</span>
                      </div>

                      <h4 className="font-black text-base text-white mt-1">
                        {ev.title}
                      </h4>
                      <p className="text-xs text-amber-400 font-semibold mb-1">
                        {ev.subtitle}
                      </p>
                      <p className="text-xs text-gray-400 leading-relaxed">
                        {ev.description}
                      </p>
                    </div>

                    <div className="mt-4 pt-3 border-t border-gray-800 space-y-2">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => handleOpenEditEvent(ev)}
                          className="flex-1 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 rounded-xl text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors border border-gray-700"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          <span>Edit Event</span>
                        </button>

                        <button
                          onClick={() => onUpdateEvent({ ...ev, is_active: ev.is_active === false ? true : false })}
                          className={`py-2 px-3 rounded-xl text-xs font-bold transition-colors ${
                            ev.is_active !== false
                              ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30'
                              : 'bg-gray-800 text-gray-400'
                          }`}
                        >
                          {ev.is_active !== false ? 'Active' : 'Hidden'}
                        </button>
                      </div>

                      {eventToDelete === ev.id ? (
                        <div className="p-2.5 bg-red-950 border border-red-500/60 rounded-xl space-y-2 animate-in fade-in">
                          <p className="text-[11px] text-red-200 font-bold text-center">
                            Delete "{ev.title}"?
                          </p>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => handleConfirmDeleteEvent(ev.id, ev.title)}
                              className="flex-1 py-1.5 bg-red-600 hover:bg-red-500 text-white font-black rounded-lg text-xs"
                            >
                              Yes, Delete
                            </button>
                            <button
                              onClick={() => setEventToDelete(null)}
                              className="px-3 py-1.5 bg-gray-900 hover:bg-gray-800 text-gray-300 font-bold rounded-lg text-xs"
                            >
                              Cancel
                            </button>
                          </div>
                        </div>
                      ) : (
                        <button
                          onClick={() => setEventToDelete(ev.id)}
                          className="w-full py-1.5 bg-red-950/30 hover:bg-red-900/60 border border-red-500/20 hover:border-red-500/50 text-red-400 hover:text-red-200 rounded-lg text-xs font-bold flex items-center justify-center space-x-1.5 transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Delete Event</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 5: OPERATING HOURS & VENUE LOCATION                        */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'venue' && (
          <div className="max-w-2xl mx-auto p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl space-y-5">
            <div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-500/30">
                Venue Operations & Branding
              </span>
              <h3 className="text-lg font-black text-white mt-1">
                Edit Operating Hours, Location & Hotlines
              </h3>
              <p className="text-xs text-gray-400 mt-0.5">
                Changes update immediately across the entire app and footer.
              </p>
            </div>

            <form onSubmit={handleSaveVenueContacts} className="space-y-4 text-xs">
              <div>
                <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-amber-500" />
                  <span>Operating Hours</span>
                </label>
                <input
                  type="text"
                  value={venueContacts.hours}
                  onChange={(e) => setVenueContacts({ ...venueContacts, hours: e.target.value })}
                  placeholder="e.g. Monday - Sunday: 16:00 - 06:00 CAT"
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5 text-amber-500" />
                  <span>Location Address</span>
                </label>
                <input
                  type="text"
                  value={venueContacts.address}
                  onChange={(e) => setVenueContacts({ ...venueContacts, address: e.target.value })}
                  placeholder="e.g. 12 Freedom Way, Kabwe, Zambia"
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-medium focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>Primary VIP Table Hotline</span>
                  </label>
                  <input
                    type="text"
                    value={venueContacts.hotline}
                    onChange={(e) => setVenueContacts({ ...venueContacts, hotline: e.target.value })}
                    placeholder="+260 979 181461"
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-amber-500" />
                    <span>Alternative Management Line</span>
                  </label>
                  <input
                    type="text"
                    value={venueContacts.alt_phone}
                    onChange={(e) => setVenueContacts({ ...venueContacts, alt_phone: e.target.value })}
                    placeholder="+260 966 312 905"
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                    <Smartphone className="w-3.5 h-3.5 text-emerald-400" />
                    <span>WhatsApp Orders & Bookings</span>
                  </label>
                  <input
                    type="text"
                    value={venueContacts.whatsapp || venueContacts.hotline}
                    onChange={(e) => setVenueContacts({ ...venueContacts, whatsapp: e.target.value })}
                    placeholder="+260 979 181461"
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1 flex items-center gap-1.5">
                    <Phone className="w-3.5 h-3.5 text-red-400" />
                    <span>Kitchen & Bar Dispatch Line</span>
                  </label>
                  <input
                    type="text"
                    value={venueContacts.kitchen_phone || venueContacts.alt_phone}
                    onChange={(e) => setVenueContacts({ ...venueContacts, kitchen_phone: e.target.value })}
                    placeholder="+260 966 312 905"
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-red-500"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl flex items-center justify-center space-x-2 shadow-lg shadow-amber-500/20 transition-all"
              >
                <Save className="w-4 h-4" />
                <span>Save Venue Info & Operating Hours</span>
              </button>
            </form>

            <div className="pt-4 border-t border-gray-800 text-center text-xs text-gray-500 uppercase tracking-wider font-semibold">
              © Phoenix lounge kabwe design by HUMPHREY NKOBENI.
            </div>
          </div>
        )}

        {/* ------------------------------------------------------------- */}
        {/* TAB 6: MANAGER ROOT & ALL WEBSITE NUMBERS & PRICING CONTROL   */}
        {/* ------------------------------------------------------------- */}
        {activeTab === 'manager' && (
          <div className="space-y-6">
            {!managerUnlocked ? (
              <div className="max-w-md mx-auto p-6 bg-gray-900 border border-amber-500/40 rounded-3xl shadow-2xl text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg shadow-amber-500/10">
                  <Lock className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="font-serif-display text-xl font-black text-white">
                    Manager Master Numbers & Price Control
                  </h3>
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed">
                    Enter the master management key to inspect financial metrics and edit all phone numbers, merchant codes, VIP booth spend thresholds, and drink/food prices across the website.
                  </p>
                </div>

                <form onSubmit={handleUnlockManager} className="space-y-3 pt-2">
                  <input
                    type="password"
                    value={managerKeyInput}
                    onChange={(e) => setManagerKeyInput(e.target.value)}
                    placeholder="Enter Master Root Key (Default: 12345678)"
                    className="w-full bg-black border border-gray-800 rounded-xl px-4 py-3 text-center text-white text-sm focus:border-amber-500 font-mono tracking-widest"
                  />
                  {managerKeyError && (
                    <p className="text-xs text-red-400 font-bold">{managerKeyError}</p>
                  )}
                  <button
                    type="submit"
                    className="w-full py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 transition-all active:scale-95"
                  >
                    Unlock Manager Command Center
                  </button>
                </form>
              </div>
            ) : (
              <div className="space-y-6">
                
                {/* Top Banner */}
                <div className="p-4 bg-gradient-to-r from-amber-950/60 via-gray-900 to-gray-900 border border-amber-500/40 rounded-2xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xl">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
                      <Shield className="w-5 h-5" />
                    </div>
                    <div>
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-400 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/30">
                        MASTER MANAGER ROOT ACTIVE
                      </span>
                      <h3 className="text-base font-black text-white mt-0.5">
                        Global Venue Numbers & Price Authority
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setManagerUnlocked(false);
                      showFeedback('Manager Root locked.');
                    }}
                    className="px-3.5 py-1.5 bg-gray-800 hover:bg-gray-700 text-gray-300 text-xs font-bold rounded-xl border border-gray-700 self-start sm:self-auto"
                  >
                    Lock Root Panel
                  </button>
                </div>

                {/* 1. Real-Time Financial Audit Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div className="p-4.5 bg-gray-900 border border-emerald-500/30 rounded-2xl shadow-lg">
                    <span className="text-[11px] text-emerald-400 font-bold uppercase tracking-wider">Gross Confirmed Revenue</span>
                    <p className="text-2xl font-black text-white font-mono mt-1.5">
                      ZMW {auditSummary.gross_confirmed_zmw.toFixed(2)}
                    </p>
                    <span className="text-[11px] text-gray-400">{auditSummary.total_confirmed_orders} verified customer orders</span>
                  </div>

                  <div className="p-4.5 bg-gray-900 border border-blue-500/30 rounded-2xl shadow-lg">
                    <span className="text-[11px] text-blue-400 font-bold uppercase tracking-wider">Mobile Money Gross</span>
                    <p className="text-2xl font-black text-white font-mono mt-1.5">
                      ZMW {auditSummary.momo_gross_zmw.toFixed(2)}
                    </p>
                    <span className="text-[11px] text-gray-400">Airtel, MTN & Zamtel</span>
                  </div>

                  <div className="p-4.5 bg-gray-900 border border-amber-500/30 rounded-2xl shadow-lg">
                    <span className="text-[11px] text-amber-400 font-bold uppercase tracking-wider">Cash Counter Gross</span>
                    <p className="text-2xl font-black text-white font-mono mt-1.5">
                      ZMW {auditSummary.cash_gross_zmw.toFixed(2)}
                    </p>
                    <span className="text-[11px] text-gray-400">Cash on delivery receipts</span>
                  </div>
                </div>

                {/* 2. Phone Numbers, Street Address & Operating Hours Numbers */}
                <div className="p-5 sm:p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center space-x-2">
                    <Phone className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        1. Official Hotline Phone Numbers & Venue Hours
                      </h4>
                      <p className="text-xs text-gray-400">
                        Controls numbers displayed on hero header, receipts, USSD checkout, and footer.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveVenueContacts} className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                    <div>
                      <label className="block text-gray-300 font-bold mb-1 flex items-center justify-between">
                        <span>Primary VIP Table Hotline</span>
                        {venueContacts.hotline && (
                          <a href={`tel:${venueContacts.hotline}`} className="text-amber-400 hover:underline font-mono text-[10px]">
                            Dial Test ↗
                          </a>
                        )}
                      </label>
                      <input
                        type="text"
                        value={venueContacts.hotline}
                        onChange={(e) => setVenueContacts({ ...venueContacts, hotline: e.target.value })}
                        className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1 flex items-center justify-between">
                        <span>Alternative Manager Direct Line</span>
                        {venueContacts.alt_phone && (
                          <a href={`tel:${venueContacts.alt_phone}`} className="text-amber-400 hover:underline font-mono text-[10px]">
                            Dial Test ↗
                          </a>
                        )}
                      </label>
                      <input
                        type="text"
                        value={venueContacts.alt_phone}
                        onChange={(e) => setVenueContacts({ ...venueContacts, alt_phone: e.target.value })}
                        className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-amber-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1 flex items-center justify-between">
                        <span>WhatsApp Orders & VIP Bookings Line</span>
                        {venueContacts.whatsapp && (
                          <a href={`https://wa.me/${venueContacts.whatsapp.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="text-emerald-400 hover:underline font-mono text-[10px]">
                            WhatsApp Test ↗
                          </a>
                        )}
                      </label>
                      <input
                        type="text"
                        value={venueContacts.whatsapp || venueContacts.hotline}
                        onChange={(e) => setVenueContacts({ ...venueContacts, whatsapp: e.target.value })}
                        className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-emerald-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1 flex items-center justify-between">
                        <span>Kitchen & Bar Dispatch Hotline</span>
                        {venueContacts.kitchen_phone && (
                          <a href={`tel:${venueContacts.kitchen_phone}`} className="text-red-400 hover:underline font-mono text-[10px]">
                            Dial Test ↗
                          </a>
                        )}
                      </label>
                      <input
                        type="text"
                        value={venueContacts.kitchen_phone || venueContacts.alt_phone}
                        onChange={(e) => setVenueContacts({ ...venueContacts, kitchen_phone: e.target.value })}
                        className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono focus:border-red-500 font-bold"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Physical Location Address Number</label>
                      <input
                        type="text"
                        value={venueContacts.address}
                        onChange={(e) => setVenueContacts({ ...venueContacts, address: e.target.value })}
                        className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500"
                      />
                    </div>

                    <div>
                      <label className="block text-gray-300 font-bold mb-1">Operating Hours Range</label>
                      <input
                        type="text"
                        value={venueContacts.hours}
                        onChange={(e) => setVenueContacts({ ...venueContacts, hours: e.target.value })}
                        className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white focus:border-amber-500"
                      />
                    </div>

                    <div className="sm:col-span-2 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Contact & Venue Numbers</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 3. Mobile Money Routing Numbers & Merchant Codes */}
                <div className="p-5 sm:p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center space-x-2">
                    <Smartphone className="w-5 h-5 text-emerald-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        2. Mobile Money Routing Numbers & USSD Merchant Codes
                      </h4>
                      <p className="text-xs text-gray-400">
                        Updates the automated payment push codes used by guests paying via Airtel, MTN, and Zamtel.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveGateways} className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
                    <div className="p-3.5 bg-black/50 border border-gray-800 rounded-xl space-y-2">
                      <span className="font-extrabold text-red-400">Airtel Money Routing</span>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Merchant Code</label>
                        <input
                          type="text"
                          value={airtelMerchant}
                          onChange={(e) => setAirtelMerchant(e.target.value)}
                          className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-black/50 border border-gray-800 rounded-xl space-y-2">
                      <span className="font-extrabold text-yellow-400">MTN MoMo Routing</span>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Merchant Code</label>
                        <input
                          type="text"
                          value={mtnMerchant}
                          onChange={(e) => setMtnMerchant(e.target.value)}
                          className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="p-3.5 bg-black/50 border border-gray-800 rounded-xl space-y-2">
                      <span className="font-extrabold text-emerald-400">Zamtel Kwacha Routing</span>
                      <div>
                        <label className="block text-[11px] text-gray-400 mb-1">Merchant Code</label>
                        <input
                          type="text"
                          value={zamtelMerchant}
                          onChange={(e) => setZamtelMerchant(e.target.value)}
                          className="w-full bg-black border border-gray-800 rounded-lg px-3 py-2 text-white font-mono"
                        />
                      </div>
                    </div>

                    <div className="sm:col-span-3 flex justify-end">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-black font-black rounded-xl shadow flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save Merchant Routing Codes</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 4. VIP Booth Minimum Spend Amounts & Seating Capacity Numbers */}
                <div className="p-5 sm:p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center space-x-2">
                    <Crown className="w-5 h-5 text-amber-400" />
                    <div>
                      <h4 className="font-bold text-white text-sm">
                        3. VIP Booth Minimum Spend Amounts (ZMW) & Capacities
                      </h4>
                      <p className="text-xs text-gray-400">
                        Directly edit the required spend and seating numbers for all VIP booths in the club.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={handleSaveAllBooths} className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      {booths.map((b) => {
                        const currentVal = managerBoothsState[b.booth_code] || { min_spend: b.min_spend, capacity: b.capacity };
                        return (
                          <div key={b.booth_code} className="p-3 bg-black/60 border border-gray-800 hover:border-amber-500/40 rounded-xl space-y-2">
                            <div className="flex items-center justify-between">
                              <span className="font-mono font-black text-amber-400">{b.booth_code}</span>
                              <span className="text-[10px] text-gray-400 font-bold truncate max-w-[140px]">{b.name}</span>
                            </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-0.5">Min Spend (ZMW)</label>
                                <input
                                  type="number"
                                  min="100"
                                  step="50"
                                  value={currentVal.min_spend}
                                  onChange={(e) => {
                                    const val = parseFloat(e.target.value) || 0;
                                    setManagerBoothsState(prev => ({
                                      ...prev,
                                      [b.booth_code]: { ...prev[b.booth_code], min_spend: val }
                                    }));
                                  }}
                                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-amber-500"
                                />
                              </div>
                              <div>
                                <label className="block text-[10px] text-gray-400 mb-0.5">Capacity (Seats)</label>
                                <input
                                  type="number"
                                  min="1"
                                  max="50"
                                  value={currentVal.capacity}
                                  onChange={(e) => {
                                    const val = parseInt(e.target.value) || 0;
                                    setManagerBoothsState(prev => ({
                                      ...prev,
                                      [b.booth_code]: { ...prev[b.booth_code], capacity: val }
                                    }));
                                  }}
                                  className="w-full bg-gray-950 border border-gray-800 rounded-lg px-2.5 py-1.5 text-white font-mono font-bold focus:border-amber-500"
                                />
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl shadow flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save All VIP Booth Spend & Capacity Numbers</span>
                      </button>
                    </div>
                  </form>
                </div>

                {/* 5. Master Product Price Sheet (Batch Edit ALL Prices on the Website) */}
                <div className="p-5 sm:p-6 bg-gray-900 border border-gray-800 rounded-2xl shadow-xl space-y-4">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center space-x-2">
                      <Banknote className="w-5 h-5 text-amber-400" />
                      <div>
                        <h4 className="font-bold text-white text-sm">
                          4. Master Menu Product Price Sheet (Edit ALL Prices in 1-Click)
                        </h4>
                        <p className="text-xs text-gray-400">
                          Edit the live price (in Kwacha) for every bottle, platter, beer bucket, and cocktail across the lounge.
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={handleSaveAllPrices}
                      className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-1.5"
                    >
                      <Save className="w-3.5 h-3.5" />
                      <span>Save All Prices Now</span>
                    </button>
                  </div>

                  <form onSubmit={handleSaveAllPrices} className="space-y-4 text-xs">
                    <div className="overflow-x-auto custom-scrollbar border border-gray-800 rounded-xl">
                      <table className="w-full text-left">
                        <thead className="bg-black text-gray-400 uppercase text-[10px] tracking-wider border-b border-gray-800">
                          <tr>
                            <th className="px-4 py-3">Product Name</th>
                            <th className="px-3 py-3">Category</th>
                            <th className="px-3 py-3">Current Price (ZMW)</th>
                            <th className="px-3 py-3">Stock & Visibility</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800/60 bg-gray-950/40">
                          {menuItems.map((item) => {
                            const val = managerPrices[item.id] !== undefined ? managerPrices[item.id] : item.price;
                            return (
                              <tr key={item.id} className="hover:bg-gray-900/60 transition-colors">
                                <td className="px-4 py-2.5 font-bold text-white">
                                  <div className="flex items-center space-x-2.5">
                                    <div className="w-8 h-8 rounded-lg overflow-hidden bg-black shrink-0 border border-gray-800">
                                      <img src={item.image_url} alt={item.name} className="w-full h-full object-cover" />
                                    </div>
                                    <span>{item.name}</span>
                                  </div>
                                </td>
                                <td className="px-3 py-2.5 text-gray-400 font-medium">
                                  {item.category}
                                </td>
                                <td className="px-3 py-2.5">
                                  <div className="flex items-center space-x-1.5">
                                    <span className="text-amber-400 font-bold font-mono">ZMW</span>
                                    <input
                                      type="number"
                                      step="1"
                                      min="1"
                                      value={val}
                                      onChange={(e) => {
                                        const newPrice = parseFloat(e.target.value) || 0;
                                        setManagerPrices(prev => ({ ...prev, [item.id]: newPrice }));
                                      }}
                                      className="w-28 bg-black border border-gray-800 focus:border-amber-400 rounded-lg px-2.5 py-1 text-white font-mono font-black"
                                    />
                                  </div>
                                </td>
                                <td className="px-3 py-2.5">
                                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                                    item.is_visible ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/30' : 'bg-gray-800 text-gray-400'
                                  }`}>
                                    {item.is_visible ? 'Visible' : 'Hidden'}
                                  </span>
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <div className="flex justify-end pt-2">
                      <button
                        type="submit"
                        className="px-6 py-3 bg-amber-500 hover:bg-amber-400 text-black font-black text-xs rounded-xl shadow-lg shadow-amber-500/20 flex items-center space-x-2"
                      >
                        <Save className="w-4 h-4" />
                        <span>Save All Product Prices Across Website</span>
                      </button>
                    </div>
                  </form>
                </div>

              </div>
            )}
          </div>
        )}

      </main>

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD NEW PRODUCT                                         */}
      {/* ------------------------------------------------------------- */}
      {isAddProductModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0a0d14] border border-amber-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Plus className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-display font-black text-base sm:text-lg text-white">
                  Add New Menu Product
                </h3>
              </div>
              <button
                onClick={() => setIsAddProductModalOpen(false)}
                className="w-8 h-8 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveAddProduct} className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3.5 text-xs">
              
              <div>
                <label className="block text-gray-300 font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  placeholder="e.g. Jameson Black Barrel (750ml), BBQ Pork Ribs"
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-medium"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Price (ZMW) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 850"
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-black focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Description / Serve Specs</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  placeholder="e.g. Served with ice bucket, mixer cans, and presentation."
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              {/* Product Photo Upload (Works with all photo formats) */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Product Photo (Any format supported)</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      placeholder="Image URL or upload from camera/device..."
                      className="flex-1 bg-black border border-gray-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    />
                    <input
                      type="file"
                      ref={productFileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProductImageUpload(file);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={productImageUploading}
                      onClick={() => productFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 rounded-xl font-bold flex items-center space-x-1.5 shrink-0"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{productImageUploading ? 'Processing...' : 'Upload Photo'}</span>
                    </button>
                  </div>

                  {productForm.image_url && (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-black border border-gray-800 relative">
                      <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 text-[10px] bg-black/80 text-amber-400 px-2 py-0.5 rounded font-mono">
                        Preview
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_visible}
                    onChange={(e) => setProductForm({ ...productForm, is_visible: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-gray-900 border-gray-700"
                  />
                  <span className="text-gray-300 font-bold">Visible on Guest Menu</span>
                </label>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsAddProductModalOpen(false)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Save & Add Product
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: EDIT PRODUCT DETAILS & PRICE                            */}
      {/* ------------------------------------------------------------- */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0a0d14] border border-amber-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Edit3 className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-display font-black text-base sm:text-lg text-white">
                  Edit Product & Pricing
                </h3>
              </div>
              <button
                onClick={() => setEditingProduct(null)}
                className="w-8 h-8 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveEditProduct} className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3.5 text-xs">
              
              <div>
                <label className="block text-gray-300 font-bold mb-1">Product Name *</label>
                <input
                  type="text"
                  required
                  value={productForm.name}
                  onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Category *</label>
                  <select
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-medium"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Price (ZMW) *</label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    required
                    value={productForm.price || ''}
                    onChange={(e) => setProductForm({ ...productForm, price: parseFloat(e.target.value) || 0 })}
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-amber-400 font-mono font-black focus:border-amber-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Description</label>
                <textarea
                  rows={2}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              {/* Photo Upload */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Photo (Any format supported on mobile/laptop)</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={productForm.image_url}
                      onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })}
                      className="flex-1 bg-black border border-gray-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    />
                    <input
                      type="file"
                      ref={editProductFileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleProductImageUpload(file, true);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      disabled={productImageUploading}
                      onClick={() => editProductFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 rounded-xl font-bold flex items-center space-x-1.5 shrink-0"
                    >
                      <Camera className="w-4 h-4" />
                      <span>{productImageUploading ? 'Processing...' : 'Upload Photo'}</span>
                    </button>
                  </div>

                  {productForm.image_url && (
                    <div className="w-full h-36 rounded-xl overflow-hidden bg-black border border-gray-800 relative">
                      <img src={productForm.image_url} alt="Preview" className="w-full h-full object-cover" />
                      <span className="absolute bottom-2 right-2 text-[10px] bg-black/80 text-amber-400 px-2 py-0.5 rounded font-mono">
                        Responsive Preview
                      </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center space-x-4 pt-2">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={productForm.is_visible}
                    onChange={(e) => setProductForm({ ...productForm, is_visible: e.target.checked })}
                    className="w-4 h-4 rounded text-amber-500 bg-gray-900 border-gray-700"
                  />
                  <span className="text-gray-300 font-bold">Visible on Guest Menu</span>
                </label>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl shadow-lg shadow-amber-500/20"
                >
                  Save Changes
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: ADD / EDIT SCREENING & THEME NIGHT                      */}
      {/* ------------------------------------------------------------- */}
      {(isAddEventModalOpen || editingEvent) && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/80 backdrop-blur-md animate-in fade-in overflow-y-auto">
          <div className="w-full max-w-lg bg-[#0a0d14] border border-amber-500/40 rounded-3xl p-5 sm:p-6 text-white shadow-2xl relative my-auto max-h-[92vh] flex flex-col">
            
            <div className="flex items-center justify-between pb-3 border-b border-gray-800 shrink-0">
              <div className="flex items-center space-x-2">
                <Tv className="w-5 h-5 text-amber-400" />
                <h3 className="font-serif-display font-black text-base sm:text-lg text-white">
                  {editingEvent ? 'Edit Screening / Theme Night' : 'Add New Screening / Theme Night'}
                </h3>
              </div>
              <button
                onClick={() => {
                  setIsAddEventModalOpen(false);
                  setEditingEvent(null);
                }}
                className="w-8 h-8 rounded-xl bg-gray-900 hover:bg-gray-800 text-gray-400 hover:text-white flex items-center justify-center"
              >
                ✕
              </button>
            </div>

            <form onSubmit={editingEvent ? handleSaveEditEvent : handleSaveAddEvent} className="flex-1 overflow-y-auto custom-scrollbar py-4 space-y-3.5 text-xs">
              
              <div>
                <label className="block text-gray-300 font-bold mb-1">Category *</label>
                <select
                  value={eventForm.category}
                  onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-medium"
                >
                  <option value="LIVE SPORTS BROADCAST">LIVE SPORTS BROADCAST</option>
                  <option value="THEME NIGHT">THEME NIGHT</option>
                  <option value="WEEKEND SPECIAL">WEEKEND SPECIAL</option>
                  <option value="CELEBRITY DJ SET">CELEBRITY DJ SET</option>
                  <option value="SPECIAL EVENT">SPECIAL EVENT</option>
                </select>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Title *</label>
                <input
                  type="text"
                  required
                  value={eventForm.title}
                  onChange={(e) => setEventForm({ ...eventForm, title: e.target.value })}
                  placeholder="e.g. Premier League Super Sunday, Friday Fire Afro-Fusion"
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-bold focus:border-amber-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-gray-300 font-bold mb-1">Subtitle / Headliner</label>
                  <input
                    type="text"
                    value={eventForm.subtitle}
                    onChange={(e) => setEventForm({ ...eventForm, subtitle: e.target.value })}
                    placeholder="e.g. Arsenal vs Man City, Guest DJs"
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white"
                  />
                </div>

                <div>
                  <label className="block text-gray-300 font-bold mb-1">Date & Time *</label>
                  <input
                    type="text"
                    required
                    value={eventForm.date}
                    onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                    placeholder="e.g. Sunday • 17:30 CAT, Friday • 20:00"
                    className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2.5 text-white font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Description & Specials</label>
                <textarea
                  rows={2}
                  value={eventForm.description}
                  onChange={(e) => setEventForm({ ...eventForm, description: e.target.value })}
                  placeholder="e.g. Ultra HD 4K Big Screen Projection, sound system synced, cold Mosi buckets on promotion."
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              <div>
                <label className="block text-gray-300 font-bold mb-1">Tag Feature</label>
                <input
                  type="text"
                  value={eventForm.tag}
                  onChange={(e) => setEventForm({ ...eventForm, tag: e.target.value })}
                  placeholder="e.g. Big Screens Active, Live DJ Deck, VIP Bottle Service"
                  className="w-full bg-black border border-gray-800 rounded-xl px-3.5 py-2 text-white"
                />
              </div>

              {/* Event Poster Photo */}
              <div>
                <label className="block text-gray-300 font-bold mb-1">Poster Photo (Optional)</label>
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={eventForm.image_url || ''}
                      onChange={(e) => setEventForm({ ...eventForm, image_url: e.target.value })}
                      placeholder="Image URL or upload..."
                      className="flex-1 bg-black border border-gray-800 rounded-xl px-3 py-2 text-white text-xs font-mono"
                    />
                    <input
                      type="file"
                      ref={eventFileInputRef}
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) handleEventImageUpload(file);
                      }}
                      className="hidden"
                    />
                    <button
                      type="button"
                      onClick={() => eventFileInputRef.current?.click()}
                      className="px-3.5 py-2 bg-gray-800 hover:bg-gray-700 text-amber-300 rounded-xl font-bold flex items-center space-x-1.5 shrink-0"
                    >
                      <Camera className="w-4 h-4" />
                      <span>Upload Photo</span>
                    </button>
                  </div>

                  {eventForm.image_url && (
                    <div className="w-full h-32 rounded-xl overflow-hidden bg-black border border-gray-800 relative">
                      <img src={eventForm.image_url} alt="Event preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-gray-800 flex items-center justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddEventModalOpen(false);
                    setEditingEvent(null);
                  }}
                  className="px-4 py-2 bg-gray-900 hover:bg-gray-800 text-gray-400 rounded-xl font-bold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-black rounded-xl shadow-lg shadow-amber-500/20"
                >
                  {editingEvent ? 'Save Event Changes' : 'Publish Event'}
                </button>
              </div>

            </form>

          </div>
        </div>
      )}

    </div>
  );
};
