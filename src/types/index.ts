export type UserRole = 'SUPER_ADMIN' | 'ADMIN' | 'COACH' | 'CUSTOMER';

export type ServiceType = 'DIGITAL_PROGRAMME' | 'CUSTOM_COACHING' | 'INTERPERSONAL_SESSION';

export type PaymentStatus = 
  | 'PENDING' 
  | 'PROCESSING' 
  | 'SUCCESSFUL' 
  | 'FAILED' 
  | 'CANCELLED' 
  | 'REFUNDED' 
  | 'VERIFICATION_REQUIRED';

export type EntitlementStatus = 'ACTIVE' | 'EXPIRED' | 'REVOKED' | 'SUSPENDED';

export type BookingStatus = 
  | 'PENDING_PAYMENT' 
  | 'CONFIRMED' 
  | 'COMPLETED' 
  | 'CANCELLED' 
  | 'NO_SHOW' 
  | 'RESCHEDULED';

export interface UserProfile {
  id: string;
  email: string;
  full_name: string;
  phone_number?: string;
  avatar_url?: string;
  role: UserRole;
  created_at: string;
  updated_at?: string;
}

export interface Service {
  id: string;
  type: ServiceType;
  slug: string;
  name: string;
  short_description: string;
  description: string;
  price: number;
  currency: string;
  image_url: string;
  duration: string;
  is_active: boolean;
  is_featured: boolean;
  features: string[];
  selar_product_id?: string;
  selar_product_url?: string;
  created_at: string;
  updated_at?: string;
}

export interface SelarProductMapping {
  id: string;
  service_id: string;
  selar_product_id: string;
  selar_product_url: string;
  product_name: string;
  price: number;
  currency: string;
  is_active: boolean;
}

export interface Order {
  id: string;
  order_reference: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  service_id: string;
  service_name: string;
  selar_product_id?: string;
  payment_provider: 'SELAR' | 'MPESA' | 'MANUAL';
  payment_status: PaymentStatus;
  transaction_reference: string;
  amount: number;
  currency: string;
  discount_amount?: number;
  coupon_code?: string;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at?: string;
}

export interface Entitlement {
  id: string;
  customer_id: string;
  service_id: string;
  service_name: string;
  service_type: ServiceType;
  order_id: string;
  status: EntitlementStatus;
  progress_percentage: number;
  start_date: string;
  expires_at?: string;
  completed_at?: string;
}

export interface ProgrammeLesson {
  id: string;
  title: string;
  duration: string;
  description: string;
  video_url?: string;
  audio_url?: string;
  pdf_url?: string;
  content: string;
  order: number;
  is_completed?: boolean;
}

export interface ReflectionQuestion {
  id: string;
  question: string;
  placeholder?: string;
  order: number;
}

export interface UserReflection {
  id: string;
  user_id: string;
  programme_id: string;
  module_id: string;
  question_id: string;
  question: string;
  response: string;
  created_at: string;
  updated_at?: string;
}

export interface ProgrammeModule {
  id: string;
  programme_id: string;
  title: string;
  description: string;
  order: number;
  lessons: ProgrammeLesson[];
  reflection_questions: ReflectionQuestion[];
}

export interface Programme {
  id: string;
  service_id: string;
  title: string;
  subtitle: string;
  description: string;
  overview: string;
  image_url: string;
  is_published: boolean;
  modules: ProgrammeModule[];
}

export interface OnboardingQuestionnaire {
  id?: string;
  user_id: string;
  life_area: string;
  current_challenge?: string;
  challenge?: string;
  desired_achievement?: string;
  goals?: string;
  obstacles?: string;
  current_goals?: string;
  support_preference?: string;
  support_pref?: string;
  additional_notes?: string;
  submitted_at?: string;
  completed_at?: string;
}

export interface Goal {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  target_date: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'COMPLETED' | 'PAUSED';
  progress: number;
  action_steps: { id: string; text: string; is_completed: boolean }[];
  created_at: string;
}

export interface Coach {
  id: string;
  name: string;
  title: string;
  bio: string;
  avatar_url: string;
  email: string;
  phone: string;
  available_days: string[]; // ['Monday', 'Wednesday', 'Friday']
  available_hours: { start: string; end: string }[];
  session_duration_minutes: number;
}

export interface Booking {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_email: string;
  customer_phone?: string;
  coach_id: string;
  coach_name: string;
  service_id: string;
  scheduled_date: string;
  start_time: string;
  end_time: string;
  timezone: string;
  order_id?: string;
  payment_status: PaymentStatus;
  booking_status: BookingStatus;
  meeting_link?: string;
  calendar_event_id?: string;
  reservation_expires_at?: string;
  notes?: string;
  created_at: string;
}

