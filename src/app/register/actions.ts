'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createClient } from '@/utils/supabase/server'

export async function signup(formData: FormData) {
  const supabase = await createClient()

  const email = (formData.get('email') as string)?.trim()
  const password = formData.get('password') as string
  const name = (formData.get('name') as string)?.trim()
  const phone = (formData.get('phone') as string)?.trim()
  const redirectTarget = (formData.get('redirect') as string) || '/dashboard'

  if (!email || !password) {
    redirect(`/register?message=${encodeURIComponent('Please provide both email and password.')}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  if (password.length < 6) {
    redirect(`/register?message=${encodeURIComponent('Password must be at least 6 characters long.')}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  const { data: authData, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      data: {
        name: name || 'Beloved Member',
        phone: phone || '',
      }
    }
  })

  if (!error && authData.user && phone) {
    // Asynchronously link WhatsApp contact to user in local store/DB
    import('@/lib/store').then(async ({ store }) => {
      await store.linkWhatsAppContactToUser(phone, authData.user!.id);
    }).catch(console.error);
  }

  if (error) {
    console.error('Supabase signup error:', error)
    let userMsg = error.message
    if (error.message.includes('rate limit') || error.status === 429) {
      userMsg = 'Email confirmation limit reached on Supabase. In your Supabase Dashboard under Authentication -> Providers -> Email, please turn OFF "Confirm email" to enable instant member registrations.'
    } else if (error.message.includes('invalid') && error.message.toLowerCase().includes('email')) {
      userMsg = 'Please enter a standard valid email address (e.g., using @gmail.com or @yahoo.com). Test domains like @example.com are blocked by Supabase.'
    }
    redirect(`/register?message=${encodeURIComponent(userMsg)}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  // If email confirmation is required by Supabase settings, session will be null
  if (!authData.session) {
    redirect(`/login?message=${encodeURIComponent('Account registered! If email confirmation is enabled in your Supabase project, please check your inbox to confirm, or turn off "Confirm email" in Supabase settings for instant login.')}&redirect=${encodeURIComponent(redirectTarget)}`)
  }

  revalidatePath('/', 'layout')
  redirect(redirectTarget)
}
