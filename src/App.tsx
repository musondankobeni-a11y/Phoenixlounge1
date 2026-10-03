/**
 * Phoenix Lounge Kabwe - Main Single Page Application
 * 12 Freedom Way, Kabwe, Zambia
 * Design & Architecture for High-Volume Mobile Experience
 */

import React, { useState, useEffect } from 'react';
import { StorageEngine } from './storage';
import { 
  MenuItem, 
  OrderItem, 
  Order, 
  VIPBooth, 
  MediaPost, 
  SystemConfig, 
  PaymentGateway, 
  ManagerAuditSummary,
  EventItem,
  AdCampaign
} from './types';

import { Header } from './components/Header';
import { Hero } from './components/Hero';
import { MenuOrdering } from './components/MenuOrdering';
import { InteractivePanels } from './components/InteractivePanels';
import { MobileMoneyModal } from './components/MobileMoneyModal';
import { TableOfTheNight } from './components/TableOfTheNight';
import { Promotions } from './components/Promotions';
import { ManagementAuthModal } from './components/ManagementAuthModal';
import { DJDeckView } from './components/DJDeckView';
import { StaffCommandHub } from './components/StaffCommandHub';
import { InterstitialAd } from './components/InterstitialAd';
import { Footer } from './components/Footer';
import { OrdersReceiptModal } from './components/OrdersReceiptModal';
import { CustomerReceiptModal } from './components/CustomerReceiptModal';
import { FloatingCart } from './components/FloatingCart';
import { getActiveSession, clearActiveSession } from './security';

