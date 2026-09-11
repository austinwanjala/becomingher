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

  if (error || !data.user) {
    console.error('[ADMIN_LOGIN] Supabase login error:', error?.message)
    redirect(
      `/admin/login?message=${encodeURIComponent(error?.message || 'Invalid administrator credentials. Access denied.')}&redirect=${encodeURIComponent(redirectTarget)}`
    )
  }

  // Strict Role-Based Check: Deny customers from logging in as admin
  const role = await getUserRole(data.user, supabase)

  if (!isAdminRole(role)) {
    console.warn(`[ADMIN_LOGIN] Access Denied: User ${email} has role '${role}', not admin.`)

    // Invalidate the session immediately so unauthorized session cookie is destroyed
    await supabase.auth.signOut()

    redirect(
      `/admin/login?message=${encodeURIComponent(
        `Access Denied: Account '${email}' is currently registered as a Customer. To grant administrator rights, set role to 'ADMIN' in Supabase, or add this email to ADMIN_EMAILS in .env.local.`
      )}&redirect=${encodeURIComponent(redirectTarget)}`
    )
  }

  // Ensure admin profile exists in database
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
  } catch {
    // Ignore profile upsert errors
  }

  revalidatePath('/admin', 'layout')
  redirect(redirectTarget)
}
