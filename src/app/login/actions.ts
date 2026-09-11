'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'
import { getUserRole, isAdminRole } from '@/lib/auth/roles'

export async function login(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const redirectTarget = (formData.get('redirect') as string) || '/dashboard'

  if (!email || !password) {
    redirect(`/login?message=${encodeURIComponent('Please enter your email and password.')}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })

  if (error) {
    console.error('Supabase login error:', error)
    let userMsg = error.message
    if (error.message.includes('Email not confirmed')) {
      userMsg = 'Please verify your email address, or disable "Confirm email" in your Supabase Auth settings to log in immediately.'
    } else if (error.message.includes('Invalid login credentials')) {
      userMsg = 'Invalid email or password. Please check your credentials or create a new account.'
    }
    redirect(`/login?message=${encodeURIComponent(userMsg)}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  // Safe redirect resolution: customer logins must never be redirected to /admin
  let target = redirectTarget;
  if (!target || target.startsWith('/admin')) {
    const role = await getUserRole(data?.user, supabase);
    target = isAdminRole(role) ? '/admin' : '/dashboard';
  }

  revalidatePath('/', 'layout')
  redirect(target)
}
