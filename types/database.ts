// ============================================================
// types/database.ts
// ============================================================
// Tipos TypeScript que reflejan el schema de Supabase.
// Manualmente mantenidos para evitar dependencia de supabase-cli.
// ============================================================

export type UserRole = 'customer' | 'staff' | 'admin';
export type BookingStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
export type PaymentProvider = 'mercadopago' | 'manual' | 'transfer' | 'cash';
export type PaymentStatus = 'pending' | 'approved' | 'rejected' | 'refunded' | 'cancelled' | 'in_process';
export type CampaignPlatform = 'instagram' | 'facebook' | 'linkedin' | 'tiktok' | 'google' | 'other';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed' | 'archived';
export type PricingModel = 'hourly' | 'daily';
export type AccentColor = 'terra' | 'blue' | 'moss';

export interface Profile {
  id: string;
  full_name: string;
  phone: string | null;
  role: UserRole;
  avatar_initials: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface Space {
  id: string;
  name: string;
  tag: string;
  accent_color: AccentColor;
  description: string;
  capacity: number;
  base_price: number;       // en MXN (no centavos)
  extra_price: number;
  base_unit: string;
  pricing_model: PricingModel;
  features: string[];
  open_hour: number;
  close_hour: number;
  package_days: number;     // días del paquete multi-día (default 5)
  is_active: boolean;
  display_order: number;
  created_at: string;
  updated_at: string;
}

export interface Booking {
  id: string;
  folio: string;
  user_id: string;
  space_id: string;
  starts_at: string;       // ISO timestamp
  ends_at: string;
  duration_hours: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  notes: string | null;
  subtotal_cents: number;
  tax_cents: number;
  total_cents: number;
  status: BookingStatus;
  cancelled_at: string | null;
  cancelled_reason: string | null;
  created_at: string;
  updated_at: string;
  // Cuando hacemos join con spaces
  spaces?: Pick<Space, 'name' | 'accent_color' | 'base_unit' | 'capacity'>;
}

export interface AvailableSlot {
  slot_hour: number;        // 10, 11, 12...
  is_available: boolean;
}

export interface Payment {
  id: string;
  booking_id: string;
  provider: PaymentProvider;
  mp_preference_id: string | null;
  mp_payment_id: string | null;
  mp_external_ref: string | null;
  mp_payment_method: string | null;
  mp_payment_type: string | null;
  amount_cents: number;
  net_received_cents: number | null;
  fee_cents: number | null;
  status: PaymentStatus;
  status_detail: string | null;
  paid_at: string | null;
  refunded_at: string | null;
  refund_amount_cents: number | null;
  created_at: string;
  updated_at: string;
}

export interface Campaign {
  id: string;
  name: string;
  platform: CampaignPlatform;
  status: CampaignStatus;
  starts_on: string | null;
  ends_on: string | null;
  budget_cents: number;
  spent_cents: number;
  reach: number;
  engagement_pct: number;
  leads: number;
  conversions: number;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface BusinessSettings {
  id: number;
  name: string;
  email: string;
  address: string;
  whatsapp: string;
  open_time: string;
  close_time: string;
  open_days: string[];
  maps_embed: string | null;
  updated_at: string;
}