export interface AIMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface AIConversation {
  id: string;
  user_id: string;
  title: string;
  service_type: ServiceType;
  programme_id?: string;
  messages: AIMessage[];
  created_at: string;
  updated_at: string;
}

export interface KnowledgeDocument {
  id: string;
  title: string;
  category: 'FRAMEWORK' | 'METHODOLOGY' | 'FAQ' | 'EXERCISE' | 'POLICY';
  programme_id?: string;
  content: string;
  tags: string[];
  is_published: boolean;
  updated_at: string;
}

export interface Testimonial {
  id: string;
  name: string;
  role: string;
  quote: string;
  avatar_url: string;
  programme_name: string;
  rating: number;
  is_published: boolean;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  is_published: boolean;
}

export interface Coupon {
  id: string;
  code: string;
  discount_type: 'PERCENTAGE' | 'FIXED';
  discount_value: number;
  min_spend?: number;
  service_id?: string;
  usage_limit?: number;
  times_used: number;
  expiry_date?: string;
  is_active: boolean;
}

export interface AuditLog {
  id: string;
  user_id: string;
  user_email: string;
  action: string;
  resource: string;
  resource_id?: string;
  details: string;
  timestamp: string;
}

export interface SiteCMSContent {
  hero: {
    badge: string;
    heading: string;
    subheading: string;
    cta_primary_text: string;
    cta_primary_link: string;
    cta_secondary_text: string;
    cta_secondary_link: string;
    image_url: string;
  };
  about: {
    heading: string;
    story: string;
    mission: string;
    vision: string;
    values: { title: string; desc: string }[];
  };
  contact: {
    email: string;
    phone: string;
    address: string;
    instagram: string;
    selar_store_url: string;
  };
}

export type WhatsAppConversationState =
  | 'NEW_VISITOR'
  | 'DISCOVERY'
  | 'COACHING'
  | 'SERVICE_RECOMMENDATION'
  | 'PAYMENT_INTEREST'
  | 'ACCOUNT_CREATION'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_SUCCESSFUL'
  | 'PAYMENT_FAILED'
  | 'CUSTOMER_ACTIVE'
  | 'JOURNAL_REFLECTION'
  | 'BOOKING_FLOW'
  | 'SUPPORT'
  | 'HUMAN_HANDOFF';

export type WhatsAppStatus = 'BOT' | 'HUMAN_HANDOFF' | 'RESOLVED';
export type WhatsAppMessageDirection = 'INBOUND' | 'OUTBOUND';
export type WhatsAppMessageType = 'TEXT' | 'INTERACTIVE' | 'TEMPLATE';

export interface WhatsAppContact {
  id: string;
  phone_number: string;
  whatsapp_user_id?: string;
  user_id?: string; // linked to profiles.id
  name: string;
  profile_data?: Record<string, any>;
  first_interaction: string;
  last_interaction: string;
  created_at: string;
  updated_at?: string;
}

export interface WhatsAppConversation {
  id: string;
  contact_id: string;
  user_id?: string;
  phone_number: string;
  state: WhatsAppConversationState;
  status: WhatsAppStatus;
  recommended_service?: string; // e.g. 'srv-guided-01'
  intended_service?: string; // e.g. 'srv-custom-02'
  summary?: string;
  session_token?: string;
  message_count: number;
  last_message_at: string;
  created_at: string;
  updated_at?: string;
}

export interface WhatsAppMessage {
  id: string;
  conversation_id: string;
  direction: WhatsAppMessageDirection;
  message_type: WhatsAppMessageType;
  content: string;
  whatsapp_message_id?: string;
  ai_generated: boolean;
  interactive_options?: string[];
  created_at: string;
}

export interface WhatsAppConfig {
  phone_number_id: string;
  business_account_id: string;
  business_number: string;
  webhook_verify_token: string;
  welcome_message: string;
  ai_personality: string;
  business_hours: string;
  human_handoff_enabled: boolean;
  automated_reminders_enabled: boolean;
  reminder_24h_template: string;
  reminder_1h_template: string;
  payment_confirmation_template: string;
}

export interface WhatsAppFunnelMetrics {
  total_conversations: number;
  discovery_count: number;
  service_interest_count: number;
  purchase_intent_count: number;
  registration_started_count: number;
  checkout_redirect_count: number;
  payment_successful_count: number;
  conversion_rate_percentage: number;
  service_breakdown: {
    guided: number;
    customized: number;
    interpersonal: number;
  };
}

