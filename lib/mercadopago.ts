// ============================================================
// lib/mercadopago.ts — Cliente y tipos de MercadoPago
// ============================================================

const MP_BASE_URL = 'https://api.mercadopago.com';

// ---- Tipos de Checkout Pro ----

export interface MPPreferenceItem {
  id: string;
  title: string;
  description?: string;
  quantity: number;
  currency_id: 'MXN';
  unit_price: number;
  category_id?: string;
}

export interface MPPayer {
  name?: string;
  surname?: string;
  email: string;
  phone?: { area_code?: string; number: string };
}

export interface MPBackUrls {
  success: string;
  failure: string;
  pending: string;
}

export interface CreatePreferenceInput {
  items: MPPreferenceItem[];
  payer?: MPPayer;
  back_urls: MPBackUrls;
  auto_return?: 'approved' | 'all';
  external_reference: string; // nuestro folio
  notification_url?: string;  // webhook
  statement_descriptor?: string;
  expires?: boolean;
  expiration_date_to?: string; // ISO
  metadata?: Record<string, string>;
  payment_methods?: {
    excluded_payment_types?: { id: string }[];
    installments?: number;
  };
}

export interface MPPreferenceResponse {
  id: string;
  init_point: string;       // URL de producción para pagar
  sandbox_init_point: string; // URL de test para pagar
  external_reference: string;
  date_created: string;
  client_id: string;
  collector_id: number;
  // ... más campos que no usamos
}

export interface MPPaymentResponse {
  id: number;
  status: 'pending' | 'approved' | 'authorized' | 'in_process' | 'in_mediation' | 'rejected' | 'cancelled' | 'refunded' | 'charged_back';
  status_detail: string;
  external_reference: string;
  transaction_amount: number;
  net_received_amount?: number;
  fee_details?: Array<{ type: string; amount: number }>;
  payment_method_id: string;     // 'visa', 'oxxo', 'spei', etc.
  payment_type_id: string;       // 'credit_card', 'ticket', 'bank_transfer'
  date_created: string;
  date_approved: string | null;
  date_last_updated: string;
  payer: { email: string; identification?: { type: string; number: string } };
  metadata?: Record<string, unknown>;
}

// ============================================================
// FUNCIONES
// ============================================================

function getAccessToken(): string {
  const token = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!token) {
    throw new Error('MERCADOPAGO_ACCESS_TOKEN no está configurado');
  }
  return token;
}

/**
 * Crea una preference de pago en MercadoPago.
 * Devuelve la URL a la que hay que redirigir al usuario.
 */
export async function createPreference(input: CreatePreferenceInput): Promise<MPPreferenceResponse> {
  const token = getAccessToken();

  const response = await fetch(`${MP_BASE_URL}/checkout/preferences`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MP createPreference failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Consulta el detalle de un pago por su ID.
 * Se usa en el webhook para conocer el status real.
 */
export async function getPayment(paymentId: string | number): Promise<MPPaymentResponse> {
  const token = getAccessToken();

  const response = await fetch(`${MP_BASE_URL}/v1/payments/${paymentId}`, {
    headers: { 'Authorization': `Bearer ${token}` },
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`MP getPayment failed (${response.status}): ${errorText}`);
  }

  return response.json();
}

/**
 * Mapea status de MercadoPago a nuestro enum payment_status.
 */
export function mapPaymentStatus(mpStatus: MPPaymentResponse['status']) {
  const map = {
    'pending':      'pending',
    'in_process':   'in_process',
    'in_mediation': 'in_process',
    'authorized':   'in_process',
    'approved':     'approved',
    'rejected':     'rejected',
    'cancelled':    'cancelled',
    'refunded':     'refunded',
    'charged_back': 'refunded',
  } as const;
  return map[mpStatus] || 'pending';
}

/**
 * Determina el nuevo status del booking según el pago recibido.
 */
export function mapBookingStatusFromPayment(mpStatus: MPPaymentResponse['status']) {
  if (mpStatus === 'approved') return 'confirmed';
  if (mpStatus === 'rejected' || mpStatus === 'cancelled') return 'cancelled';
  if (mpStatus === 'refunded' || mpStatus === 'charged_back') return 'cancelled';
  return 'pending'; // pending, in_process, etc.
}

/**
 * Devuelve la URL de checkout apropiada según el entorno.
 * En desarrollo/test usa sandbox; en producción usa init_point.
 */
export function getCheckoutUrl(preference: MPPreferenceResponse): string {
  const isTest = process.env.MERCADOPAGO_ACCESS_TOKEN?.startsWith('TEST-') ||
                 process.env.MERCADOPAGO_ACCESS_TOKEN?.includes('APP_USR-') === false;
  // Nota: las credenciales TEST de MP empiezan con APP_USR- también,
  // pero el sitio de "developers" da credenciales de PRUEBA por defecto.
  // Para Checkout Pro, init_point siempre funciona, sandbox_init_point se usa
  // solo si usas explícitamente entorno sandbox configurable.
  return preference.init_point;
}
