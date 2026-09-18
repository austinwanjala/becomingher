import type { Metadata } from 'next';
import { ForgotPasswordForm } from './ForgotPasswordForm';
import { CleanBrowserUrl } from '@/components/CleanBrowserUrl';

export const metadata: Metadata = {
  title: 'Forgot Password | Becoming Her',
  description: 'Reset your Becoming Her personal development account password.',
};

export default function ForgotPasswordPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#FAF8F5] p-4 text-stone-900 relative">
      <CleanBrowserUrl />
      {/* Background ambient accents */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-b from-rose-100/40 via-amber-50/30 to-transparent pointer-events-none" />

      <ForgotPasswordForm />
    </div>
  );
}
