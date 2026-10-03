import {
  Order,
  MenuItem,
  DJSongRequest,
  DJBirthdayShoutout,
  VIPBooth,
  MediaPost,
  SystemConfig,
  ManagerAuditSummary,
  PaymentGateway,
  EventItem,
  AdCampaign
} from './types';
import { db, handleFirestoreError, OperationType, testFirestoreConnection } from './firebase';
import { 
  collection, 
  doc, 
  setDoc, 
  deleteDoc, 
  onSnapshot
} from 'firebase/firestore';

const INITIAL_MENU: MenuItem[] = [
  { 
    id: "m1", 
    category: "Whisky & Cognac", 
    name: "Hennessy VSOP (750ml)", 
    price: 2400.0, 
    description: "Original Hennessy Privilege cognac with ice bucket.", 
    image_url: "https://images.unsplash.com/photo-1527281400683-1aae777175f8?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m2", 
    category: "Whisky & Cognac", 
    name: "Johnnie Walker Black Label (750ml)", 
    price: 1100.0, 
    description: "Classic 12-year blended Scotch whisky.", 
    image_url: "https://images.unsplash.com/photo-1563227812-0ea4c22e6cc8?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m3", 
    category: "Whisky & Cognac", 
    name: "Jameson Irish Whiskey (750ml)", 
    price: 750.0, 
    description: "Triple distilled Irish whiskey bottle.", 
    image_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m4", 
    category: "Vodka & Gin", 
    name: "Ciroc Snap Frost Vodka (750ml)", 
    price: 1350.0, 
    description: "Ultra-premium French grape vodka.", 
    image_url: "https://images.unsplash.com/photo-1551024709-8f23befc6f87?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m5", 
    category: "Vodka & Gin", 
    name: "Tanqueray No. TEN Gin", 
    price: 850.0, 
    description: "Distilled small batch gin with fresh botanicals.", 
    image_url: "https://images.unsplash.com/photo-1514362545857-3bc16c4c7d1b?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m6", 
    category: "Champagne", 
    name: "Moët & Chandon Nectar Impérial", 
    price: 2800.0, 
    description: "Demi-Sec luxury champagne served in VIP sparkler holder.", 
    image_url: "https://images.unsplash.com/photo-1584225064785-c62a8b43d148?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m7", 
    category: "Beers & Ciders", 
    name: "Mosi Lager (330ml - Bucket of 6)", 
    price: 240.0, 
    description: "Zambia's truly African lager in chilled ice bucket.", 
    image_url: "https://images.unsplash.com/photo-1608270546103-975c78a05f15?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m8", 
    category: "Beers & Ciders", 
    name: "Castle Lite Extra Cold (Bucket of 6)", 
    price: 260.0, 
    description: "Sub-zero ice-cold refreshing lager.", 
    image_url: "https://images.unsplash.com/photo-1608270546103-975c78a05f15?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m9", 
    category: "Beers & Ciders", 
    name: "Savanna Dry Premium Cider (Bucket of 6)", 
    price: 280.0, 
    description: "Crisp dry cider with fresh lemon wedges.", 
    image_url: "https://images.unsplash.com/photo-1538488881523-298f007c450c?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m10", 
    category: "Grills & Platters", 
    name: "Phoenix Grand Braii Platter", 
    price: 650.0, 
    description: "Succulent charcoal-grilled pork ribs, T-bone steak, chicken wings, nshima rolls & chibwabwa dip.", 
    image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m11", 
    category: "Grills & Platters", 
    name: "Kabwe Flame-Grilled T-Bone Steak", 
    price: 320.0, 
    description: "400g prime Zambian beef flame-grilled with pepper gravy & golden chips.", 
    image_url: "https://images.unsplash.com/photo-1544025162-d76694265947?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m12", 
    category: "Grills & Platters", 
    name: "Spicy Peri-Peri Wings (12 pcs)", 
    price: 220.0, 
    description: "Crispy grilled wings tossed in Kabwe fiery peri-peri glaze.", 
    image_url: "https://images.unsplash.com/photo-1527477321055-43615b65171d?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  },
  { 
    id: "m13", 
    category: "Grills & Platters", 
    name: "Crispy Seasoned Fries & Garlic Mayo", 
    price: 75.0, 
    description: "Hand-cut rustic fries tossed with smoked paprika.", 
    image_url: "https://images.unsplash.com/photo-1576107232684-1279f3908594?w=700&auto=format&fit=crop&q=80",
    is_visible: true, 
    in_stock: true 
  }
];

const INITIAL_EVENTS: EventItem[] = [
  {
    id: "ev-1",
    category: "LIVE SPORTS BROADCAST",
    title: "Premier League Super Sunday",
    subtitle: "Arsenal vs Manchester City",
    date: "Sunday • 17:30 CAT",
    description: "Ultra HD 4K Big Screen Projection, synced sound system, ice-cold Mosi buckets on promotion.",
    tag: "Big Screens Active",
    badgeColor: "bg-red-500/20 text-red-300 border-red-500/40",
    image_url: "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=800&auto=format&fit=crop&q=80",
    is_active: true
  },
  {
    id: "ev-2",
    category: "THEME NIGHT",
    title: "Friday Fire Afro-Fusion & Amapiano",
    subtitle: "Guest DJs & Resident Maestros",
    date: "Every Friday • From 20:00 CAT",
    description: "Non-stop bangers, sparkler bottle service, and midnight braii grill specials.",
    tag: "Live DJ Deck",
    badgeColor: "bg-purple-500/20 text-purple-300 border-purple-500/40",
    image_url: "https://images.unsplash.com/photo-1516450360452-9312f5e86fc7?w=800&auto=format&fit=crop&q=80",
    is_active: true
  },
  {
    id: "ev-3",
    category: "WEEKEND SPECIAL",
    title: "Saturday Champagne & Cognac Night",
    subtitle: "VIP Booth Packages Available",
    date: "Every Saturday • From 19:00 CAT",
    description: "Hennessy & Moët bottle rituals with custom sparklers, photography, and dedicated VIP hostesses.",
    tag: "VIP Bottle Service",
    badgeColor: "bg-amber-500/20 text-amber-300 border-amber-500/40",
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80",
    is_active: true
  }
];

const INITIAL_BOOTHS: VIPBooth[] = [
  {
    booth_code: "V01",
    name: "Presidential Booth (Stage View)",
    tier: "vvip_presidential",
    capacity: 10,
    min_spend: 3500,
    is_reserved: false,
    reserved_by: null,
    contact_phone: null,
    reserved_at: null,
    hold_expires_at: null
  },
  {
    booth_code: "V02",
    name: "Royal Diamond Booth",
    tier: "vip",
    capacity: 8,
    min_spend: 2800,
    is_reserved: false,
    reserved_by: null,
    contact_phone: null,
    reserved_at: null,
    hold_expires_at: null
  },
  {
    booth_code: "V03",
    name: "Golden Executive Lounge",
    tier: "vip",
    capacity: 6,
    min_spend: 2200,
    is_reserved: true,
    reserved_by: "Chileshe K.",
    contact_phone: "+260 977 123 456",
    reserved_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    hold_expires_at: new Date(Date.now() + 10 * 60 * 1000).toISOString()
  },
  {
    booth_code: "V04",
    name: "Platinum Deck Corner",
    tier: "vip",
    capacity: 8,
    min_spend: 2500,
    is_reserved: false,
    reserved_by: null,
    contact_phone: null,
    reserved_at: null,
    hold_expires_at: null
  },
  {
    booth_code: "V05",
    name: "Amber Terrace Booth",
    tier: "vip",
    capacity: 6,
    min_spend: 1800,
    is_reserved: false,
    reserved_by: null,
    contact_phone: null,
    reserved_at: null,
    hold_expires_at: null
  },
  {
    booth_code: "V06",
    name: "Kabwe Skyline High-Table",
    tier: "vip",
    capacity: 4,
    min_spend: 1500,
    is_reserved: false,
    reserved_by: null,
    contact_phone: null,
    reserved_at: null,
    hold_expires_at: null
  }
];

const INITIAL_ACTIVE_AD: AdCampaign = {
  id: "ad-active",
  badge_text: "Phoenix Special Promotion",
  title: "Tonight's Signature Braii & Cold Buckets",
  description: "Order a Phoenix Platter & 6 Mosi Lagers directly to your table with zero wait time.",
  price_tag: "Special ZMW 850",
  action_text: "Order To Table",
  action_target: "menu",
  image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
  is_active: true
};

const INITIAL_CONFIG: SystemConfig = {
  momo_gateways: {
    airtel: { merchant_code: "PHOENIX-AIRTEL-449", short_code: "*115#", name: "Airtel Money" },
    mtn: { merchant_code: "PHOENIX-MTN-882", short_code: "*115#", name: "MTN MoMo" },
    zamtel: { merchant_code: "PHOENIX-ZAM-104", short_code: "*115#", name: "Zamtel Kwacha" },
    cash: { merchant_code: "CASH-COUNTER-01", short_code: "CASH", name: "Cash on Delivery" },
  },
  venue_contacts: {
    address: "12 Freedom Way, Kabwe, Zambia",
    hotline: "+260 979 181461",
    alt_phone: "+260 966 312 905",
    whatsapp: "+260 979 181461",
    kitchen_phone: "+260 966 312 905",
    hours: "Monday - Sunday: 16:00 - 06:00 CAT (Kitchen & Bar Open Late)",
  },
  active_ticker: "NOW SPINNING: KABWE LATE NIGHT AFRO-FUSION & AMAPIANO VIBES | WELCOME TO PHOENIX LOUNGE",
  ad_interval_seconds: 15,
  ad_enabled: true,
  active_ad: INITIAL_ACTIVE_AD
};

const INITIAL_TIMELINE: MediaPost[] = [
  {
    id: "TL-001",
    uploader_name: "Chileshe K.",
    table_booth: "Booth V03",
    caption: "Weekend energy at Phoenix! Moët on ice.",
    image_url: "https://images.unsplash.com/photo-1510812431401-41d2bd2722f3?w=800&auto=format&fit=crop&q=80",
    reactions: { fire: 18, champagne: 12, crown: 7, dance: 9 },
    created_at: new Date(Date.now() - 2 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 8 * 3600 * 1000).toISOString(),
  },
  {
    id: "TL-002",
    uploader_name: "Mwamba & Crew",
    table_booth: "Table 12",
    caption: "Kabwe night out! Braii platter hits different.",
    image_url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800&auto=format&fit=crop&q=80",
    reactions: { fire: 24, champagne: 5, crown: 14, dance: 12 },
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(),
    expires_at: new Date(Date.now() + 6 * 3600 * 1000).toISOString(),
  }
];

const INITIAL_DJ_REQUESTS: DJSongRequest[] = [
  {
    id: "DJR-101",
    customer_name: "Bwalya M.",
    booth_table: "Table 04",
    song_title: "Mnike",
    artist: "Tyler ICU",
    personal_note: "Play this for table 4 birthday turn up!",
    created_at: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    status: "queued"
  },
  {
    id: "DJR-102",
    customer_name: "Tandiwe Z.",
    booth_table: "Booth V02",
    song_title: "Water",
    artist: "Tyla",
    personal_note: "VIP diamond table vibes",
    created_at: new Date(Date.now() - 5 * 60 * 1000).toISOString(),
    status: "queued"
  }
];

const INITIAL_DJ_SHOUTOUTS: DJBirthdayShoutout[] = [
  {
    id: "SH-201",
    celebrant_name: "Mwila 'King' Chanda",
    booth_number: "Booth V01 Presidential",
    customized_text: "Happy 30th Birthday to the boss Mwila! Sparklers on deck!",
    song_selection: "Jerusalema - Master KG",
    package_type: "champagne_fanfare",
    created_at: new Date(Date.now() - 25 * 60 * 1000).toISOString(),
    status: "queued"
  }
];

const INITIAL_ORDERS: Order[] = [
  {
    id: "PLK-9901",
    order_ref: "PLK-4821",
    table_booth_number: "VIP Booth V03",
    customer_name: "Chileshe K.",
    customer_phone: "+260 977 123 456",
    payment_method: "airtel",
    payment_status: "verified",
    order_status: "confirmed",
    total_amount_zmw: 2800.0,
    items: [
      {
        id: "m6",
        name: "Moët & Chandon Nectar Impérial",
        category: "Champagne",
        price: 2800.0,
        quantity: 1,
        total_price: 2800.0
      }
    ],
    notes: "Please bring 6 champagne flutes and sparkler attachment.",
    created_at: new Date(Date.now() - 45 * 60 * 1000).toISOString(),
    confirmed_at: new Date(Date.now() - 40 * 60 * 1000).toISOString()
  },
  {
    id: "PLK-9902",
    order_ref: "PLK-7312",
    table_booth_number: "Table 09",
    customer_name: "Mulenga B.",
    customer_phone: "+260 966 987 654",
    payment_method: "mtn",
    payment_status: "submitted",
    order_status: "pending",
    total_amount_zmw: 890.0,
    items: [
      {
        id: "m10",
        name: "Phoenix Grand Braii Platter",
        category: "Grills & Platters",
        price: 650.0,
        quantity: 1,
        total_price: 650.0
      },
      {
        id: "m7",
        name: "Mosi Lager (330ml - Bucket of 6)",
        category: "Beers & Ciders",
        price: 240.0,
        quantity: 1,
        total_price: 240.0
      }
    ],
    notes: "Medium-well steak with extra chili sauce.",
    created_at: new Date(Date.now() - 10 * 60 * 1000).toISOString(),
    confirmed_at: null
  }
];

// Cloud Storage State (Strictly Cloud/Memory - No Local Cache Storage)
let memoryMenu: MenuItem[] = INITIAL_MENU;
let memoryOrders: Order[] = INITIAL_ORDERS;
let memoryEvents: EventItem[] = INITIAL_EVENTS;
let memoryConfig: SystemConfig = INITIAL_CONFIG;
let memoryBooths: VIPBooth[] = INITIAL_BOOTHS;
let memoryDJRequests: DJSongRequest[] = INITIAL_DJ_REQUESTS;
let memoryDJShoutouts: DJBirthdayShoutout[] = INITIAL_DJ_SHOUTOUTS;
let memoryTimeline: MediaPost[] = INITIAL_TIMELINE;

// Real-Time Event Subscription Listeners
type Listener<T> = (data: T) => void;
const menuListeners = new Set<Listener<MenuItem[]>>();
const ordersListeners = new Set<Listener<Order[]>>();
const eventsListeners = new Set<Listener<EventItem[]>>();
const configListeners = new Set<Listener<SystemConfig>>();
const boothsListeners = new Set<Listener<VIPBooth[]>>();
const djReqListeners = new Set<Listener<DJSongRequest[]>>();
const djShoutListeners = new Set<Listener<DJBirthdayShoutout[]>>();
const timelineListeners = new Set<Listener<MediaPost[]>>();

const notifyMenu = (data: MenuItem[]) => menuListeners.forEach(fn => fn(data));
const notifyOrders = (data: Order[]) => ordersListeners.forEach(fn => fn(data));
const notifyEvents = (data: EventItem[]) => eventsListeners.forEach(fn => fn(data));
const notifyConfig = (data: SystemConfig) => configListeners.forEach(fn => fn(data));
const notifyBooths = (data: VIPBooth[]) => boothsListeners.forEach(fn => fn(data));
const notifyDJReq = (data: DJSongRequest[]) => djReqListeners.forEach(fn => fn(data));
const notifyDJShout = (data: DJBirthdayShoutout[]) => djShoutListeners.forEach(fn => fn(data));
const notifyTimeline = (data: MediaPost[]) => timelineListeners.forEach(fn => fn(data));

// Start background Cloud Firestore Real-time listeners
function initFirestoreSync() {
  testFirestoreConnection();

  // 1. Live Orders sync from Cloud Firestore
  try {
    onSnapshot(collection(db, 'orders'), (snapshot) => {
      const cloudOrders: Order[] = [];
      snapshot.forEach((d) => {
        cloudOrders.push(d.data() as Order);
      });
      cloudOrders.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      memoryOrders = cloudOrders.length > 0 ? cloudOrders : INITIAL_ORDERS;
      notifyOrders(memoryOrders);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'orders');
    });
  } catch (err) {
    console.warn('Orders listener setup notice', err);
  }

  // 2. DJ Song Requests live sync from Cloud Firestore
  try {
    onSnapshot(collection(db, 'dj_requests'), (snapshot) => {
      const requests: DJSongRequest[] = [];
      snapshot.forEach((d) => {
        requests.push(d.data() as DJSongRequest);
      });
      requests.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      memoryDJRequests = requests.length > 0 ? requests : INITIAL_DJ_REQUESTS;
      notifyDJReq(memoryDJRequests);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'dj_requests');
    });
  } catch (err) {
    console.warn('DJ requests listener notice', err);
  }

  // 3. DJ Birthday Shoutouts live sync from Cloud Firestore
  try {
    onSnapshot(collection(db, 'dj_shoutouts'), (snapshot) => {
      const shoutouts: DJBirthdayShoutout[] = [];
      snapshot.forEach((d) => {
        shoutouts.push(d.data() as DJBirthdayShoutout);
      });
      shoutouts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
      memoryDJShoutouts = shoutouts.length > 0 ? shoutouts : INITIAL_DJ_SHOUTOUTS;
      notifyDJShout(memoryDJShoutouts);
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'dj_shoutouts');
    });
  } catch (err) {
    console.warn('DJ shoutouts listener notice', err);
  }

  // 4. Menu Items & Uploaded Products live catalog from Cloud Firestore
  try {
    onSnapshot(collection(db, 'menu_items'), (snapshot) => {
      if (!snapshot.empty) {
        const items: MenuItem[] = [];
        snapshot.forEach((d) => {
          items.push(d.data() as MenuItem);
        });
        memoryMenu = items;
        notifyMenu(memoryMenu);
      } else {
        INITIAL_MENU.forEach(item => {
          setDoc(doc(db, 'menu_items', item.id), item).catch(() => {});
        });
        memoryMenu = INITIAL_MENU;
        notifyMenu(memoryMenu);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'menu_items');
    });
  } catch (err) {
    console.warn('Menu listener notice', err);
  }

  // 5. VIP Booths live sync from Cloud Firestore
  try {
    onSnapshot(collection(db, 'vip_booths'), (snapshot) => {
      if (!snapshot.empty) {
        const boothsList: VIPBooth[] = [];
        snapshot.forEach((d) => {
          boothsList.push(d.data() as VIPBooth);
        });
        memoryBooths = boothsList;
        notifyBooths(memoryBooths);
      } else {
        INITIAL_BOOTHS.forEach(b => {
          setDoc(doc(db, 'vip_booths', b.booth_code), b).catch(() => {});
        });
        memoryBooths = INITIAL_BOOTHS;
        notifyBooths(memoryBooths);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'vip_booths');
    });
  } catch (err) {
    console.warn('Booths listener notice', err);
  }

  // 6. Events & Theme Nights live stream sync
  try {
    onSnapshot(collection(db, 'events'), (snapshot) => {
      if (!snapshot.empty) {
        const evs: EventItem[] = [];
        snapshot.forEach((d) => {
          evs.push(d.data() as EventItem);
        });
        memoryEvents = evs;
        notifyEvents(memoryEvents);
      } else {
        INITIAL_EVENTS.forEach(ev => {
          setDoc(doc(db, 'events', ev.id), ev).catch(() => {});
        });
        memoryEvents = INITIAL_EVENTS;
        notifyEvents(memoryEvents);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'events');
    });
  } catch (err) {
    console.warn('Events listener notice', err);
  }

  // 7. Global System Config live sync
  try {
    onSnapshot(doc(db, 'system_config', 'general'), (docSnap) => {
      if (docSnap.exists()) {
        memoryConfig = docSnap.data() as SystemConfig;
        notifyConfig(memoryConfig);
      } else {
        setDoc(doc(db, 'system_config', 'general'), INITIAL_CONFIG).catch(() => {});
        memoryConfig = INITIAL_CONFIG;
        notifyConfig(memoryConfig);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.GET, 'system_config/general');
    });
  } catch (err) {
    console.warn('Config listener notice', err);
  }

  // 8. Table of the Night photo gallery live sync
  try {
    onSnapshot(collection(db, 'timeline'), (snapshot) => {
      if (!snapshot.empty) {
        const posts: MediaPost[] = [];
        snapshot.forEach((d) => {
          posts.push(d.data() as MediaPost);
        });
        posts.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        memoryTimeline = posts;
        notifyTimeline(memoryTimeline);
      }
    }, (err) => {
      handleFirestoreError(err, OperationType.LIST, 'timeline');
    });
  } catch (err) {
    console.warn('Timeline listener notice', err);
  }
}

