'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

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

  if (error) {
    console.error('[ADMIN_LOGIN] Supabase login error:', error.message)
    redirect(
      `/admin/login?message=${encodeURIComponent(error.message || 'Invalid administrator credentials. Access denied.')}&redirect=${encodeURIComponent(redirectTarget)}`
    )
  }

  revalidatePath('/admin', 'layout')
  redirect(redirectTarget)
}
