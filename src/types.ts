export type PaymentGateway = 'cash' | 'airtel' | 'mtn' | 'zamtel';
export type OrderStatus = 'pending' | 'confirmed' | 'dropped';
export type PaymentStatus = 'unpaid' | 'submitted' | 'verified' | 'failed';
export type BoothTier = 'vip' | 'vvip_presidential';

export interface OrderItem {
  id: string;
  name: string;
  category: string;
  price: number;
  quantity: number;
  total_price: number;
}

export interface Order {
  id: string;
  order_ref: string;
  table_booth_number: string;
  customer_name: string;
  customer_phone: string;
  payment_method: PaymentGateway;
  momo_reference?: string;
  payment_status: PaymentStatus;
  order_status: OrderStatus;
  total_amount_zmw: number;
  items: OrderItem[];
  notes?: string;
  created_at: string;
  confirmed_at?: string | null;
}

export interface MenuItem {
  id: string;
  category: string;
  name: string;
  price: number;
  description: string;
  image_url: string;
  is_visible: boolean;
  in_stock: boolean;
}

export interface DJSongRequest {
  id: string;
  customer_name: string;
  booth_table: string;
  song_title: string;
  artist: string;
  personal_note?: string;
  is_played?: boolean;
  status?: 'pending' | 'queued' | 'spinning' | 'played' | 'dismissed';
  created_at: string;
}

export interface DJBirthdayShoutout {
  id: string;
  celebrant_name: string;
  booth_number: string;
  customized_text: string;
  song_selection: string;
  package_type?: 'standard' | 'sparkler_vip' | 'champagne_fanfare';
  is_announced?: boolean;
  status?: 'queued' | 'announced' | 'dismissed';
  created_at: string;
}

export interface VIPBooth {
  booth_code: string;
  name: string;
  tier: BoothTier;
  capacity: number;
  min_spend: number;
  is_reserved: boolean;
  reserved_by?: string | null;
  contact_phone?: string | null;
  reserved_at?: string | null;
  hold_expires_at?: string | null; // 20-min hold threshold
}

export interface MediaPost {
  id: string;
  uploader_name: string;
  table_booth: string;
  caption: string;
  image_url: string;
  reactions: {
    fire: number;
    champagne: number;
    crown: number;
    dance: number;
  };
  created_at: string;
  expires_at: string; // 10 hours after creation
}

export interface GatewayConfig {
  merchant_code: string;
  short_code: string;
  name: string;
}

export interface EventItem {
  id: string;
  category: string;
  title: string;
  subtitle: string;
  date: string;
  description: string;
  tag: string;
  badgeColor?: string;
  image_url?: string;
  is_active: boolean;
}

export interface AdCampaign {
  id: string;
  badge_text: string;
  title: string;
  description: string;
  price_tag?: string;
  action_text: string;
  action_target?: 'menu' | 'vip' | 'dj' | 'external';
  image_url?: string;
  is_active: boolean;
}

export interface SystemConfig {
  momo_gateways: Record<PaymentGateway, GatewayConfig>;
  venue_contacts: {
    address: string;
    hotline: string;
    alt_phone: string;
    whatsapp?: string;
    kitchen_phone?: string;
    hours: string;
  };
  active_ticker: string;
  ad_interval_seconds: number;
  ad_enabled: boolean;
  active_ad?: AdCampaign;
}

export interface ManagerAuditSummary {
  venue: string;
  audit_timestamp: string;
  gross_confirmed_zmw: number;
  cash_gross_zmw: number;
  momo_gross_zmw: number;
  momo_breakdown_zmw: Record<string, number>;
  total_confirmed_orders: number;
  pending_fulfillment_orders: number;
}