// Auto-run Firestore listener initialization
if (typeof window !== 'undefined') {
  initFirestoreSync();
}

export const StorageEngine = {
  
  // -------------------------------------------------------------
  // SUBSCRIPTIONS (Sub-second Live Multi-Device Sync)
  // -------------------------------------------------------------
  subscribeMenu(cb: Listener<MenuItem[]>): () => void {
    menuListeners.add(cb);
    cb(this.getMenu());
    return () => menuListeners.delete(cb);
  },
  subscribeOrders(cb: Listener<Order[]>): () => void {
    ordersListeners.add(cb);
    cb(this.getOrders());
    return () => ordersListeners.delete(cb);
  },
  subscribeEvents(cb: Listener<EventItem[]>): () => void {
    eventsListeners.add(cb);
    cb(this.getEvents());
    return () => eventsListeners.delete(cb);
  },
  subscribeBooths(cb: Listener<VIPBooth[]>): () => void {
    boothsListeners.add(cb);
    cb(this.getBooths());
    return () => boothsListeners.delete(cb);
  },
  subscribeConfig(cb: Listener<SystemConfig>): () => void {
    configListeners.add(cb);
    cb(this.getConfig());
    return () => configListeners.delete(cb);
  },
  subscribeDJRequests(cb: Listener<DJSongRequest[]>): () => void {
    djReqListeners.add(cb);
    cb(this.getDJRequests());
    return () => djReqListeners.delete(cb);
  },
  subscribeDJShoutouts(cb: Listener<DJBirthdayShoutout[]>): () => void {
    djShoutListeners.add(cb);
    cb(this.getDJShoutouts());
    return () => djShoutListeners.delete(cb);
  },
  subscribeTimeline(cb: Listener<MediaPost[]>): () => void {
    timelineListeners.add(cb);
    cb(this.getTimeline());
    return () => timelineListeners.delete(cb);
  },

  // -------------------------------------------------------------
  // ORDERS & RECEIPTS (Cloud-First Real-time Sync)
  // -------------------------------------------------------------
  getOrders(): Order[] {
    return memoryOrders;
  },
  
  saveOrders(orders: Order[]): void {
    memoryOrders = orders;
    notifyOrders(orders);
  },

  addOrder(order: Order): void {
    const orders = [order, ...this.getOrders()];
    this.saveOrders(orders);
    
    // Push to Cloud Firestore
    setDoc(doc(db, 'orders', order.id), order).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `orders/${order.id}`);
    });
  },

  updateOrderStatus(orderId: string, status: Order['order_status']): Order[] {
    const orders = this.getOrders().map(o => {
      if (o.id === orderId) {
        const updatedOrder: Order = {
          ...o,
          order_status: status,
          payment_status: status === 'confirmed' ? 'verified' : o.payment_status,
          confirmed_at: status === 'confirmed' ? (o.confirmed_at || new Date().toISOString()) : o.confirmed_at
        };
        setDoc(doc(db, 'orders', orderId), updatedOrder, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `orders/${orderId}`);
        });
        return updatedOrder;
      }
      return o;
    });
    this.saveOrders(orders);
    return orders;
  },

  deleteOrder(orderId: string): Order[] {
    const orders = this.getOrders().filter(o => o.id !== orderId);
    this.saveOrders(orders);
    
    deleteDoc(doc(db, 'orders', orderId)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `orders/${orderId}`);
    });
    return orders;
  },

  // -------------------------------------------------------------
  // PRODUCTS & MENU CATALOG (Cloud-First Real-time Sync)
  // -------------------------------------------------------------
  getMenu(): MenuItem[] {
    return memoryMenu;
  },

  saveMenu(menu: MenuItem[]): void {
    memoryMenu = menu;
    notifyMenu(menu);
  },

  addMenuItem(item: Omit<MenuItem, 'id'>): MenuItem {
    const newItem: MenuItem = {
      ...item,
      id: `m_${Date.now()}`
    };
    const list = [newItem, ...this.getMenu()];
    this.saveMenu(list);
    
    setDoc(doc(db, 'menu_items', newItem.id), newItem).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `menu_items/${newItem.id}`);
    });
    return newItem;
  },

  updateMenuItem(item: MenuItem): MenuItem[] {
    const list = this.getMenu().map(m => m.id === item.id ? item : m);
    this.saveMenu(list);
    
    setDoc(doc(db, 'menu_items', item.id), item, { merge: true }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `menu_items/${item.id}`);
    });
    return list;
  },

  updateBatchPrices(priceUpdates: { id: string; price: number }[]): MenuItem[] {
    const map = new Map(priceUpdates.map(p => [p.id, p.price]));
    const list = this.getMenu().map(item => {
      if (map.has(item.id)) {
        const updated = { ...item, price: map.get(item.id)! };
        setDoc(doc(db, 'menu_items', item.id), { price: updated.price }, { merge: true }).catch(() => {});
        return updated;
      }
      return item;
    });
    this.saveMenu(list);
    return list;
  },

  deleteMenuItem(itemId: string): MenuItem[] {
    const list = this.getMenu().filter(m => m.id !== itemId);
    this.saveMenu(list);
    
    deleteDoc(doc(db, 'menu_items', itemId)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `menu_items/${itemId}`);
    });
    return list;
  },

  toggleMenuItem(itemId: string, is_visible: boolean): MenuItem[] {
    const menu = this.getMenu().map(item => {
      if (item.id === itemId) {
        const updated = { ...item, is_visible };
        setDoc(doc(db, 'menu_items', itemId), { is_visible }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `menu_items/${itemId}`);
        });
        return updated;
      }
      return item;
    });
    this.saveMenu(menu);
    return menu;
  },

  updateMenuItemImage(itemId: string, imageDataUrl: string): MenuItem[] {
    const menu = this.getMenu().map(item => {
      if (item.id === itemId) {
        const updated = { ...item, image_url: imageDataUrl };
        setDoc(doc(db, 'menu_items', itemId), { image_url: imageDataUrl }, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `menu_items/${itemId}`);
        });
        return updated;
      }
      return item;
    });
    this.saveMenu(menu);
    return menu;
  },

  // -------------------------------------------------------------
  // UPCOMING SCREENINGS & THEME NIGHTS (Cloud-First Real-time Sync)
  // -------------------------------------------------------------
  getEvents(): EventItem[] {
    return memoryEvents;
  },

  saveEvents(events: EventItem[]): void {
    memoryEvents = events;
    notifyEvents(events);
  },

  addEvent(event: Omit<EventItem, 'id'>): EventItem {
    const newEvent: EventItem = {
      ...event,
      id: `ev_${Date.now()}`
    };
    const list = [newEvent, ...this.getEvents()];
    this.saveEvents(list);
    
    setDoc(doc(db, 'events', newEvent.id), newEvent).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `events/${newEvent.id}`);
    });
    return newEvent;
  },

  updateEvent(event: EventItem): EventItem[] {
    const list = this.getEvents().map(e => e.id === event.id ? event : e);
    this.saveEvents(list);
    
    setDoc(doc(db, 'events', event.id), event, { merge: true }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `events/${event.id}`);
    });
    return list;
  },

  deleteEvent(eventId: string): EventItem[] {
    const list = this.getEvents().filter(e => e.id !== eventId);
    this.saveEvents(list);
    
    deleteDoc(doc(db, 'events', eventId)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `events/${eventId}`);
    });
    return list;
  },

  // -------------------------------------------------------------
  // VIP BOOTHS (Cloud-First Real-time Sync)
  // -------------------------------------------------------------
  getBooths(): VIPBooth[] {
    return memoryBooths;
  },

  saveBooths(booths: VIPBooth[]): void {
    memoryBooths = booths;
    notifyBooths(booths);
  },

  updateBoothConfig(booth_code: string, min_spend: number, capacity: number): VIPBooth[] {
    const booths = this.getBooths().map(b => {
      if (b.booth_code === booth_code) {
        const updated = { ...b, min_spend, capacity };
        setDoc(doc(db, 'vip_booths', booth_code), updated, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `vip_booths/${booth_code}`);
        });
        return updated;
      }
      return b;
    });
    this.saveBooths(booths);
    return booths;
  },

  updateAllBooths(newBooths: VIPBooth[]): void {
    this.saveBooths(newBooths);
    newBooths.forEach(b => {
      setDoc(doc(db, 'vip_booths', b.booth_code), b, { merge: true }).catch(() => {});
    });
  },

  lockBooth(code: string, customerName: string, phone: string): VIPBooth[] {
    const booths = this.getBooths().map(b => {
      if (b.booth_code === code) {
        const updated = {
          ...b,
          is_reserved: true,
          reserved_by: customerName,
          contact_phone: phone,
          reserved_at: new Date().toISOString(),
          hold_expires_at: new Date(Date.now() + 20 * 60 * 1000).toISOString()
        };
        setDoc(doc(db, 'vip_booths', code), updated, { merge: true }).catch(() => {});
        return updated;
      }
      return b;
    });
    this.saveBooths(booths);
    return booths;
  },

  // -------------------------------------------------------------
  // DJ CONSOLE QUEUES (Cloud-First Real-time Sync)
  // -------------------------------------------------------------
  getDJRequests(): DJSongRequest[] {
    return memoryDJRequests;
  },

  saveDJRequests(requests: DJSongRequest[]): void {
    memoryDJRequests = requests;
    notifyDJReq(requests);
  },

  addDJRequest(req: Omit<DJSongRequest, 'id' | 'created_at' | 'status'>): DJSongRequest {
    const newReq: DJSongRequest = {
      ...req,
      id: `DJR-${Math.floor(100 + Math.random() * 900)}`,
      created_at: new Date().toISOString(),
      status: "queued"
    };
    const list = [newReq, ...this.getDJRequests()];
    this.saveDJRequests(list);
    
    setDoc(doc(db, 'dj_requests', newReq.id), newReq).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `dj_requests/${newReq.id}`);
    });
    return newReq;
  },

  dismissDJRequest(id: string): DJSongRequest[] {
    const list = this.getDJRequests().filter(r => r.id !== id);
    this.saveDJRequests(list);
    
    deleteDoc(doc(db, 'dj_requests', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `dj_requests/${id}`);
    });
    return list;
  },

  getDJShoutouts(): DJBirthdayShoutout[] {
    return memoryDJShoutouts;
  },

  saveDJShoutouts(shoutouts: DJBirthdayShoutout[]): void {
    memoryDJShoutouts = shoutouts;
    notifyDJShout(shoutouts);
  },

  addDJShoutout(shoutout: Omit<DJBirthdayShoutout, 'id' | 'created_at' | 'status'>): DJBirthdayShoutout {
    const newShoutout: DJBirthdayShoutout = {
      ...shoutout,
      id: `SH-${Math.floor(100 + Math.random() * 900)}`,
      created_at: new Date().toISOString(),
      status: "queued"
    };
    const list = [newShoutout, ...this.getDJShoutouts()];
    this.saveDJShoutouts(list);
    
    setDoc(doc(db, 'dj_shoutouts', newShoutout.id), newShoutout).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `dj_shoutouts/${newShoutout.id}`);
    });
    return newShoutout;
  },

  dismissDJShoutout(id: string): DJBirthdayShoutout[] {
    const list = this.getDJShoutouts().filter(s => s.id !== id);
    this.saveDJShoutouts(list);
    
    deleteDoc(doc(db, 'dj_shoutouts', id)).catch(err => {
      handleFirestoreError(err, OperationType.DELETE, `dj_shoutouts/${id}`);
    });
    return list;
  },

  // -------------------------------------------------------------
  // TABLE OF THE NIGHT (Cloud-First Gallery)
  // -------------------------------------------------------------
  getTimeline(): MediaPost[] {
    const now = Date.now();
    const active = memoryTimeline.filter(post => {
      const exp = new Date(post.expires_at).getTime();
      return exp > now;
    });
    return active;
  },

  saveTimeline(timeline: MediaPost[]): void {
    memoryTimeline = timeline;
    notifyTimeline(timeline);
  },

  addTimelinePost(post: Omit<MediaPost, 'id' | 'reactions' | 'created_at' | 'expires_at'>): MediaPost {
    const now = new Date();
    const expires = new Date(now.getTime() + 10 * 3600 * 1000);
    const newPost: MediaPost = {
      ...post,
      id: `TL-${Math.floor(1000 + Math.random() * 9000)}`,
      reactions: { fire: 0, champagne: 0, crown: 0, dance: 0 },
      created_at: now.toISOString(),
      expires_at: expires.toISOString(),
    };
    const list = [newPost, ...this.getTimeline()];
    this.saveTimeline(list);
    
    setDoc(doc(db, 'timeline', newPost.id), newPost).catch(err => {
      handleFirestoreError(err, OperationType.CREATE, `timeline/${newPost.id}`);
    });
    return newPost;
  },

  incrementReaction(postId: string, reactionType: keyof MediaPost['reactions']): MediaPost[] {
    const list = this.getTimeline().map(post => {
      if (post.id === postId) {
        const updatedPost = {
          ...post,
          reactions: {
            ...post.reactions,
            [reactionType]: (post.reactions[reactionType] || 0) + 1
          }
        };
        setDoc(doc(db, 'timeline', postId), updatedPost, { merge: true }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `timeline/${postId}`);
        });
        return updatedPost;
      }
      return post;
    });
    this.saveTimeline(list);
    return list;
  },

  // -------------------------------------------------------------
  // SYSTEM CONFIG & VENUE CONTACTS (Cloud-First)
  // -------------------------------------------------------------
  getConfig(): SystemConfig {
    return memoryConfig;
  },

  saveConfig(cfg: SystemConfig): void {
    memoryConfig = cfg;
    notifyConfig(cfg);
    setDoc(doc(db, 'system_config', 'general'), cfg, { merge: true }).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, 'system_config/general');
    });
  },

  updateTicker(ticker: string): void {
    const cfg = this.getConfig();
    cfg.active_ticker = ticker;
    this.saveConfig(cfg);
  },

  updateAdSettings(intervalSeconds: number, enabled: boolean): void {
    const cfg = this.getConfig();
    cfg.ad_interval_seconds = intervalSeconds;
    cfg.ad_enabled = enabled;
    this.saveConfig(cfg);
  },

  updateAdCampaign(ad: AdCampaign): SystemConfig {
    const cfg = this.getConfig();
    cfg.active_ad = ad;
    this.saveConfig(cfg);
    return cfg;
  },

  updateVenueContacts(contacts: SystemConfig['venue_contacts']): SystemConfig {
    const cfg = this.getConfig();
    cfg.venue_contacts = { ...contacts };
    this.saveConfig(cfg);
    return cfg;
  },

  updateGateway(gateway: PaymentGateway, merchant_code: string, short_code: string): void {
    const cfg = this.getConfig();
    if (cfg.momo_gateways[gateway]) {
      cfg.momo_gateways[gateway].merchant_code = merchant_code;
      cfg.momo_gateways[gateway].short_code = short_code;
      this.saveConfig(cfg);
    }
  },

  getManagerAudit(): ManagerAuditSummary {
    const orders = this.getOrders().filter(o => o.order_status === 'confirmed');
    const gross = orders.reduce((sum, o) => sum + o.total_amount_zmw, 0);
    const cash = orders.filter(o => o.payment_method === 'cash').reduce((sum, o) => sum + o.total_amount_zmw, 0);
    const momo = gross - cash;
    const breakdown = {
      airtel: orders.filter(o => o.payment_method === 'airtel').reduce((sum, o) => sum + o.total_amount_zmw, 0),
      mtn: orders.filter(o => o.payment_method === 'mtn').reduce((sum, o) => sum + o.total_amount_zmw, 0),
      zamtel: orders.filter(o => o.payment_method === 'zamtel').reduce((sum, o) => sum + o.total_amount_zmw, 0),
    };
    const pendingCount = this.getOrders().filter(o => o.order_status === 'pending').length;

    return {
      venue: "Phoenix Lounge Kabwe",
      audit_timestamp: new Date().toISOString(),
      gross_confirmed_zmw: Math.round(gross * 100) / 100,
      cash_gross_zmw: Math.round(cash * 100) / 100,
      momo_gross_zmw: Math.round(momo * 100) / 100,
      momo_breakdown_zmw: breakdown,
      total_confirmed_orders: orders.length,
      pending_fulfillment_orders: pendingCount
    };
  }
};