export default function App() {
  // Navigation / RBAC Roles: 'client' | 'staff' | 'dj'
  const [currentRole, setCurrentRole] = useState<'client' | 'staff' | 'dj'>(() => getActiveSession() || 'client');
  const [isManagementAuthOpen, setIsManagementAuthOpen] = useState(false);
  const [managementInitialPortal, setManagementInitialPortal] = useState<'staff' | 'dj'>('staff');
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [activeInteractiveTab, setActiveInteractiveTab] = useState<'dj_request' | 'birthday_bar' | 'vip_matrix'>('vip_matrix');
  const [isInteractiveModalOpen, setIsInteractiveModalOpen] = useState(false);

  // Core Data States
  const [menuItems, setMenuItems] = useState<MenuItem[]>(() => StorageEngine.getMenu());
  const [events, setEvents] = useState<EventItem[]>(() => StorageEngine.getEvents());
  const [booths, setBooths] = useState<VIPBooth[]>(() => StorageEngine.getBooths());
  const [orders, setOrders] = useState<Order[]>(() => StorageEngine.getOrders());
  const [timelinePosts, setTimelinePosts] = useState<MediaPost[]>(() => StorageEngine.getTimeline());
  const [config, setConfig] = useState<SystemConfig>(() => StorageEngine.getConfig());
  const [auditSummary, setAuditSummary] = useState<ManagerAuditSummary>(() => StorageEngine.getManagerAudit());

  // DJ Queues
  const [djRequests, setDjRequests] = useState(() => StorageEngine.getDJRequests());
  const [djShoutouts, setDjShoutouts] = useState(() => StorageEngine.getDJShoutouts());

  // Client Cart State
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Active Mobile Money Modal Order
  const [momoModalOrder, setMomoModalOrder] = useState<Order | null>(null);

  // Customer Receipt Modal Order & Visibility
  const [customerReceiptOrder, setCustomerReceiptOrder] = useState<Order | null>(null);
  const [isCustomerReceiptOpen, setIsCustomerReceiptOpen] = useState(false);

  // Order Success Banner
  const [lastPlacedOrder, setLastPlacedOrder] = useState<Order | null>(null);

  // Sync active receipt and banner whenever orders list changes (e.g. staff confirms/drops/deletes)
  useEffect(() => {
    if (customerReceiptOrder) {
      const fresh = orders.find(o => o.id === customerReceiptOrder.id);
      if (fresh) {
        setCustomerReceiptOrder(fresh);
      }
    }
    if (lastPlacedOrder) {
      const fresh = orders.find(o => o.id === lastPlacedOrder.id);
      if (fresh) {
        setLastPlacedOrder(fresh);
      }
    }
  }, [orders]);

  // Real-time Cloud Data Subscriptions (instant sync across all phones & laptops)
  useEffect(() => {
    const unsubMenu = StorageEngine.subscribeMenu(items => setMenuItems(items));
    const unsubOrders = StorageEngine.subscribeOrders(ordList => {
      setOrders(ordList);
      setAuditSummary(StorageEngine.getManagerAudit());
    });
    const unsubEvents = StorageEngine.subscribeEvents(evList => setEvents(evList));
    const unsubBooths = StorageEngine.subscribeBooths(boothsList => setBooths(boothsList));
    const unsubConfig = StorageEngine.subscribeConfig(cfg => setConfig(cfg));
    const unsubDJReq = StorageEngine.subscribeDJRequests(reqs => setDjRequests(reqs));
    const unsubDJShout = StorageEngine.subscribeDJShoutouts(shouts => setDjShoutouts(shouts));
    const unsubTimeline = StorageEngine.subscribeTimeline(posts => setTimelinePosts(posts));

    return () => {
      unsubMenu();
      unsubOrders();
      unsubEvents();
      unsubBooths();
      unsubConfig();
      unsubDJReq();
      unsubDJShout();
      unsubTimeline();
    };
  }, []);

  // Cart operations
  const handleAddToCart = (item: MenuItem) => {
    setCart(prev => {
      const existing = prev.find(ci => ci.id === item.id);
      if (existing) {
        return prev.map(ci => ci.id === item.id ? {
          ...ci,
          quantity: ci.quantity + 1,
          total_price: (ci.quantity + 1) * ci.price
        } : ci);
      }
      return [...prev, {
        id: item.id,
        name: item.name,
        category: item.category,
        price: item.price,
        quantity: 1,
        total_price: item.price
      }];
    });
  };

  const handleUpdateCartQty = (itemId: string, delta: number) => {
    setCart(prev => {
      return prev.map(ci => {
        if (ci.id === itemId) {
          const newQty = ci.quantity + delta;
          if (newQty <= 0) return null;
          return {
            ...ci,
            quantity: newQty,
            total_price: newQty * ci.price
          };
        }
        return ci;
      }).filter(Boolean) as OrderItem[];
    });
  };

  const handleClearCart = () => setCart([]);

  const handleCheckout = (details: {
    table_booth_number: string;
    customer_name: string;
    customer_phone: string;
    payment_method: PaymentGateway;
    notes: string;
  }) => {
    const totalAmount = cart.reduce((sum, it) => sum + it.total_price, 0);
    const newOrder: Order = {
      id: `PLK-${Date.now().toString().slice(-6)}`,
      order_ref: `PLK-${Math.floor(1000 + Math.random() * 9000)}`,
      table_booth_number: details.table_booth_number,
      customer_name: details.customer_name,
      customer_phone: details.customer_phone,
      payment_method: details.payment_method,
      payment_status: details.payment_method === 'cash' ? 'unpaid' : 'submitted',
      order_status: 'pending',
      total_amount_zmw: totalAmount,
      items: [...cart],
      notes: details.notes,
      created_at: new Date().toISOString(),
      confirmed_at: null
    };

    StorageEngine.addOrder(newOrder);
    setOrders(StorageEngine.getOrders());
    setMenuItems(StorageEngine.getMenu());
    setAuditSummary(StorageEngine.getManagerAudit());
    setCart([]);
    setIsCartOpen(false);
    setLastPlacedOrder(newOrder);
    setCustomerReceiptOrder(newOrder);

    // If mobile money selected, pop open operational USSD copy modal
    if (['airtel', 'mtn', 'zamtel'].includes(details.payment_method)) {
      setMomoModalOrder(newOrder);
    } else {
      // Cash payment: instantly open official customer receipt pass with download option
      setIsCustomerReceiptOpen(true);
    }
  };

  // Staff Operations: Delete Any Unneeded Order Receipt
  const handleDeleteOrder = (orderId: string) => {
    const updated = StorageEngine.deleteOrder(orderId);
    setOrders(updated);
    setAuditSummary(StorageEngine.getManagerAudit());
    if (customerReceiptOrder?.id === orderId) {
      setCustomerReceiptOrder(null);
      setIsCustomerReceiptOpen(false);
    }
    if (lastPlacedOrder?.id === orderId) {
      setLastPlacedOrder(null);
    }
  };

  // Staff and DJ Logins (Called after cryptographic challenge verification)
  const handleStaffLogin = () => {
    setCurrentRole('staff');
    return true;
  };

  const handleDJLogin = () => {
    setCurrentRole('dj');
    return true;
  };

  // DJ Actions
  const handleUpdateTicker = (ticker: string) => {
    StorageEngine.updateTicker(ticker);
    setConfig(StorageEngine.getConfig());
  };

  const handleDismissDJRequest = (id: string) => {
    const updated = StorageEngine.dismissDJRequest(id);
    setDjRequests(updated);
  };

  const handleDismissDJShoutout = (id: string) => {
    const updated = StorageEngine.dismissDJShoutout(id);
    setDjShoutouts(updated);
  };

  // Staff Operations: Orders
  const handleUpdateOrderStatus = (orderId: string, status: Order['order_status']) => {
    const updated = StorageEngine.updateOrderStatus(orderId, status);
    setOrders(updated);
    setAuditSummary(StorageEngine.getManagerAudit());
  };

  // Staff Operations: Products Management
  const handleToggleMenuItem = (itemId: string, is_visible: boolean) => {
    const updated = StorageEngine.toggleMenuItem(itemId, is_visible);
    setMenuItems(updated);
  };

  const handleAddMenuItem = (item: Omit<MenuItem, 'id'>) => {
    StorageEngine.addMenuItem(item);
    setMenuItems(StorageEngine.getMenu());
  };

  const handleUpdateMenuItem = (item: MenuItem) => {
    const updated = StorageEngine.updateMenuItem(item);
    setMenuItems(updated);
  };

  const handleDeleteMenuItem = (itemId: string) => {
    const updated = StorageEngine.deleteMenuItem(itemId);
    setMenuItems(updated);
  };

  const handleUpdateProductImage = (itemId: string, imageDataUrl: string) => {
    const updated = StorageEngine.updateMenuItemImage(itemId, imageDataUrl);
    setMenuItems(updated);
  };

  // Staff Operations: Events & Screenings
  const handleAddEvent = (event: Omit<EventItem, 'id'>) => {
    StorageEngine.addEvent(event);
    setEvents(StorageEngine.getEvents());
  };

  const handleUpdateEvent = (event: EventItem) => {
    const updated = StorageEngine.updateEvent(event);
    setEvents(updated);
  };

  const handleDeleteEvent = (eventId: string) => {
    const updated = StorageEngine.deleteEvent(eventId);
    setEvents(updated);
  };

  // Staff Operations: Ads & Venue
  const handleUpdateAdSettings = (interval: number, enabled: boolean) => {
    StorageEngine.updateAdSettings(interval, enabled);
    setConfig(StorageEngine.getConfig());
  };

  const handleUpdateAdCampaign = (ad: AdCampaign) => {
    const updated = StorageEngine.updateAdCampaign(ad);
    setConfig(updated);
  };

  const handleUpdateVenueContacts = (contacts: SystemConfig['venue_contacts']) => {
    const updated = StorageEngine.updateVenueContacts(contacts);
    setConfig(updated);
  };

  const handleUpdateGatewayConfig = (gateway: PaymentGateway, merchant_code: string, short_code: string) => {
    StorageEngine.updateGateway(gateway, merchant_code, short_code);
    setConfig(StorageEngine.getConfig());
  };

  // Manager Numbers & Pricing Operations
  const handleUpdateBoothConfig = (booth_code: string, min_spend: number, capacity: number) => {
    const updated = StorageEngine.updateBoothConfig(booth_code, min_spend, capacity);
    setBooths(updated);
  };

  const handleUpdateBatchPrices = (priceUpdates: { id: string; price: number }[]) => {
    const updated = StorageEngine.updateBatchPrices(priceUpdates);
    setMenuItems(updated);
  };

  // VIP Booth Locking
  const handleLockBooth = (code: string, name: string, phone: string, paymentMethod: PaymentGateway) => {
    StorageEngine.lockBooth(code, name, phone);
    setBooths(StorageEngine.getBooths());
  };

  // Customer Interactions
  const handleSubmitDJRequest = (data: {
    customer_name: string;
    booth_table: string;
    song_title: string;
    artist: string;
    personal_note?: string;
  }) => {
    const newReq = StorageEngine.addDJRequest(data);
    setDjRequests(StorageEngine.getDJRequests());
    return newReq;
  };

  const handleSubmitBirthdayShoutout = (data: {
    celebrant_name: string;
    booth_number: string;
    customized_text: string;
    song_selection: string;
    package_type?: 'standard' | 'sparkler_vip' | 'champagne_fanfare';
  }) => {
    const newS = StorageEngine.addDJShoutout(data);
    setDjShoutouts(StorageEngine.getDJShoutouts());
    return newS;
  };

  const handleUploadPhoto = (post: {
    uploader_name: string;
    table_booth: string;
    caption: string;
    image_url: string;
  }) => {
    const newPost = StorageEngine.addTimelinePost(post);
    setTimelinePosts(StorageEngine.getTimeline());
    return newPost;
  };

  const handleReactToPhoto = (postId: string, reaction: keyof MediaPost['reactions']) => {
    const updated = StorageEngine.incrementReaction(postId, reaction);
    setTimelinePosts(updated);
  };

  // Interactive Section Navigator
  const handleNavigateSection = (sectionId: string, interactiveTab?: 'dj_request' | 'birthday_bar' | 'vip_matrix') => {
    if (interactiveTab) {
      setActiveInteractiveTab(interactiveTab);
      setIsInteractiveModalOpen(true);
      return;
    }
    const lower = sectionId.toLowerCase();
    if (lower.includes('dj') || lower.includes('song')) {
      setActiveInteractiveTab('dj_request');
      setIsInteractiveModalOpen(true);
      return;
    }
    if (lower.includes('birthday') || lower.includes('shoutout') || lower.includes('wishing')) {
      setActiveInteractiveTab('birthday_bar');
      setIsInteractiveModalOpen(true);
      return;
    }
    if (lower.includes('vip') || lower.includes('booth') || lower.includes('matrix')) {
      setActiveInteractiveTab('vip_matrix');
      setIsInteractiveModalOpen(true);
      return;
    }
    const elem = document.getElementById(sectionId);
    if (elem) {
      elem.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const cartTotalAmount = cart.reduce((sum, item) => sum + item.total_price, 0);
  const cartTotalCount = cart.reduce((sum, item) => sum + item.quantity, 0);

  // If role is DJ Deck
  if (currentRole === 'dj') {
    return (
      <DJDeckView
        requests={djRequests}
        shoutouts={djShoutouts}
        currentTicker={config.active_ticker}
        onUpdateTicker={handleUpdateTicker}
        onDismissRequest={handleDismissDJRequest}
        onDismissShoutout={handleDismissDJShoutout}
        onLogout={() => {
          clearActiveSession();
          setCurrentRole('client');
        }}
      />
    );
  }

  // If role is Staff Command Hub
  if (currentRole === 'staff') {
    return (
      <StaffCommandHub
        orders={orders}
        menuItems={menuItems}
        events={events}
        booths={booths}
        config={config}
        auditSummary={auditSummary}
        onUpdateOrderStatus={handleUpdateOrderStatus}
        onDeleteOrder={handleDeleteOrder}
        onToggleMenuItem={handleToggleMenuItem}
        onAddMenuItem={handleAddMenuItem}
        onUpdateMenuItem={handleUpdateMenuItem}
        onDeleteMenuItem={handleDeleteMenuItem}
        onUpdateProductImage={handleUpdateProductImage}
        onAddEvent={handleAddEvent}
        onUpdateEvent={handleUpdateEvent}
        onDeleteEvent={handleDeleteEvent}
        onUpdateAdSettings={handleUpdateAdSettings}
        onUpdateAdCampaign={handleUpdateAdCampaign}
        onUpdateVenueContacts={handleUpdateVenueContacts}
        onUpdateGatewayConfig={handleUpdateGatewayConfig}
        onUpdateBoothConfig={handleUpdateBoothConfig}
        onUpdateBatchPrices={handleUpdateBatchPrices}
        onLogout={() => {
          clearActiveSession();
          setCurrentRole('client');
        }}
      />
    );
  }

  // Primary Client View
  return (
    <div className="min-h-screen bg-black text-gray-100 flex flex-col selection:bg-amber-500 selection:text-black">
      
      {/* 1. Sticky Global Header */}
      <Header
        config={config}
        cartCount={cartTotalCount}
        cartTotal={cartTotalAmount}
        currentRole={currentRole}
        onLogout={() => {
          clearActiveSession();
          setCurrentRole('client');
        }}
        onOpenCart={() => setIsCartOpen(true)}
        onOpenManagement={(portal) => {
          const active = getActiveSession();
          if (active === 'staff' || active === 'dj') {
            setCurrentRole(portal || active);
          } else {
            setManagementInitialPortal(portal || 'staff');
            setIsManagementAuthOpen(true);
          }
        }}
        onNavigateSection={handleNavigateSection}
        onOpenOrdersModal={() => setIsOrdersModalOpen(true)}
      />

      {/* Dispatched Order Feedback Banner */}
      {lastPlacedOrder && (
        <div className="bg-amber-500 text-black px-4 py-3 flex flex-wrap items-center justify-between gap-2 text-xs sm:text-sm font-extrabold animate-in fade-in shadow-xl">
          <div className="flex items-center space-x-2">
            <span className={`w-2.5 h-2.5 rounded-full ${lastPlacedOrder.order_status === 'confirmed' ? 'bg-emerald-950 animate-pulse' : 'bg-black'}`} />
            <div>
              Order Ref: <span className="font-mono underline">{lastPlacedOrder.order_ref}</span> • Table <span className="font-mono">{lastPlacedOrder.table_booth_number}</span> 
              <span className={`ml-2 px-2 py-0.5 rounded text-[10px] uppercase font-black ${
                lastPlacedOrder.order_status === 'confirmed' 
                  ? 'bg-emerald-950 text-emerald-300' 
                  : lastPlacedOrder.order_status === 'dropped'
                  ? 'bg-red-950 text-red-300'
                  : 'bg-black text-amber-300'
              }`}>
                {lastPlacedOrder.order_status}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => {
                setCustomerReceiptOrder(lastPlacedOrder);
                setIsCustomerReceiptOpen(true);
              }}
              className="px-3 py-1 bg-black hover:bg-gray-900 text-amber-400 rounded-lg text-xs font-black shadow flex items-center space-x-1 transition-transform active:scale-95"
            >
              <span>View & Download Receipt</span>
            </button>
            <button
              onClick={() => setLastPlacedOrder(null)}
              className="px-2 py-1 bg-black/30 hover:bg-black text-white rounded text-xs"
              aria-label="Dismiss banner"
            >
              ✕
            </button>
          </div>
        </div>
      )}

      {/* 2. Above-the-fold Hero */}
      <Hero
        onOrderNow={() => handleNavigateSection('menu-section')}
        onNavigateSection={handleNavigateSection}
        activeTicker={config.active_ticker}
        config={config}
      />

      {/* 3. Live Search & Menu Ordering Section */}
      <MenuOrdering
        items={menuItems}
        cart={cart}
        onAddToCart={handleAddToCart}
        onUpdateCartQty={handleUpdateCartQty}
        onClearCart={handleClearCart}
        onCheckout={handleCheckout}
        isCartOpen={isCartOpen}
        onCloseCart={() => setIsCartOpen(false)}
        onOpenCart={() => setIsCartOpen(true)}
      />

      {/* 4. Table of the Night (10-Hour TTL Gallery) */}
      <TableOfTheNight
        posts={timelinePosts}
        onUploadPhoto={handleUploadPhoto}
        onReact={handleReactToPhoto}
      />

      {/* 5. Promotional Content Streams (Sports matches & theme nights edited by staff) */}
      <Promotions events={events} />

      {/* 6. Promotional Interstitial / Ad posted & edited by staff */}
      <InterstitialAd
        intervalSeconds={config.ad_interval_seconds}
        enabled={config.ad_enabled}
        ad={config.active_ad}
        onOrderNow={() => handleNavigateSection('menu-section')}
        onNavigateSection={handleNavigateSection}
      />

      {/* 7. Baseline Layout Footer */}
      <Footer config={config} />

      {/* Floating Cart: Only visible when items exist in cart AND order cart drawer is closed */}
      {!isCartOpen && (
        <FloatingCart
          itemCount={cartTotalCount}
          totalAmount={cartTotalAmount}
          onOpenCart={() => setIsCartOpen(true)}
          isCartOpen={isCartOpen}
        />
      )}

      {/* Dynamic Pop-up Modal: DJ Requests, Birthday Bar, VIP Booth Matrix */}
      <InteractivePanels
        isOpen={isInteractiveModalOpen}
        onClose={() => setIsInteractiveModalOpen(false)}
        booths={booths}
        config={config}
        currentTab={activeInteractiveTab}
        shoutouts={djShoutouts}
        requests={djRequests}
        onLockBooth={handleLockBooth}
        onSubmitDJRequest={handleSubmitDJRequest}
        onSubmitBirthdayShoutout={handleSubmitBirthdayShoutout}
      />

      {/* Mobile Money USSD Copy Modal */}
      {momoModalOrder && (
        <MobileMoneyModal
          order={momoModalOrder}
          gateways={config.momo_gateways}
          onClose={() => {
            setMomoModalOrder(null);
            setIsCustomerReceiptOpen(true);
          }}
          onConfirmPaymentSent={(orderId, ref) => {
            setMomoModalOrder(null);
            setIsCustomerReceiptOpen(true);
          }}
        />
      )}

      {/* Management Authentication Portal Modal */}
      <ManagementAuthModal
        isOpen={isManagementAuthOpen}
        onClose={() => setIsManagementAuthOpen(false)}
        onStaffLogin={handleStaffLogin}
        onDJLogin={handleDJLogin}
        initialPortal={managementInitialPortal}
      />

      {/* Guest Orders & Receipts List Modal (From Donut Menu) */}
      <OrdersReceiptModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        orders={orders}
      />

      {/* Dedicated Customer Official Order Receipt Pass Modal with Download Option */}
      <CustomerReceiptModal
        isOpen={isCustomerReceiptOpen}
        onClose={() => setIsCustomerReceiptOpen(false)}
        order={customerReceiptOrder}
        config={config}
      />

    </div>
  );
}
