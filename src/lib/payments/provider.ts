import { Order, PaymentStatus } from '@/types';

export interface CreateCheckoutParams {
  orderId: string;
  serviceId: string;
  serviceName: string;
  amount: number;
  currency: string;
  customerName: string;
  customerEmail: string;
  customerPhone?: string;
  returnUrl: string;
  metadata?: Record<string, any>;
}

export interface CheckoutResult {
  checkoutUrl: string;
  transactionReference: string;
  provider: string;
  metadata?: Record<string, any>;
}

export interface VerifyPaymentResult {
  isVerified: boolean;
  status: PaymentStatus;
  amount: number;
  currency: string;
  transactionReference: string;
  customerEmail: string;
  selarProductId?: string;
  rawResponse?: any;
}

export interface PaymentProvider {
  name: string;
  createCheckout(params: CreateCheckoutParams): Promise<CheckoutResult>;
  verifyPayment(transactionReference: string): Promise<VerifyPaymentResult>;
  handleWebhook(payload: any, signature?: string): Promise<VerifyPaymentResult | null>;
  getTransaction(transactionReference: string): Promise<any>;
  refundPayment(transactionReference: string, reason?: string): Promise<{ success: boolean; message: string }>;
}
