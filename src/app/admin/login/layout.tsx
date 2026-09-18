import type { Metadata } from 'next';
import { CleanBrowserUrl } from '@/components/CleanBrowserUrl';

export const metadata: Metadata = {
  title: 'Admin Sign In | Becoming Her',
  description: 'Authorized administrative access for Becoming Her.',
};

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <CleanBrowserUrl />
      {children}
    </>
  );
}
