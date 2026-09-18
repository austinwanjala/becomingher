'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUserRole, isAdminRole } from '@/lib/auth/roles'

export async function adminLogin(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const redirectTarget = (formData.get('redirect') as string) || '/admin'

  if (!email || !password) {
    redirect(
      `/admin/login?message=${encodeURIComponent('Please provide both administrator email and password.')}&redirect=${encodeURIComponent(redirectTarget)}`
    )
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error || !data?.user) {
    console.error('[ADMIN_LOGIN] Supabase login error:', error?.message)
    let userMsg = error?.message || 'Invalid administrator credentials. Access denied.'
    if (userMsg.includes('fetch failed') || userMsg.includes('ENOTFOUND')) {
      userMsg = 'Cannot connect to Supabase backend. Please ensure NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY are added to your Vercel Project Settings > Environment Variables, and that you have redeployed.'
    }
    redirect(
      `/admin/login?message=${encodeURIComponent(userMsg)}&redirect=${encodeURIComponent(redirectTarget)}`
    )
  }

  // Strict Role-Based Check: Deny customers from logging in as admin
  const role = await getUserRole(data.user, supabase)

  if (!isAdminRole(role)) {
    console.warn(`[ADMIN_LOGIN] Access Denied: User ${email} has role '${role}', not admin.`)

    // Invalidate the session immediately so unauthorized session cookie is destroyed
    await supabase.auth.signOut()

    redirect(
      `/admin/login?message=${encodeURIComponent("You don't have access rights")}&redirect=${encodeURIComponent(redirectTarget)}`
    )
  }

  // Ensure admin role and profile exist in database
  try {
    const adminName = data.user.user_metadata?.name || email.split('@')[0];
    await supabase.from('profiles').upsert(
      {
        id: data.user.id,
        full_name: adminName,
        role: role,
      },
      { onConflict: 'id' }
    );
    await supabase.from('user_roles').upsert(
      {
        user_id: data.user.id,
        role_id: role,
      },
      { onConflict: 'user_id,role_id' }
    );
  } catch {
    // Ignore database table sync errors
  }

  revalidatePath('/admin', 'layout')
  redirect(redirectTarget)
}
