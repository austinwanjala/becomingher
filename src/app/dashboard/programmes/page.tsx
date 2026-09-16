import { redirect } from 'next/navigation';
import { createClient } from '@/utils/supabase/server';

export default async function ProgrammesHubPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: entitlements } = await supabase
    .from('entitlements')
    .select('*')
    .eq('customer_id', user.id)
    .eq('status', 'ACTIVE')
    .order('start_date', { ascending: false });

  if (entitlements && entitlements.length > 0) {
    // Redirect to the most recently purchased active programme
    redirect(`/dashboard/programmes/${entitlements[0].service_id}`);
  }

  // Fallback to overview if no active programmes
  redirect('/dashboard');
}
